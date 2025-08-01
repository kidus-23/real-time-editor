import { useState } from "react";
import {
  ChevronDown,
  Plus,
  Search,
  FileText,
  Calendar,
  Settings,
  Users,
  Bot,
  Home,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface SidebarProps {
  className?: string;
  onPageSelect?: (page: string) => void;
  currentPage?: string;
  onSearchOpen?: () => void;
  onNewPageOpen?: () => void;
  onInviteMembersOpen?: () => void;
  pages?: string[];
}

export function Sidebar({
  className,
  onPageSelect,
  currentPage,
  onSearchOpen,
  onNewPageOpen,
  onInviteMembersOpen,
  pages = []
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isCompact } = useTheme();

  const navigationItems = [
    { icon: Search, label: "Search", shortcut: "⌘K", action: onSearchOpen },
    { icon: Home, label: "Home", action: () => onPageSelect?.("Home") },
    { icon: FileText, label: "All pages", action: () => onPageSelect?.("All pages") },
    { icon: Calendar, label: "Calendar", action: () => onPageSelect?.("Calendar") },
    { icon: Settings, label: "Settings & members", action: () => onPageSelect?.("Settings & members") },
  ];

  const workspaceItems = pages.map(page => ({
    icon: page === "Personal Home" ? Star : FileText,
    label: page
  }));

  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen overflow-y-auto sidebar",
      isCollapsed ? "w-16" : isCompact ? "w-52" : "w-64",
      className
    )}>
      <div className={cn("p-3", isCompact && "p-2")}>
        {/* Header */}
        <div className={cn("flex items-center justify-between mb-4", isCompact && "mb-3")}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center text-white text-sm font-semibold">
              K
            </div>
            {!isCollapsed && <span className="font-medium">Koba's Notion</span>}
          </div>
          {!isCollapsed && (
            <button className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <Settings size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className={cn("space-y-1 mb-6", isCompact && "space-y-0.5 mb-4")}>
          {navigationItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-md transition-colors nav-item",
                isCompact && "py-1 text-xs"
              )}
            >
              <item.icon size={16} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs text-sidebar-foreground/50">{item.shortcut}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Workspace Section */}
        {!isCollapsed && (
          <div>
            <div className={cn("flex items-center justify-between mb-2", isCompact && "mb-1")}>
              <div className="flex items-center gap-1">
                <ChevronDown size={14} className="text-sidebar-foreground/60" />
                <span className="text-sm font-medium">Private</span>
              </div>
              <button className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <Plus size={14} />
              </button>
            </div>

            <div className={cn("space-y-0.5", isCompact && "space-y-0")}>
              {workspaceItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onPageSelect?.(item.label)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors workspace-item",
                    currentPage === item.label
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
                    isCompact && "py-0.5 text-xs"
                  )}
                >
                  <item.icon size={14} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Add page button */}
            <button
              onClick={onNewPageOpen}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors mt-2",
                isCompact && "py-1 text-xs mt-1"
              )}
            >
              <Plus size={14} />
              <span>New page</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn("mt-auto p-3 border-t border-sidebar-border", isCompact && "p-2")}>
        <button
          onClick={onInviteMembersOpen}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-md transition-colors",
            isCompact && "py-1 text-xs"
          )}
        >
          <Users size={16} />
          {!isCollapsed && <span>Invite members</span>}
        </button>
      </div>
    </div>
  );
}
