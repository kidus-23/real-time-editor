// components/Chatbar.tsx
'use client'

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { MessagesSquare, X, Bot, Send, Loader2, Settings, Users, FileText, Copy, Check } from "lucide-react"
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
import { AI_MODELS } from "@/lib/constants"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "@/firebase"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"
import APIKeySettings from "@/components/APIKeySettings"
import ReactMarkdown from 'react-markdown'

// Build model categories from AI_MODELS to ensure UI only shows supported models
/* eslint-disable @typescript-eslint/no-explicit-any */
const MODEL_CATEGORIES: Record<string, { id: string; name: string; description?: string }[]> = {
  OpenAI: Object.entries(AI_MODELS.OPENAI).map(([id, meta]) => ({ id, name: (meta as any).name || id, description: (meta as any).type })),
  Gemini: Object.entries(AI_MODELS.GEMINI).map(([id, meta]) => ({ id, name: (meta as any).name || id, description: (meta as any).type })),
};
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  timestamp: Timestamp | null
}

function Chatbar({ className = '' }: { className?: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [teamMessages, setTeamMessages] = useState<TeamChatMessage[]>([])
  const [input, setInput] = useState('')
  const [teamChatInput, setTeamChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Default to a model known in `lib/constants.ts` to avoid sending unsupported provider formats
  const [activeModel, setActiveModel] = useState('gemini-2.5-flash') // Default model
  const [showAPIKeySettings, setShowAPIKeySettings] = useState(false)
  const [useDocumentContext, setUseDocumentContext] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const teamChatEndRef = useRef<HTMLDivElement>(null)

  const pathname = usePathname()
  const { user } = useUser()
  const { t } = useTranslation()

  // Check if we're in a document page
  const isDocumentPage = pathname?.startsWith('/doc/')
  const roomId = isDocumentPage ? pathname.split('/').pop() : null

  // localStorage utilities for tracking last read timestamp
  const getLastReadTimestamp = (roomId: string): number => {
    if (typeof window === 'undefined') return Date.now()
    const stored = localStorage.getItem(`teamchat-lastread-${roomId}`)
    return stored ? parseInt(stored) : 0
  }

  const setLastReadTimestamp = (roomId: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`teamchat-lastread-${roomId}`, Date.now().toString())
  }

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    setTimeout(() => scrollToBottom(messagesEndRef), 100)
  }, [messages, isLoading])

  useEffect(() => {
    setTimeout(() => scrollToBottom(teamChatEndRef), 100)
  }, [teamMessages])

  // Reset to chat tab when sheet closes
  useEffect(() => {
    if (!isOpen) {
      // If user was viewing Team Chat, save the timestamp before closing
      if (activeTab === 'teamchat' && roomId) {
        setLastReadTimestamp(roomId)
      }
      setActiveTab('chat')
    }
  }, [isOpen, activeTab, roomId])

  // Clear notifications when Team Chat is opened
  useEffect(() => {
    if (isOpen && activeTab === 'teamchat' && roomId) {
      setLastReadTimestamp(roomId)
      setUnreadCount(0)
    }
  }, [isOpen, activeTab, roomId])

  // Subscribe to team chat messages for the current document
  useEffect(() => {
    if (!roomId || !user) return

    const teamChatRef = collection(db, "teamChats", roomId, "messages")
    const q = query(teamChatRef, orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: TeamChatMessage[] = []
      const isViewingTeamChat = isOpen && activeTab === 'teamchat'

      // Get the last read timestamp from storage
      const lastRead = getLastReadTimestamp(roomId)
      let newUnreadCount = 0

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<TeamChatMessage, 'id'>
        messages.push({
          id: doc.id,
          ...data
        })

        // Count unread messages: not from user, newer than lastRead, and not currently viewing
        if (!isViewingTeamChat &&
          data.userId !== user.emailAddresses[0].emailAddress &&
          data.timestamp?.toMillis &&
          data.timestamp.toMillis() > lastRead) {
          newUnreadCount++
        }
      })

      setTeamMessages(messages)

      // If viewing Team Chat, clear badge and update timestamp
      if (isViewingTeamChat) {
        setUnreadCount(0)
        setLastReadTimestamp(roomId)
      } else {
        setUnreadCount(newUnreadCount)
      }
    })

    return () => unsubscribe()
  }, [roomId, user, isOpen, activeTab])

  // Function to get document content
  const getDocumentContent = async () => {
    if (!isDocumentPage || !roomId) {
      return null
    }

    try {
      // Get the document content from the DOM
      const container = document.querySelector('.bn-container')
      if (!container) {
        console.warn('Editor container not found')
        return null
      }

      // Get all text content, including headers and content
      const editorContent = container.textContent || ''
      if (!editorContent.trim()) {
        console.warn('Empty document content')
        return null
      }

      return editorContent
    } catch (error) {
      console.error('Error getting document content:', error)
      return null
    }
  }

  // Toggle document context
  const toggleDocumentContext = async () => {
    if (!useDocumentContext) {
      // If enabling document context, get the document content
      await getDocumentContent()
    }
    setUseDocumentContext(!useDocumentContext)
  }

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
      // If document context is enabled, get the latest content
      let context = null
      if (useDocumentContext) {
        context = await getDocumentContent()
      }

      // Get user's API keys from localStorage
      let userApiKeys: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('user-api-keys')
        if (stored) {
          try {
            userApiKeys = JSON.parse(stored)
          } catch (e) {
            console.error('Failed to parse API keys:', e)
          }
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          model: activeModel,
          documentContext: context,
          userApiKeys: userApiKeys
        }),
      })

      if (!response.ok) {
        // Try to extract error message from body
        let errorMsg = 'Failed to get response'
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorData.message || errorMsg
        } catch {
          // Ignore parse error
        }
        throw new Error(errorMsg)
      }

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
      const errorMessage = error instanceof Error ? error.message : t("chatbar.error")
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
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

  // Determine if Team Chat tab should be shown
  const showTeamChat = isDocumentPage && roomId

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="relative h-12 w-12 rounded-full bg-primary shadow-lg hover:shadow-primary/25 transition-all duration-300"
        >
          <MessagesSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[540px] p-0 flex flex-col h-full bg-white dark:bg-[#0f0f0f] border-l border-gray-200 dark:border-gray-800"
        >
          <Tabs defaultValue="chat" className="flex flex-col h-full overflow-hidden" onValueChange={(value) => setActiveTab(value as 'chat' | 'teamchat')}>
            {/* Fixed Header */}
            <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-[#0f0f0f]">
              <div className="px-4 py-2 flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4" />
                  {t("chatbar.title")}
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowAPIKeySettings(true)}
                    title="API Key Settings"
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
              <TabsList className="w-full justify-start rounded-none border-0 bg-transparent p-0 bg-white dark:bg-[#0f0f0f]">
                <TabsTrigger
                  value="chat"
                  className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <MessagesSquare className="h-4 w-4 mr-2" />
                  {t("chatbar.tabs.chat")}
                </TabsTrigger>
                {showTeamChat && (
                  <TabsTrigger
                    value="teamchat"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors relative"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t("chatbar.tabs.teamChat")}
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-5 min-w-5 flex items-center justify-center p-0 px-1"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Chat Tab */}
            <TabsContent
              value="chat"
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex overflow-x-auto"
            >
              {/* Scrollable chat area */}
              <ScrollArea className="flex-1 px-4 overflow-y-scroll">
                <div className="space-y-4 py-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col gap-1",
                        message.role === 'user' ? 'items-end' : 'items-start'
                      )}
                    >
                      <div className="relative group">
                        <div
                          className={cn(
                            "rounded-xl px-4 py-3 max-w-[80%] transition-all duration-200",
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground shadow-md hover-lift'
                              : 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700'
                          )}
                        >
                          {message.role === 'user' ? (
                            message.content
                          ) : (
                            <>
                              <div className="relative pb-8 max-w-[90%] break-words">
                                <ReactMarkdown
                                  components={{
                                    code: ({ children, ...props }) => {
                                      const code = String(children).replace(/\n$/, '')
                                      // Check if the code contains HTML/XML tags or multiple lines
                                      const isCodeBlock = code.includes('<') || code.includes('\n')
                                      
                                      if (isCodeBlock) {
                                        return (
                                          <div className="relative">
                                            <pre className="!mt-0 overflow-x-auto max-w-full">
                                              <code {...props} className="block p-4 bg-zinc-950 dark:bg-zinc-900 text-zinc-50 dark:text-zinc-50 rounded-lg whitespace-pre-wrap break-words">{code}</code>
                                            </pre>
                                          </div>
                                        )
                                      }
                                      // For inline code or simple text, render as inline
                                      return <code {...props} className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">{children}</code>
                                    }
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                                <div className="absolute right-2 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 bg-background/90 backdrop-blur"
                                    onClick={() => {
                                      navigator.clipboard.writeText(message.content)
                                      setCopiedCode('full-' + i)
                                      setTimeout(() => setCopiedCode(null), 2000)
                                    }}
                                    title="Copy full response"
                                  >
                                    {copiedCode === 'full-' + i ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {message.model && (
                        <span className="text-xs text-muted-foreground px-2">
                          {message.model} • {t("chatbar.tokens", { count: message.usage?.total_tokens })}
                        </span>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("chatbar.loading")}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Fixed Footer */}
              <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-white dark:bg-[#0f0f0f] z-10">
                {isDocumentPage && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="document-context"
                      checked={useDocumentContext}
                      onCheckedChange={toggleDocumentContext}
                    />
                    <Label htmlFor="document-context" className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-1" />
                      {t("chatbar.buttons.useDocumentContext")}
                    </Label>
                  </div>
                )}

                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={useDocumentContext ? t("chatbar.placeholders.chatWithContext") : t("chatbar.placeholders.chat")}
                  disabled={isLoading}
                  className="min-h-[80px] max-h-[160px] resize-none bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary/50 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />

                <div className="flex items-center justify-between">
                  <Select value={activeModel} onValueChange={setActiveModel}>
                    <SelectTrigger className="w-[200px] h-8 text-xs bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-700 rounded-lg">
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
                    className="h-8 hover-scale rounded-xl"
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
                className="flex-1 flex flex-col mt-0 data-[state=active]:flex overflow-hidden"
              >
                {/* Scrollable team chat area */}
                <ScrollArea className="flex-1 px-4">
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
                                  <Image src={message.userAvatar} alt={message.userName} width={24} height={24} className="w-full h-full object-cover" />
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
                            "rounded-xl px-4 py-3 max-w-[80%] transition-all duration-200",
                            message.userId === user?.emailAddresses[0].emailAddress
                              ? 'bg-primary text-primary-foreground shadow-md hover-lift'
                              : 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700'
                          )}
                        >
                          {message.content}
                        </div>
                        <span className="text-xs text-muted-foreground px-2">
                          {message.timestamp?.toDate ?
                            message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                            t("chatbar.justNow")}
                        </span>
                      </div>
                    ))}
                    <div ref={teamChatEndRef} />
                  </div>
                </ScrollArea>

                {/* Fixed Footer for Team Chat */}
                <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-[#0f0f0f] z-10">
                  <form onSubmit={handleTeamChatSubmit} className="flex items-center gap-2">
                    <Textarea
                      value={teamChatInput}
                      onChange={(e) => setTeamChatInput(e.target.value)}
                      placeholder={t("chatbar.placeholders.teamChat")}
                      className="min-h-[60px] max-h-[120px] resize-none bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary/50 transition-all"
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
                      className="h-10 w-10 shrink-0 hover-scale rounded-xl"
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

      {/* API Key Settings Dialog */}
      <APIKeySettings
        open={showAPIKeySettings}
        onOpenChange={setShowAPIKeySettings}
      />
    </>
  )
}

export default Chatbar
