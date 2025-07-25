import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { initializeWebSocket } from "@/lib/websocket";
import { startLocationTracking } from "@/lib/location";
import MemberList from "@/components/member-list";
import Chat from "@/components/chat";
import Settings from "@/components/settings";
import QuickActions from "@/components/quick-actions";
import MapView from "@/components/map";

export default function JoinGroup() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [memberName, setMemberName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [currentMember, setCurrentMember] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const groupCode = params.code;
  const [Open, setOpen] = useState<boolean>(false);
  const onOpenChange = () => {
    setOpen(!Open)
  }
  // Check if user is already in a group
  useEffect(() => {
    const storedGroup = localStorage.getItem('currentGroup');
    const storedMember = localStorage.getItem('currentMember');
    if (storedGroup && storedMember) {
      const group = JSON.parse(storedGroup);
      const member = JSON.parse(storedMember);
      setCurrentGroup(group);
      setCurrentMember(member);
      initializeTracking(group, member);
    }
  }, []);

  const { data: group, error } = useQuery({
    queryKey: [`/api/groups/${groupCode}`],
    enabled: !!groupCode && !currentGroup,
    retry: false,
  });

  const initializeTracking = async (group: any, member: any) => {
    try {
      // Initialize WebSocket connection
      const ws = initializeWebSocket(member.id, {
        onMemberUpdated: (updatedMember) => {
          setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m
          ));
        },
        onLocationUpdated: (updatedMember) => {
          setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m
          ));
        },
        onNewMessage: (message) => {
          setMessages(prev => [...prev, message]);
        },
        onMemberLeft: (memberId) => {
          setMembers(prev => prev.filter(m => m.id !== memberId));
        },
        onNewPing: function (ping: any): void {
          throw new Error("Function not implemented.");
        }
      });

      // Start location tracking
      startLocationTracking(member.id, {
        onLocationUpdate: (location) => {
          // Location updates are handled by WebSocket
        },
        onError: (error) => {
          toast({
            title: "Location Error",
            description: error,
            variant: "destructive",
          });
        },
      });

      // Load initial data
      loadGroupData(group.id);
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to group",
        variant: "destructive",
      });
    }
  };

  const loadGroupData = async (groupId: number) => {
    try {
      const [membersResponse, messagesResponse] = await Promise.all([
        fetch(`/api/groups/${groupId}/members`, { credentials: 'include' }),
        fetch(`/api/groups/${groupId}/messages`, { credentials: 'include' }),
      ]);

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Failed to load group data:', error);
    }
  };

  const joinGroup = async () => {
    if (!memberName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!group) {
      toast({
        title: "Error",
        description: "Group not found",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);

    try {
      const response = await apiRequest("POST", `/api/groups/${group?.id}/members`, {
        name: memberName.trim(),
        status: "active",
      });

      const member = await response.json();

      // Store in localStorage
      localStorage.setItem('currentGroup', JSON.stringify(group));
      localStorage.setItem('currentMember', JSON.stringify(member));

      setCurrentGroup(group);
      setCurrentMember(member);

      // Initialize tracking
      await initializeTracking(group, member);

      toast({
        title: "Success",
        description: "Joined group successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join group",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const leaveGroup = async () => {
    if (!currentMember) return;

    try {
      await apiRequest("DELETE", `/api/members/${currentMember.id}`);

      localStorage.removeItem('currentGroup');
      localStorage.removeItem('currentMember');

      navigate('/');

      toast({
        title: "Left Group",
        description: "You have left the group",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (content: string, type: string = "text") => {
    if (!currentGroup || !currentMember) return;

    try {
      await apiRequest("POST", `/api/groups/${currentGroup.id}/messages`, {
        memberId: currentMember.id,
        content,
        type,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const sendPing = async (toMemberId?: number) => {
    if (!currentGroup || !currentMember) return;
    console.log(currentGroup, 'cur');

    try {
      await apiRequest("POST", `/api/groups/${currentGroup.id}/pings`, {
        fromMemberId: currentMember.id,
        toMemberId: toMemberId || null,
      });

      toast({
        title: "Ping Sent",
        description: toMemberId ? "Ping sent to member" : "Ping sent to all members",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send ping",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-[#D32F2F] text-center">Group Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              The group code "{groupCode}" is invalid or the group has expired.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentGroup && !group) {
    return (
      <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#2E7D32]" />
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!currentMember) {
    return (
      <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-[#1B5E20] text-center">
              Join {group?.name || 'Group'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-600 mb-4">
                Group Code: <span className="font-mono font-semibold text-[#2E7D32]">{group?.code}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="memberName" className="text-[#1B5E20]">Your Name</Label>
              <Input
                id="memberName"
                placeholder="Enter your name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="mt-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    joinGroup();
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={joinGroup}
                disabled={isJoining}
                className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Join Group
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="text-[#1B5E20] border-[#1B5E20] hover:bg-[#1B5E20] hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F8E9] flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-[#2E7D32] text-white p-4 shadow-lg relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">Group Tracker</h1>
              <p className="text-green-200 text-sm">{currentGroup?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(true)}
              className="text-white hover:bg-white/20"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="text-white hover:bg-white/20"
            >
              <span className="text-lg">⚙️</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="map-container flex-grow relative z-10">
        <MapView
          members={members}
          currentMember={currentMember}
        />
      </div>

      {/* Member List */}
      <MemberList
        members={members}
        currentMember={currentMember}
        onPingMember={sendPing}
        onInvite={() => {
          // Share group code
          const shareData = {
            title: `Join ${currentGroup?.name}`,
            text: `Join my group with code: ${currentGroup?.code}`,
            url: `${window.location.origin}/join/${currentGroup?.code}`,
          };
          if (navigator.share) {
            navigator.share(shareData);
          } else {
            navigator.clipboard.writeText(shareData.url);
            toast({
              title: "Link Copied",
              description: "Group link copied to clipboard",
            });
          }
        }}
        onPingAll={() => sendPing()}
        Open={Open}
        onOpenChange={onOpenChange}
      />

      {/* Quick Actions */}
      <QuickActions
        onSendMessage={sendMessage}
      />

      {/* Chat Overlay */}
      <Chat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        members={members}
        currentMember={currentMember}
        onSendMessage={sendMessage}
      />

      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentGroup={currentGroup}
        currentMember={currentMember}
        onLeaveGroup={leaveGroup}
        onToggleLocationSharing={async (enabled) => {
          if (currentMember) {
            await apiRequest("PUT", `/api/members/${currentMember.id}/status`, {
              status: currentMember.status,
              locationSharing: enabled,
            });
          }
        }}
        onTogglePings={async (enabled) => {
          if (currentMember) {
            await apiRequest("PUT", `/api/members/${currentMember.id}/status`, {
              status: currentMember.status,
              pingEnabled: enabled,
            });
          }
        }}
      />
    </div>
  );
}
