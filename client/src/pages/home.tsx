import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { MapPin, Users, Plus, QrCode, Code } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { generateQR } from "@/lib/qr-code";

export default function Home() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const { toast } = useToast();
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [currentMember, setCurrentMember] = useState<any>(null);

  // Check if user is already in a group
  useEffect(() => {
    const storedGroup = localStorage.getItem('currentGroup');
    const storedMember = localStorage.getItem('currentMember');
    if (storedGroup && storedMember) {
      setCurrentGroup(JSON.parse(storedGroup));
      setCurrentMember(JSON.parse(storedMember));
    }
  }, []);

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/groups", {
        name: groupName.trim(),
      });

      const group = await response.json();

      // Join the group as the creator
      const memberResponse = await apiRequest("POST", `/api/groups/${group.id}/members`, {
        name: "You",
        status: "active",
      });

      const member = await memberResponse.json();

      // Store in localStorage
      localStorage.setItem('currentGroup', JSON.stringify(group));
      localStorage.setItem('currentMember', JSON.stringify(member));

      setCurrentGroup(group);
      setCurrentMember(member);
      setIsCreateGroupOpen(false);
      setGroupName("");

      toast({
        title: "Success",
        description: "Group created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const leaveGroup = () => {
    localStorage.removeItem('currentGroup');
    localStorage.removeItem('currentMember');
    setCurrentGroup(null);
    setCurrentMember(null);

    toast({
      title: "Left Group",
      description: "You have left the group",
    });
  };

  const shareGroup = async () => {
    if (!currentGroup) return;

    const shareData = {
      title: `Join ${currentGroup.name}`,
      text: `Join my group "${currentGroup.name}" with code: ${currentGroup.code}`,
      url: `${window.location.origin}/join/${currentGroup.code}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied",
          description: "Group link copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share group link",
        variant: "destructive",
      });
    }
  };

  if (currentGroup && currentMember) {
    return (
      <div className="min-h-screen bg-[#F1F8E9]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1B5E20]">
                  <Users className="h-5 w-5" />
                  {currentGroup.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F1F8E9] rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Group Code</p>
                    <p className="font-mono text-lg font-semibold text-[#2E7D32]">{currentGroup.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareGroup}
                      className="text-[#FF7043] border-[#FF7043] hover:bg-[#FF7043] hover:text-white"
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/join/${currentGroup.code}`} className="flex-1">
                    <Button
                      className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Open Group Tracker
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={leaveGroup}
                    className="bg-[#D32F2F] hover:bg-[#B71C1C]"
                  >
                    Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-primary mb-2">Group Tracker</h1>
          <p className="text-muted-foreground text-lg">
            Share your location with friends and family during Girivalam walks
          </p>
        </div>

        {/* Group Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Group */}
          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transform transition">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto">
                    <Plus className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary">Create Group</h3>
                  <p className="text-sm text-muted-foreground">Start a new group and invite others to join</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-primary">Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName" className="text-primary">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., Family Walk Group"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary hover:bg-green-800 text-white" onClick={createGroup}>
                    Create Group
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)} className="text-primary border-primary hover:bg-primary hover:text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Join Group */}
          <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transform transition">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto">
                <Code className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Join Group</h3>
              <p className="text-sm text-muted-foreground">Enter a group code to join an existing group</p>
              <div className="space-y-2">
                <Input
                  placeholder="Enter group code (e.g., GRT-1234)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center font-mono"
                />
                <Link href={`/join/${joinCode}`}>
                  <Button className="w-full bg-secondary hover:bg-orange-600 text-white" disabled={!joinCode.trim()}>
                    Join Group
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary text-center text-2xl">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              {[
                {
                  number: "1",
                  title: "Create or Join",
                  desc: "Start a new group or join using a code",
                  bg: "bg-primary",
                  color: "text-white"
                },
                {
                  number: "2",
                  title: "Share Location",
                  desc: "Allow location sharing to see everyone on the map",
                  bg: "bg-secondary",
                  color: "text-white"
                },
                {
                  number: "3",
                  title: "Stay Connected",
                  desc: "Chat, ping, and track each other in real-time",
                  bg: "bg-accent",
                  color: "text-black"
                }
              ].map((step, idx) => (
                <div key={idx}>
                  <div className={`w-10 h-10 ${step.bg} ${step.color} rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold`}>
                    {step.number}
                  </div>
                  <h4 className="font-semibold text-primary mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  );
}
