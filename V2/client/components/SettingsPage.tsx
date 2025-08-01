import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Settings, 
  Users, 
  Bell, 
  Palette, 
  Lock, 
  Trash2,
  Crown,
  UserX,
  Mail
} from "lucide-react";

export function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Koba's Notion");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const { theme, setTheme, isDark, isCompact, setCompact } = useTheme();

  const members = [
    {
      id: 1,
      name: "Koba",
      email: "koba@example.com",
      role: "Owner",
      avatar: "K",
      isOwner: true
    },
    {
      id: 2,
      name: "John Doe",
      email: "john@example.com", 
      role: "Editor",
      avatar: "J",
      isOwner: false
    }
  ];

  const inviteMember = () => {
    if (inviteEmail.trim()) {
      // TODO: Implement actual invitation
      console.log("Inviting:", inviteEmail);
      setInviteEmail("");
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Settings & Members</h1>
            <p className="text-muted-foreground">
              Manage your workspace settings, members, and preferences.
            </p>
          </div>

          <Tabs defaultValue="workspace" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="workspace" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Workspace
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Workspace Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Workspace name</label>
                    <Input
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public workspace</p>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone to join this workspace
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Workspace
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Workspace Members</h3>
                
                {/* Invite new member */}
                <div className="mb-6 p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Invite members</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && inviteMember()}
                    />
                    <Button onClick={inviteMember} disabled={!inviteEmail.trim()}>
                      <Mail className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                </div>

                {/* Members list */}
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {member.name}
                            {member.isOwner && <Crown className="w-3 h-3 text-yellow-500" />}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{member.role}</span>
                        {!member.isOwner && (
                          <Button variant="ghost" size="sm">
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your workspace
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Comments & mentions</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone mentions you
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Page updates</p>
                      <p className="text-sm text-muted-foreground">
                        Notifications when pages you follow are updated
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Appearance</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark mode</p>
                      <p className="text-sm text-muted-foreground">
                        Use dark theme for the interface
                      </p>
                    </div>
                    <Switch 
                      checked={isDark} 
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact mode</p>
                      <p className="text-sm text-muted-foreground">
                        Reduce spacing between elements
                      </p>
                    </div>
                    <Switch 
                      checked={isCompact} 
                      onCheckedChange={setCompact} 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
