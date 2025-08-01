import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BlockEditor } from "./BlockEditor";
import { SettingsPage } from "./SettingsPage";
import { AIAssistant } from "./AIAssistant";
import { ShareModal } from "./ShareModal";
import { SearchModal } from "./SearchModal";
import { NewPageModal } from "./NewPageModal";
import { InviteMembersModal } from "./InviteMembersModal";
import { useTheme } from "./ThemeProvider";
import { Bot, MoreHorizontal, Share, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditorLayout() {
  const [showAI, setShowAI] = useState(false);
  const [editorContent, setEditorContent] = useState(null);
  const [currentPage, setCurrentPage] = useState("Getting Started");
  const [showShare, setShowShare] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [pages, setPages] = useState([
    "Getting Started",
    "Quick Notes",
    "Personal Home",
    "Task List",
    "Reading List"
  ]);
  const { isCompact } = useTheme();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        onPageSelect={setCurrentPage}
        currentPage={currentPage}
        onSearchOpen={() => setShowSearch(true)}
        onNewPageOpen={() => setShowNewPage(true)}
        onInviteMembersOpen={() => setShowInviteMembers(true)}
        pages={pages}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={cn(
          "border-b border-border px-6 py-3 flex items-center justify-between header",
          isCompact && "px-4 py-2"
        )}>
          <div className="flex items-center gap-3">
            <h1 className={cn(
              "text-lg font-semibold",
              isCompact && "text-base"
            )}>{currentPage}</h1>
            <Star className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAI(true)}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShare(true)}
            >
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentPage === "Settings & members" ? (
            <SettingsPage />
          ) : (
            <div className={cn(
              "h-full px-6 py-4 editor-container",
              isCompact && "px-4 py-3"
            )}>
              <BlockEditor
                onChange={setEditorContent}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        pageName={currentPage}
      />
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onPageSelect={setCurrentPage}
      />
      <NewPageModal
        isOpen={showNewPage}
        onClose={() => setShowNewPage(false)}
        onCreatePage={(name, type) => {
          setPages([...pages, name]);
          setCurrentPage(name);
        }}
      />
      <InviteMembersModal
        isOpen={showInviteMembers}
        onClose={() => setShowInviteMembers(false)}
      />
    </div>
  );
}
