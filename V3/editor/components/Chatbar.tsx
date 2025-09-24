// components/Chatbar.tsx
'use client'

import { useState, useRef, useEffect } from "react"
import { MessagesSquare, Pencil, X, Bot, Send, Loader2, Zap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AI_MODELS, ModelId } from "@/lib/constants"

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

function Chatbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [composerInput, setComposerInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeModel, setActiveModel] = useState('openai/gpt-3.5-turbo') // Set default model
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const handleComposerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composerInput.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: composerInput,
          model: activeModel
        }),
      })

      if (!response.ok) throw new Error('Failed to apply changes')

      setComposerInput('')
      // Here you would typically update the editor content directly
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
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
            <div className="shrink-0 border-b">
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
                <TabsTrigger 
                  value="composer" 
                  className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Composer
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent 
              value="chat" 
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex"
            >
              <ScrollArea className="flex-1 px-4">
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

              <div className="shrink-0 border-t p-4 space-y-4">
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

            {/* Composer Content */}
            <TabsContent 
              value="composer" 
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex"
            >
              <div className="flex-1 p-4">
                <h3 className="font-medium mb-2">Real-time Composition</h3>
                <p className="text-sm text-muted-foreground">
                  Changes will be applied directly to the editor.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Chatbar