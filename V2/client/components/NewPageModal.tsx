import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  FileText, 
  Calendar, 
  Database, 
  Kanban, 
  List,
  Grid3X3,
  Bot,
  Palette
} from "lucide-react";

interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePage: (name: string, type: string) => void;
}

interface PageTemplate {
  id: string;
  name: string;
  icon: any;
  description: string;
  type: 'page' | 'database' | 'template';
}

export function NewPageModal({ isOpen, onClose, onCreatePage }: NewPageModalProps) {
  const [pageName, setPageName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");

  const templates: PageTemplate[] = [
    {
      id: "blank",
      name: "Blank page",
      icon: FileText,
      description: "Start with an empty page",
      type: "page"
    },
    {
      id: "database",
      name: "Database",
      icon: Database,
      description: "Structured data with properties",
      type: "database"
    },
    {
      id: "kanban",
      name: "Kanban board",
      icon: Kanban,
      description: "Visual project management",
      type: "database"
    },
    {
      id: "calendar",
      name: "Calendar",
      icon: Calendar,
      description: "Organize events and deadlines",
      type: "database"
    },
    {
      id: "list",
      name: "Simple list",
      icon: List,
      description: "Organize items in a list",
      type: "database"
    },
    {
      id: "gallery",
      name: "Gallery",
      icon: Grid3X3,
      description: "Visual grid layout",
      type: "database"
    },
    {
      id: "meeting-notes",
      name: "Meeting notes",
      icon: FileText,
      description: "Template for meeting notes",
      type: "template"
    },
    {
      id: "project-plan",
      name: "Project plan",
      icon: Palette,
      description: "Organize project tasks and timeline",
      type: "template"
    }
  ];

  if (!isOpen) return null;

  const handleCreate = () => {
    if (pageName.trim()) {
      onCreatePage(pageName.trim(), selectedTemplate);
      setPageName("");
      setSelectedTemplate("blank");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Create a new page</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Page Name Input */}
          <div>
            <label className="text-sm font-medium block mb-2">Page name</label>
            <Input
              placeholder="Enter page name..."
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {/* Templates */}
          <div>
            <label className="text-sm font-medium block mb-3">Choose a template</label>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedTemplate === template.id
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <template.icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!pageName.trim()}>
            Create page
          </Button>
        </div>
      </div>
    </div>
  );
}
