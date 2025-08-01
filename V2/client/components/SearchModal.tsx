import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  X, 
  FileText, 
  Calendar, 
  Clock, 
  Star,
  Bot,
  ChevronRight
} from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageSelect: (page: string) => void;
}

interface SearchResult {
  type: 'page' | 'recent' | 'suggestion';
  title: string;
  subtitle?: string;
  icon: any;
  action?: () => void;
}

export function SearchModal({ isOpen, onClose, onPageSelect }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allPages = [
    { title: "Getting Started", icon: FileText, type: 'page' as const },
    { title: "Quick Notes", icon: FileText, type: 'page' as const },
    { title: "Personal Home", icon: Star, type: 'page' as const },
    { title: "Task List", icon: FileText, type: 'page' as const },
    { title: "Reading List", icon: FileText, type: 'page' as const },
  ];

  const recentItems = [
    { title: "Getting Started", subtitle: "Opened 2 minutes ago", icon: Clock, type: 'recent' as const },
    { title: "Quick Notes", subtitle: "Opened 1 hour ago", icon: Clock, type: 'recent' as const },
  ];

  const suggestions = [
    { title: "Create new page", icon: FileText, type: 'suggestion' as const },
    { title: "Ask AI assistant", icon: Bot, type: 'suggestion' as const },
    { title: "Calendar", icon: Calendar, type: 'suggestion' as const },
  ];

  const filteredResults = query.trim() 
    ? allPages.filter(page => 
        page.title.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'page') {
      onPageSelect(result.title);
      onClose();
    } else if (result.action) {
      result.action();
    }
    setQuery("");
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open search modal
          setQuery("");
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-background rounded-lg w-full max-w-2xl mx-4 border border-border shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search for anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
          />
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim() ? (
            // Search Results
            <div className="p-2">
              {filteredResults.length > 0 ? (
                <div>
                  <div className="text-xs text-muted-foreground px-3 py-2 font-medium">
                    Pages
                  </div>
                  {filteredResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md transition-colors text-left"
                    >
                      <result.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1">{result.title}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>
          ) : (
            // Default state - Recent and Suggestions
            <div className="p-2 space-y-4">
              {/* Recent */}
              <div>
                <div className="text-xs text-muted-foreground px-3 py-2 font-medium">
                  Recent
                </div>
                {recentItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Suggestions */}
              <div>
                <div className="text-xs text-muted-foreground px-3 py-2 font-medium">
                  Suggestions
                </div>
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Press ↵ to select</span>
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
