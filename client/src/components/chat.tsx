import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send } from "lucide-react";

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  members: any[];
  currentMember: any;
  onSendMessage: (content: string, type?: string) => void;
}

export default function Chat({ 
  isOpen, 
  onClose, 
  messages, 
  members, 
  currentMember, 
  onSendMessage 
}: ChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    onSendMessage(messageInput.trim());
    setMessageInput("");
  };

  const getMemberById = (id: number) => {
    return members.find(m => m.id === id);
  };

  const getMemberColor = (memberId: number) => {
    if (memberId === currentMember?.id) return '#2E7D32';
    
    const colors = ['#FF7043', '#2196F3', '#9C27B0', '#FF9800', '#795548'];
    return colors[memberId % colors.length];
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-4 animate-in slide-in-from-bottom-2 duration-300 chat-overlay">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1B5E20]">Group Chat</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-96 overflow-y-auto space-y-3 mb-4">
          {messages.map((message) => {
            const member = getMemberById(message.memberId);
            const isCurrentUser = message.memberId === currentMember?.id;
            
            return (
              <div 
                key={message.id}
                className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
                  style={{ backgroundColor: getMemberColor(message.memberId) }}
                >
                  {member?.name.charAt(0) || '?'}
                </div>
                <div className={`max-w-xs ${isCurrentUser ? 'text-right' : ''}`}>
                  <div 
                    className={`rounded-lg p-3 ${
                      isCurrentUser 
                        ? 'bg-[#2E7D32] text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {member?.name || 'Unknown'}
                    </p>
                    <p>{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            className="flex-1 border-gray-300 focus:border-[#2E7D32]"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
