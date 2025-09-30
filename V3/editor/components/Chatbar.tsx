// components/Chatbar.tsx
'use client'

import { useState, useRef, useEffect } from "react"
import { MessagesSquare, Pencil, X, Bot, Send, Loader2, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AI_MODELS, ModelId } from "@/lib/constants"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore"
import { db } from "@/firebase"

// Import useRoom but don't use it directly
import { useRoom } from "@liveblocks/react"

// Define model categories and their models
const MODEL_CATEGORIES = {
  "Featured": [
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", description: "Most capable GPT-4 model" },
    { id: "anthropic/claude-2", name: "Claude 2", description: "Anthropic's most capable model" },
    { id: "google/gemini-pro", name: "Gemini Pro", description: "Google's latest model" },
  ],
  "Fast & Efficient": [
    { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and efficient" },
    { id: "x-ai/grok-4-fast:free", name: "Grok 4 Fast", description: "Quick responses" },
    { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", description: "Balanced speed and quality" },
  ],
  "Open Source": [
    { id: "meta-llama/llama-2-70b-chat", name: "Llama 2 70B", description: "Meta's largest model" },
    { id: "mistralai/mixtral-8x7b", name: "Mixtral 8x7B", description: "Mixture of experts model" },
    { id: "phind/phind-codellama-34b", name: "Phind 34B", description: "Specialized for code" },
  ],
  "Specialized": [
    { id: "meta-llama/codellama-34b", name: "CodeLlama 34B", description: "Code generation expert" },
    { id: "anthropic/claude-2-100k", name: "Claude 2 (100k)", description: "Long context support" },
    { id: "perplexity/pplx-70b-chat", name: "PPLX 70B", description: "Research focused" },
  ]
} as const;

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'loading' | 'error' | 'success'
  model?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface TeamChatMessage {
  id?: string
  content: string
  userId: string
  userName: string
  userAvatar?: string
  timestamp: any
}

function Chatbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [teamMessages, setTeamMessages] = useState<TeamChatMessage[]>([])
  const [input, setInput] = useState('')
  const [teamChatInput, setTeamChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeModel, setActiveModel] = useState('x-ai/grok-4-fast:free') // Default model
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const teamChatEndRef = useRef<HTMLDivElement>(null)
  
  const pathname = usePathname()
  const { user } = useUser()
  
  // Check if we're in a document page
  const isDocumentPage = pathname?.startsWith('/doc/')
  const roomId = isDocumentPage ? pathname.split('/').pop() : null
  
  // Only try to use room context if we're in a document page
  let room: { id: string } | null = null
  try {
    // This will throw an error if not in a RoomProvider context
    if (isDocumentPage) {
      // @ts-ignore - We're handling the error if this fails
      room = useRoom()
    }
  } catch (error) {
    console.log('Not in a room context')
    room = null
  }

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom(messagesEndRef)
  }, [messages])

  useEffect(() => {
    scrollToBottom(teamChatEndRef)
  }, [teamMessages])

  // Subscribe to team chat messages for the current document
  useEffect(() => {
    if (!roomId) return

    const teamChatRef = collection(db, "teamChats", roomId, "messages")
    const q = query(teamChatRef, orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: TeamChatMessage[] = []
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data() as Omit<TeamChatMessage, 'id'>
        })
      })
      setTeamMessages(messages)
    })

    return () => unsubscribe()
  }, [roomId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, newMessage],
          model: activeModel 
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        status: 'success',
        model: data.model,
        usage: data.usage
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
        status: 'error'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeamChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamChatInput.trim() || !user || !roomId) return

    try {
      // Add message to Firebase
      await addDoc(collection(db, "teamChats", roomId, "messages"), {
        content: teamChatInput,
        userId: user.emailAddresses[0].emailAddress,
        userName: user.fullName || user.username || user.emailAddresses[0].emailAddress,
        userAvatar: user.imageUrl,
        timestamp: serverTimestamp()
      })

      setTeamChatInput('')
    } catch (error) {
      console.error('Error sending team chat message:', error)
    }
  }

  const getModelDisplayName = (modelId: ModelId) => {
    for (const provider of Object.values(AI_MODELS)) {
      if (modelId in provider) {
        return provider[modelId as keyof typeof provider].name;
      }
    }
    return modelId;
  };

  // Determine if Team Chat tab should be shown
  const showTeamChat = isDocumentPage && roomId

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-primary shadow-lg hover:shadow-primary/25 transition-all duration-300"
      >
        <MessagesSquare className="h-5 w-5" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className="w-[400px] sm:w-[540px] p-0 flex flex-col h-screen"
        >
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            {/* Fixed Header */}
            <div className="shrink-0 border-b sticky top-0 z-10 bg-background">
              <div className="px-4 py-2 flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4" />
                  AI Assistant
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
              </div>
              <TabsList className="w-full justify-start rounded-none border-0 bg-transparent p-0">
                <TabsTrigger 
                  value="chat" 
                  className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <MessagesSquare className="h-4 w-4 mr-2" />
                  Chat
                </TabsTrigger>
                {showTeamChat && (
                  <TabsTrigger 
                    value="teamchat" 
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Team Chat
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Chat Tab */}
            <TabsContent 
              value="chat" 
              className="flex-1 flex flex-col overflow-y-auto mt-0 data-[state=active]:flex relative"
            >
              {/* Scrollable chat area */}
              <ScrollArea className="flex-1 overflow-y-auto  px-4">
                <div className="space-y-4 py-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col gap-1",
                        message.role === 'user' ? 'items-end' : 'items-start'
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[80%]",
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        )}
                      >
                        {message.content}
                      </div>
                      {message.model && (
                        <span className="text-xs text-muted-foreground px-2">
                          {message.model} • {message.usage?.total_tokens} tokens
                        </span>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Fixed Footer */}
              <div className="shrink-0 border-t p-4 space-y-4 bg-background z-10">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message AI assistant..."
                  disabled={isLoading}
                  className="min-h-[80px] max-h-[160px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                
                <div className="flex items-center justify-between">
                  <Select value={activeModel} onValueChange={setActiveModel}>
                    <SelectTrigger className="w-[200px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MODEL_CATEGORIES).map(([category, models]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {category}
                          </div>
                          {models.map((model) => (
                            <SelectItem 
                              key={model.id} 
                              value={model.id}
                              className="flex flex-col items-start"
                            >
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.description}
                              </span>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    type="submit" 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    size="sm"
                    className="h-8"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Team Chat Content */}
            {showTeamChat && (
              <TabsContent 
                value="teamchat" 
                className="flex-1 flex flex-col mt-0 data-[state=active]:flex"
              >
                {/* Scrollable team chat area */}
                <ScrollArea className="flex-1 overflow-y-auto px-4">
                  <div className="space-y-4 py-4">
                    {teamMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col gap-1",
                          message.userId === user?.emailAddresses[0].emailAddress ? 'items-end' : 'items-start'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {message.userId !== user?.emailAddresses[0].emailAddress && (
                            <div className="flex items-center gap-1">
                              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-medium">
                                {message.userAvatar ? (
                                  <img src={message.userAvatar} alt={message.userName} className="w-full h-full object-cover" />
                                ) : (
                                  message.userName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="text-xs font-medium">{message.userName}</span>
                            </div>
                          )}
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 max-w-[80%]",
                            message.userId === user?.emailAddresses[0].emailAddress
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {message.content}
                        </div>
                        <span className="text-xs text-muted-foreground px-2">
                          {message.timestamp?.toDate ? 
                            message.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                            'Just now'}
                        </span>
                      </div>
                    ))}
                    <div ref={teamChatEndRef} />
                  </div>
                </ScrollArea>

                {/* Fixed Footer for Team Chat */}
                <div className="shrink-0 border-t p-4 bg-background z-10">
                  <form onSubmit={handleTeamChatSubmit} className="flex items-center gap-2">
                    <Textarea
                      value={teamChatInput}
                      onChange={(e) => setTeamChatInput(e.target.value)}
                      placeholder="Message your team..."
                      className="min-h-[60px] max-h-[120px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTeamChatSubmit(e);
                        }
                      }}
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      className="h-10 w-10 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Chatbar
