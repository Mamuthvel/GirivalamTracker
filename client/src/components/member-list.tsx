import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Bell } from "lucide-react";

interface MemberListProps {
  members: any[];
  currentMember: any;
  onPingMember: (memberId: number) => void;
  onInvite: () => void;
  onPingAll: () => void;
}

export default function MemberList({ 
  members, 
  currentMember, 
  onPingMember, 
  onInvite, 
  onPingAll 
}: MemberListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✓';
      case 'paused': return '⏸';
      case 'offline': return '✗';
      default: return '?';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'paused': return '#FFC107';
      case 'offline': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string, lastSeen: string) => {
    const time = new Date(lastSeen).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    switch (status) {
      case 'active': return `Active • ${time}`;
      case 'paused': return `Paused • ${time}`;
      case 'offline': return `Offline • ${time}`;
      default: return `Unknown • ${time}`;
    }
  };

  const getMemberColor = (memberId: number) => {
    if (memberId === currentMember?.id) return '#2E7D32';
    
    const colors = ['#FF7043', '#2196F3', '#9C27B0', '#FF9800', '#795548'];
    return colors[memberId % colors.length];
  };

  const calculateDistance = (member: any) => {
    if (!currentMember?.latitude || !currentMember?.longitude || 
        !member.latitude || !member.longitude || 
        member.id === currentMember.id) {
      return member.id === currentMember.id ? '0m' : 'Unknown';
    }

    const R = 6371e3; // Earth's radius in meters
    const φ1 = currentMember.latitude * Math.PI / 180;
    const φ2 = member.latitude * Math.PI / 180;
    const Δφ = (member.latitude - currentMember.latitude) * Math.PI / 180;
    const Δλ = (member.longitude - currentMember.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = Math.round(R * c);

    return distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-4 z-10 member-list">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1B5E20] flex items-center gap-2">
          <Users className="h-5 w-5" />
          Group Members ({members.length})
        </h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm"
            onClick={onInvite}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Invite
          </Button>
          <Button 
            size="sm"
            onClick={onPingAll}
            className="bg-[#FF7043] hover:bg-[#E64A19] text-white"
          >
            <Bell className="h-4 w-4 mr-1" />
            Ping All
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto">
        {members.map((member) => (
          <div 
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: getMemberColor(member.id) }}
                >
                  {member.name.charAt(0)}
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ backgroundColor: getStatusColor(member.status) }}
                >
                  <span className="text-white text-xs">
                    {getStatusIcon(member.status)}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-medium text-[#1B5E20]">
                  {member.name}
                  {member.id === currentMember?.id && ' (You)'}
                </p>
                <p className="text-sm text-gray-600">
                  {getStatusText(member.status, member.lastSeen)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {calculateDistance(member)}
              </p>
              {member.id !== currentMember?.id && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onPingMember(member.id)}
                  className="text-[#2E7D32] hover:text-[#1B5E20] hover:bg-[#2E7D32]/10 p-1 h-auto"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Ping
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
