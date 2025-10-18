'use client';

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { db } from "@/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, setDoc, Timestamp, onSnapshot, getDoc } from "firebase/firestore";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Clock, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { diffChars } from "diff";
import { toast } from "sonner";

interface Version {
  id: string;
  content: string;
  title: string;
  timestamp: Timestamp;
  userId: string;
  userName: string;
}

import { BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

interface VersionHistoryProps {
  documentId: string;
  editor: BlockNoteEditor;
  onClose?: () => void;
}

function PreviewEditor({ content }: { content: string }) {
  // Try to parse content as JSON; if it fails, fall back to a simple paragraph block
  let initialContent: any;
  if (typeof content === 'string') {
    try {
      initialContent = JSON.parse(content);
    } catch (e) {
      initialContent = [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        },
      ];
    }
  } else {
    initialContent = content;
  }

  const previewEditor = useCreateBlockNote({
    initialContent,
    domAttributes: {
      editor: {
        class: 'read-only-editor'
      }
    }
  });

  // Wait for editor to be fully initialized
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (previewEditor) {
      // Set editor as read-only after initialization
      previewEditor.isEditable = false;
      setIsEditorReady(true);
    }
  }, [previewEditor]);

  if (!previewEditor || !isEditorReady) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        Loading preview...
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <BlockNoteView
        editor={previewEditor}
        theme="light"
      />
    </div>
  );
}

export default function VersionHistory({ documentId, editor, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  const [currentContent, setCurrentContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const { user } = useUser();

  // Fetch versions on component mount
  useEffect(() => {
    let unsubscribe: () => void;
    
    const fetchVersions = async () => {
      setLoading(true);
      try {
        // Get current document content
        const docRef = doc(db, "documents", documentId);
        // Subscribe to document updates
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setCurrentContent(docSnap.data().content || "");
          }
        });

        // Get versions
        const versionsRef = collection(db, "documents", documentId, "versions");
        const q = query(versionsRef, orderBy("timestamp", "desc"));
        
        const versionsSnapshot = await getDocs(q);
        const versionsData = versionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Version));
        
        setVersions(versionsData);
        
        // Select the most recent version by default
        if (versionsData.length > 0) {
          setSelectedVersion(versionsData[0]);
        }
      } catch (error) {
        console.error("Error fetching versions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [documentId]);

  // Create a new version snapshot (for demonstration - in production this would be on a timer)
  useEffect(() => {
    if (!documentId || !user) return;

    let lastContent = '';
    let lastTitle = '';

    // Create automatic snapshot every 30 seconds
    const intervalId = setInterval(async () => {
      try {
        const docRef = doc(db, "documents", documentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Only save if content or title has changed
          if (data.content !== lastContent || data.title !== lastTitle) {
            lastContent = data.content;
            lastTitle = data.title;
            
            // Create a new version
            const versionRef = doc(collection(db, "documents", documentId, "versions"));
            await setDoc(versionRef, {
              content: data.content,
              title: data.title,
              timestamp: Timestamp.now(),
              userId: user.id,
              userName: user.fullName || user.username || user.id,
              autoSaved: true // Flag to indicate this was auto-saved
            });
            
            // Refresh versions list
            const versionsRef = collection(db, "documents", documentId, "versions");
            const q = query(versionsRef, orderBy("timestamp", "desc"));
            const versionsSnapshot = await getDocs(q);
            const versionsData = versionsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Version));
            
            setVersions(versionsData);
          }
        }
      } catch (error) {
        console.error("Error in auto-save:", error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [documentId, user]);

  // Fix the createSnapshot function
  const createSnapshot = async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, "documents", documentId);
      const docSnap = await getDoc(docRef); // Changed from getDocs(query(docRef))
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Create a new version
        const versionRef = doc(collection(db, "documents", documentId, "versions"));
        await setDoc(versionRef, {
          content: data.content,
          title: data.title,
          timestamp: Timestamp.now(),
          userId: user.id,
          userName: user.fullName || user.username || user.id,
          manualSave: true // Flag to indicate this was manually saved
        });
        
        // Refresh versions
        const versionsRef = collection(db, "documents", documentId, "versions");
        const q = query(versionsRef, orderBy("timestamp", "desc"));
        const versionsSnapshot = await getDocs(q);
        const versionsData = versionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Version));
        
        setVersions(versionsData);
      }
    } catch (error) {
      console.error("Error creating snapshot:", error);
    }
  };

  // Restore a version
  const restoreVersion = async () => {
    if (!selectedVersion) return;
    
    setRestoring(true);
    try {
      // Parse the content safely; if it's not JSON, wrap as a paragraph block
      let content: any;
      try {
        content = JSON.parse(selectedVersion.content || "[]");
      } catch (e) {
        content = [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: selectedVersion.content || '',
              },
            ],
          },
        ];
      }

      // Update the editor content
      await editor.replaceBlocks(editor.topLevelBlocks, content);
      
      // Update the database
      await updateDoc(doc(db, "documents", documentId), {
        content: selectedVersion.content,
        title: selectedVersion.title,
        lastUpdated: Timestamp.now()
      });
      
      // Create a snapshot of the restoration
      if (user) {
        const versionRef = doc(collection(db, "documents", documentId, "versions"));
        await setDoc(versionRef, {
          content: selectedVersion.content,
          title: selectedVersion.title,
          timestamp: Timestamp.now(),
          userId: user.id,
          userName: `${user.fullName || user.username || user.id} (restored version)`,
          restoredFromId: selectedVersion.id
        });
        
        // Refresh versions list
        const versionsRef = collection(db, "documents", documentId, "versions");
        const q = query(versionsRef, orderBy("timestamp", "desc"));
        const versionsSnapshot = await getDocs(q);
        const versionsData = versionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Version));
        
        setVersions(versionsData);
      }

      toast.success("Version restored successfully!");
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
    } finally {
      setRestoring(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
  };

  // Generate diff between two versions
  const generateDiff = (currentText: string, selectedText: string) => {
    try {
      // Parse the content if it's in JSON format
      const parseContent = (content: string) => {
        try {
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          if (Array.isArray(parsed)) {
            return parsed.map(block => {
              if (block.content && Array.isArray(block.content)) {
                return block.content.map((item: { type: string; text?: string }) => (item.type === 'text' && item.text ? item.text : '')).join('');
              }
              return '';
            }).join('\n');
          }
          return String(content);
        } catch {
          return String(content);
        }
      };

      const oldText = parseContent(currentText);
      const newText = parseContent(selectedText);
      const differences = diffChars(oldText, newText);
      
      return (
        <div className="whitespace-pre-wrap font-mono text-sm space-y-1">
          {differences.map((part, index) => {
            let className = '';
            if (part.added) {
              className = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1 py-0.5 rounded';
            } else if (part.removed) {
              className = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 line-through px-1 py-0.5 rounded';
            }
            
            return (
              <span key={index} className={className}>
                {part.value}
              </span>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('Error generating diff:', error);
      return (
        <div className="text-red-500">
          Error comparing versions
        </div>
      );
    }
  };

  // Auto-save functionality would be implemented here with a useEffect and timer
  // For demonstration, we'll just have a manual button to create snapshots

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-semibold">Version History</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={createSnapshot}
            disabled={loading}
          >
            <Clock className="h-4 w-4 mr-2" />
            Create Snapshot
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Versions sidebar */}
        <div className="w-1/3 border-r overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h3 className="font-medium">Versions</h3>
            <p className="text-sm text-muted-foreground">
              Showing {versions.length} versions from the last 7 days
            </p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No version history available
                </div>
              ) : (
                versions.map((version) => (
                  <div 
                    key={version.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="font-medium truncate">{version.title || "Untitled"}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>{formatTimestamp(version.timestamp)}</span>
                    </div>
                    <div className="text-xs mt-1">{version.userName}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Version preview */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedVersion ? (
            <>
              <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="changes">Changes</TabsTrigger>
                  </TabsList>
                  
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={restoreVersion}
                    disabled={restoring}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {restoring ? "Restoring..." : "Restore this version"}
                  </Button>
                </div>
                
                <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
                  <div className="prose dark:prose-invert max-w-none">
                    <h1>{selectedVersion.title || "Untitled"}</h1>
                    {selectedVersion.content && (
                      <PreviewEditor content={selectedVersion.content} />
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="changes" className="flex-1 p-4 overflow-auto">
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>Changes from current version</h3>
                    {generateDiff(currentContent, selectedVersion.content)}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a version to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}