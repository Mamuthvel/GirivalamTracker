import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertGroupSchema, 
  insertMemberSchema, 
  createMemberRequestSchema,
  insertMessageSchema, 
  insertPingSchema,
  updateLocationSchema,
  updateMemberStatusSchema
} from "@shared/schema";
import { z } from "zod";

interface WebSocketClient extends WebSocket {
  memberId?: number;
  groupId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<number, WebSocketClient>();

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join' && message.memberId) {
          ws.memberId = message.memberId;
          const member = await storage.getMember(message.memberId);
          if (member) {
            ws.groupId = member.groupId;
            clients.set(message.memberId, ws);
            await storage.updateMemberSocketId(message.memberId, 'connected');
            
            // Broadcast member joined to group
            broadcastToGroup(member.groupId, {
              type: 'member_updated',
              member: await storage.getMember(message.memberId)
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.memberId) {
        clients.delete(ws.memberId);
        await storage.updateMemberSocketId(ws.memberId, null);
        await storage.updateMemberStatus(ws.memberId, { status: 'offline' });
        
        if (ws.groupId) {
          broadcastToGroup(ws.groupId, {
            type: 'member_updated',
            member: await storage.getMember(ws.memberId)
          });
        }
      }
    });
  });

  function broadcastToGroup(groupId: number, message: any) {
    clients.forEach((client, memberId) => {
      if (client.groupId === groupId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Generate unique group code
  function generateGroupCode(): string {
    return `GRT-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Calculate distance between two coordinates in meters
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  }

  // Groups
  app.post('/api/groups', async (req, res) => {
    try {
      const { name } = insertGroupSchema.parse(req.body);
      const code = generateGroupCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const group = await storage.createGroup({
        name,
      }, code, expiresAt);
      
      res.json(group);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.get('/api/groups/:code', async (req, res) => {
    try {
      const group = await storage.getGroupByCode(req.params.code);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check if group has expired
      if (group.expiresAt < new Date()) {
        return res.status(404).json({ error: 'Group has expired' });
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Members
  app.post('/api/groups/:groupId/members', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const memberData = createMemberRequestSchema.parse(req.body);
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      const member = await storage.createMember({
        ...memberData,
        groupId,
      });
      
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.get('/api/groups/:groupId/members', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const members = await storage.getGroupMembers(groupId);
      
      // Calculate distances between members
      const membersWithDistance = members.map(member => {
        const distances = members
          .filter(m => m.id !== member.id && m.latitude && m.longitude)
          .map(m => ({
            memberId: m.id,
            distance: member.latitude && member.longitude 
              ? calculateDistance(member.latitude, member.longitude, m.latitude!, m.longitude!)
              : null
          }));
        
        return {
          ...member,
          distances
        };
      });
      
      res.json(membersWithDistance);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/members/:memberId/location', async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const location = updateLocationSchema.parse(req.body);
      
      const member = await storage.updateMemberLocation(memberId, location);
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // Broadcast location update to group
      broadcastToGroup(member.groupId, {
        type: 'location_updated',
        member
      });
      
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.put('/api/members/:memberId/status', async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const status = updateMemberStatusSchema.parse(req.body);
      
      const member = await storage.updateMemberStatus(memberId, status);
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // Broadcast status update to group
      broadcastToGroup(member.groupId, {
        type: 'member_updated',
        member
      });
      
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.delete('/api/members/:memberId', async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const member = await storage.getMember(memberId);
      
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      await storage.deleteMember(memberId);
      
      // Broadcast member left to group
      broadcastToGroup(member.groupId, {
        type: 'member_left',
        memberId
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Messages
  app.post('/api/groups/:groupId/messages', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const messageData = insertMessageSchema.parse(req.body);
      
      const message = await storage.createMessage({
        ...messageData,
        groupId,
      });
      
      // Broadcast message to group
      broadcastToGroup(groupId, {
        type: 'new_message',
        message
      });
      
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.get('/api/groups/:groupId/messages', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getGroupMessages(groupId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Pings
  app.post('/api/groups/:groupId/pings', async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const pingData = insertPingSchema.parse(req.body);
      
      const ping = await storage.createPing({
        ...pingData,
        groupId,
      });
      
      // Broadcast ping to group
      broadcastToGroup(groupId, {
        type: 'new_ping',
        ping
      });
      
      res.json(ping);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  return httpServer;
}
