import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Mail, 
  Users, 
  Copy, 
  Link2,
  Plus,
  UserCheck
} from "lucide-react";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMembersModal({ isOpen, onClose }: InviteMembersModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("Hey! I'd like to invite you to collaborate on my Notion workspace.");
  const [linkCopied, setLinkCopied] = useState(false);

  const inviteLink = "https://notion.so/invite/abc123def456";

  if (!isOpen) return null;

  const addEmail = () => {
    const email = currentEmail.trim();
    if (email && !emails.includes(email) && email.includes("@")) {
      setEmails([...emails, email]);
      setCurrentEmail("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    } else if (e.key === 'Backspace' && !currentEmail && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const sendInvites = () => {
    if (emails.length > 0) {
      // TODO: Implement actual invitation sending
      console.log("Sending invites to:", emails);
      console.log("Message:", inviteMessage);
      
      // Reset and close
      setEmails([]);
      setCurrentEmail("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-lg mx-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Invite members</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Input */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Email addresses
            </label>
            <div className="border border-input rounded-md p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-ring">
              <div className="flex flex-wrap gap-1 items-center">
                {emails.map((email) => (
                  <Badge 
                    key={email} 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="email"
                  placeholder={emails.length === 0 ? "Enter email addresses..." : ""}
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm"
                />
                {currentEmail && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={addEmail}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or click + to add each email
            </p>
          </div>

          {/* Invite Message */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Personal message (optional)
            </label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="w-full min-h-[80px] p-3 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add a personal message to your invitation..."
            />
          </div>

          {/* Invite Link */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Or share this link
            </label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded border">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <code className="flex-1 text-xs font-mono truncate">{inviteLink}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyInviteLink}
                className="text-xs"
              >
                {linkCopied ? (
                  <>
                    <UserCheck className="w-3 h-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Anyone with this link can join your workspace
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={sendInvites} 
            disabled={emails.length === 0}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send {emails.length > 0 ? `${emails.length} ` : ""}invites
          </Button>
        </div>
      </div>
    </div>
  );
}
