import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Copy, 
  Globe, 
  Lock, 
  Mail, 
  Users, 
  X,
  Link2,
  Settings
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageName: string;
}

export function ShareModal({ isOpen, onClose, pageName }: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `https://notion.so/workspace/${pageName.toLowerCase().replace(/\s+/g, '-')}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const inviteByEmail = () => {
    if (emailInput.trim()) {
      // TODO: Implement actual email invitation
      console.log("Inviting:", emailInput);
      setEmailInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-md mx-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Share "{pageName}"</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Invite People */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Invite people
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteByEmail()}
                className="flex-1"
              />
              <Button onClick={inviteByEmail} disabled={!emailInput.trim()}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Public Access */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Share to web
            </h3>
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Publish to web</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? "Anyone can view this page" : "Only invited people can access"}
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {isPublic && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <code className="flex-1 text-xs font-mono truncate">{shareUrl}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyLink}
                    className="text-xs"
                  >
                    {linkCopied ? "Copied!" : <Copy className="w-3 h-3" />}
                  </Button>
                </div>

                {/* Public permissions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Allow comments</span>
                    <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Allow duplicates</span>
                    <Switch checked={allowDuplicates} onCheckedChange={setAllowDuplicates} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Access */}
          <div>
            <h3 className="text-sm font-medium mb-3">People with access</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  K
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Koba (you)</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
