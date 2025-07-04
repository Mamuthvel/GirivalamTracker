import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Hand, MapPin, Coffee, AlertTriangle } from "lucide-react";

interface QuickActionsProps {
  onSendMessage: (content: string, type?: string) => void;
}

export default function QuickActions({ onSendMessage }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickMessages = [
    {
      icon: Hand,
      text: "Wait here",
      color: "#FFC107",
    },
    {
      icon: MapPin,
      text: "I'm nearby",
      color: "#2E7D32",
    },
    {
      icon: Coffee,
      text: "Take a break",
      color: "#FF7043",
    },
    {
      icon: AlertTriangle,
      text: "Need help",
      color: "#D32F2F",
    },
  ];

  const handleQuickMessage = (message: string) => {
    onSendMessage(message, "quick_message");
    setIsOpen(false);
  };

  return (
    <div className="absolute bottom-72 right-4 z-20">
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-[#FF7043] hover:bg-[#E64A19] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        {isOpen && (
          <Card className="absolute bottom-16 right-0 w-48 animate-in slide-in-from-bottom-2 duration-200">
            <CardContent className="p-2">
              <div className="space-y-2">
                {quickMessages.map((message, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => handleQuickMessage(message.text)}
                    className="w-full justify-start text-left p-3 hover:bg-gray-100 transition-colors"
                  >
                    <message.icon 
                      className="h-4 w-4 mr-3 flex-shrink-0" 
                      style={{ color: message.color }}
                    />
                    <span className="text-sm">{message.text}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
