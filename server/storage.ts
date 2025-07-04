import { 
  groups, 
  members, 
  messages, 
  pings,
  type Group, 
  type Member, 
  type Message, 
  type Ping,
  type InsertGroup, 
  type InsertMember, 
  type InsertMessage, 
  type InsertPing,
  type UpdateLocation,
  type UpdateMemberStatus
} from "@shared/schema";

export interface IStorage {
  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupByCode(code: string): Promise<Group | undefined>;
  deleteExpiredGroups(): Promise<void>;
  
  // Members
  createMember(member: InsertMember): Promise<Member>;
  getMember(id: number): Promise<Member | undefined>;
  getGroupMembers(groupId: number): Promise<Member[]>;
  updateMemberLocation(memberId: number, location: UpdateLocation): Promise<Member | undefined>;
  updateMemberStatus(memberId: number, status: UpdateMemberStatus): Promise<Member | undefined>;
  updateMemberSocketId(memberId: number, socketId: string | null): Promise<Member | undefined>;
  deleteMember(id: number): Promise<void>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getGroupMessages(groupId: number, limit?: number): Promise<Message[]>;
  
  // Pings
  createPing(ping: InsertPing): Promise<Ping>;
  getGroupPings(groupId: number, limit?: number): Promise<Ping[]>;
}

export class MemStorage implements IStorage {
  private groups: Map<number, Group> = new Map();
  private members: Map<number, Member> = new Map();
  private messages: Map<number, Message> = new Map();
  private pings: Map<number, Ping> = new Map();
  private currentGroupId = 1;
  private currentMemberId = 1;
  private currentMessageId = 1;
  private currentPingId = 1;

  // Groups
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const group: Group = {
      id,
      ...insertGroup,
      createdAt: new Date(),
    };
    this.groups.set(id, group);
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupByCode(code: string): Promise<Group | undefined> {
    return Array.from(this.groups.values()).find(group => group.code === code);
  }

  async deleteExpiredGroups(): Promise<void> {
    const now = new Date();
    for (const [id, group] of this.groups.entries()) {
      if (group.expiresAt < now) {
        // Delete group and all associated data
        this.groups.delete(id);
        
        // Delete members
        for (const [memberId, member] of this.members.entries()) {
          if (member.groupId === id) {
            this.members.delete(memberId);
          }
        }
        
        // Delete messages
        for (const [messageId, message] of this.messages.entries()) {
          if (message.groupId === id) {
            this.messages.delete(messageId);
          }
        }
        
        // Delete pings
        for (const [pingId, ping] of this.pings.entries()) {
          if (ping.groupId === id) {
            this.pings.delete(pingId);
          }
        }
      }
    }
  }

  // Members
  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = this.currentMemberId++;
    const member: Member = {
      id,
      ...insertMember,
      lastSeen: new Date(),
    };
    this.members.set(id, member);
    return member;
  }

  async getMember(id: number): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getGroupMembers(groupId: number): Promise<Member[]> {
    return Array.from(this.members.values()).filter(member => member.groupId === groupId);
  }

  async updateMemberLocation(memberId: number, location: UpdateLocation): Promise<Member | undefined> {
    const member = this.members.get(memberId);
    if (!member) return undefined;

    const updatedMember = {
      ...member,
      latitude: location.latitude,
      longitude: location.longitude,
      lastSeen: new Date(),
    };
    this.members.set(memberId, updatedMember);
    return updatedMember;
  }

  async updateMemberStatus(memberId: number, status: UpdateMemberStatus): Promise<Member | undefined> {
    const member = this.members.get(memberId);
    if (!member) return undefined;

    const updatedMember = {
      ...member,
      status: status.status,
      locationSharing: status.locationSharing ?? member.locationSharing,
      pingEnabled: status.pingEnabled ?? member.pingEnabled,
      lastSeen: new Date(),
    };
    this.members.set(memberId, updatedMember);
    return updatedMember;
  }

  async updateMemberSocketId(memberId: number, socketId: string | null): Promise<Member | undefined> {
    const member = this.members.get(memberId);
    if (!member) return undefined;

    const updatedMember = {
      ...member,
      socketId,
      lastSeen: new Date(),
    };
    this.members.set(memberId, updatedMember);
    return updatedMember;
  }

  async deleteMember(id: number): Promise<void> {
    this.members.delete(id);
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      ...insertMessage,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getGroupMessages(groupId: number, limit: number = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.groupId === groupId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .reverse();
  }

  // Pings
  async createPing(insertPing: InsertPing): Promise<Ping> {
    const id = this.currentPingId++;
    const ping: Ping = {
      id,
      ...insertPing,
      createdAt: new Date(),
    };
    this.pings.set(id, ping);
    return ping;
  }

  async getGroupPings(groupId: number, limit: number = 20): Promise<Ping[]> {
    return Array.from(this.pings.values())
      .filter(ping => ping.groupId === groupId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();

// Clean up expired groups every hour
setInterval(() => {
  storage.deleteExpiredGroups();
}, 60 * 60 * 1000);
