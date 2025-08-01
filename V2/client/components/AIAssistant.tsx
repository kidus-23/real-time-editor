import { Bot, ChevronRight, FileText, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  if (!isOpen) return null;

  const templates = [
    {
      icon: FileText,
      title: "Python Cheat Sheet",
      subtitle: "Sheet",
      description: "Quick reference for Python syntax and functions"
    },
    {
      icon: Settings,
      title: "Getting Started",
      subtitle: "Script",
      description: "Step-by-step guide to get started"
    },
    {
      icon: Users,
      title: "New page",
      subtitle: "",
      description: "Create a blank page"
    }
  ];

  const upcomingEvents = [
    {
      title: "Connect AI Meeting Notes with your Calendar events",
      time: "Today\nJul 29",
      description: "Join 30+ workspace and information.",
      action: "Connect Notion Calendar"
    },
    {
      title: "Project check-in",
      time: "Today\nJul 29", 
      description: "Add and stay notes"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
          <p className="text-muted-foreground">
            Ask or find anything from your workspace...
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Ask..."
            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">All sources</span>
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Recently visited */}
        <div className="mb-8">
          <h3 className="text-sm font-medium mb-4">Recently visited</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((template, index) => (
              <button
                key={index}
                className="flex flex-col items-center p-4 border border-input rounded-lg hover:bg-accent transition-colors text-center"
              >
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center mb-2">
                  <template.icon className="w-4 h-4" />
                </div>
                <div className="font-medium text-sm">{template.title}</div>
                {template.subtitle && (
                  <div className="text-xs text-muted-foreground">{template.subtitle}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-4">Upcoming events</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex gap-3 p-3 border border-input rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{event.description}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-pre-line text-right">
                  {event.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
