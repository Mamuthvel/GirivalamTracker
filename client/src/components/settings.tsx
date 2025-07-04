import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Share2, LogOut, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroup: any;
  currentMember: any;
  onLeaveGroup: () => void;
  onToggleLocationSharing: (enabled: boolean) => void;
  onTogglePings: (enabled: boolean) => void;
}

export default function Settings({ 
  isOpen, 
  onClose, 
  currentGroup, 
  currentMember, 
  onLeaveGroup, 
  onToggleLocationSharing, 
  onTogglePings 
}: SettingsProps) {
  const [locationSharing, setLocationSharing] = useState(currentMember?.locationSharing ?? true);
  const [pingsEnabled, setPingsEnabled] = useState(currentMember?.pingEnabled ?? true);
  const { toast } = useToast();

  const handleLocationToggle = (enabled: boolean) => {
    setLocationSharing(enabled);
    onToggleLocationSharing(enabled);
  };

  const handlePingsToggle = (enabled: boolean) => {
    setPingsEnabled(enabled);
    onTogglePings(enabled);
  };

  const shareGroupCode = async () => {
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

  const copyGroupCode = async () => {
    if (!currentGroup) return;
    
    try {
      await navigator.clipboard.writeText(currentGroup.code);
      toast({
        title: "Code Copied",
        description: "Group code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy group code",
        variant: "destructive",
      });
    }
  };

  const getExpirationTime = () => {
    if (!currentGroup?.expiresAt) return '';
    
    const now = new Date();
    const expiresAt = new Date(currentGroup.expiresAt);
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Soon';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1B5E20]">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-[#1B5E20] mb-3">Privacy Controls</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="location-sharing" className="text-gray-700">
                  Share Location
                </Label>
                <Switch
                  id="location-sharing"
                  checked={locationSharing}
                  onCheckedChange={handleLocationToggle}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ping-notifications" className="text-gray-700">
                  Receive Pings
                </Label>
                <Switch
                  id="ping-notifications"
                  checked={pingsEnabled}
                  onCheckedChange={handlePingsToggle}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-[#1B5E20] mb-3">Group Info</h4>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Group Name</p>
                    <p className="font-semibold text-[#1B5E20]">{currentGroup?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Group Code</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-lg font-semibold text-[#2E7D32]">
                        {currentGroup?.code}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={copyGroupCode}
                        className="text-[#2E7D32] hover:text-[#1B5E20]"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expires In</p>
                    <p className="font-medium text-[#FF7043]">{getExpirationTime()}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={shareGroupCode}
                  className="w-full mt-3 text-[#FF7043] border-[#FF7043] hover:bg-[#FF7043] hover:text-white"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Group
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="destructive"
              onClick={onLeaveGroup}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C]"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Group
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Groups expire automatically after 24 hours
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
