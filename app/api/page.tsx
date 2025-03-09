"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Plus, Copy, Check, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { renderMessageContent } from "@/lib/message-parser"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
}

export default function ChatApp() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load sessions from localStorage on initial render
  useEffect(() => {
    const savedSessions = localStorage.getItem("abCodesAiSessions")
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions)
        setSessions(parsedSessions)

        // Set the most recent session as active if there are any
        if (parsedSessions.length > 0) {
          setActiveSessionId(parsedSessions[0].id)
        }
      } catch (error) {
        console.error("Error parsing saved sessions:", error)
        // Create a new session if parsing fails
        createNewSession()
      }
    } else {
      // Create a new session if none exist
      createNewSession()
    }
  }, [])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("abCodesAiSessions", JSON.stringify(sessions))
    }
  }, [sessions])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [activeSessionId, sessions])

  // Focus input when active session changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeSessionId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: `Chat ${sessions.length + 1}`,
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant" as const,
          content: "Hi! I'm Ab-CodesAi, your AI assistant created by AbroTem. How can I help you today?",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    }

    setSessions((prevSessions) => [newSession, ...prevSessions])
    setActiveSessionId(newSession.id)
  }

  const switchSession = (sessionId: string) => {
    setActiveSessionId(sessionId)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !activeSessionId || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    // Update session with user message
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage],
            }
          : session,
      ),
    )

    setInput("")
    setIsLoading(true)

    try {
      // Get conversation history for context
      const activeSession = sessions.find((s) => s.id === activeSessionId)
      if (!activeSession) throw new Error("No active session found")

      const recentMessages = activeSession.messages.slice(-10) // Get last 10 messages for context

      // Format messages for Gemini API
      const formattedMessages = recentMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }))

      // Add the new user message
      formattedMessages.push({
        role: "user",
        parts: [{ text: userMessage.content }],
      })

      // Call Gemini API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: formattedMessages }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from AI")
      }

      const data = await response.json()

      // Add AI response to session
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.text || "I'm sorry, I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      }

      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...session.messages, aiMessage],
                // Update title based on first user message if this is the first exchange
                title: session.messages.length <= 1 ? generateSessionTitle(userMessage.content) : session.title,
              }
            : session,
        ),
      )
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
      }

      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === activeSessionId ? { ...session, messages: [...session.messages, errorMessage] } : session,
        ),
      )
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  const generateSessionTitle = (message: string) => {
    // Generate a title based on the first few words of the message
    const words = message.split(" ")
    const title = words.slice(0, 3).join(" ")
    return title.length > 20 ? title.substring(0, 20) + "..." : title
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const activeMessages = activeSession?.messages || []

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
          <SidebarHeader className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Ab-CodesAi Chat</h2>
            </div>
            <Button onClick={createNewSession} className="flex items-center gap-2 w-full">
              <Plus size={16} /> New Chat
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Chat Sessions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton
                        isActive={session.id === activeSessionId}
                        onClick={() => switchSession(session.id)}
                        className="truncate"
                      >
                        <MessageSquare size={16} />
                        <span className="truncate">{session.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col">
          <header className="flex h-14 items-center border-b px-4 lg:h-[60px] sticky top-0 bg-background z-10">
            <SidebarTrigger />
            <div className="ml-2 font-semibold truncate">{activeSession ? activeSession.title : "No active chat"}</div>
          </header>

          <main className="flex-1 overflow-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4 pb-20">
              {activeMessages.length === 0 ? (
                <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">Start a new conversation</h3>
                    <p className="text-sm text-muted-foreground">Ask Ab-CodesAi a question to get started</p>
                  </div>
                </div>
              ) : (
                activeMessages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn("group flex w-full", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "relative max-w-[85%] rounded-lg p-4",
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {renderMessageContent(message.content)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copied === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span className="sr-only">Copy message</span>
                      </Button>
                      <div className="mt-1 text-xs opacity-50">{formatDate(message.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Ab-CodesAi is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="border-t bg-background p-4 sticky bottom-0">
            <form onSubmit={sendMessage} className="mx-auto flex max-w-3xl items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Message Ab-CodesAi..."
                value={input}
                onChange={handleInputChange}
                className="flex-1"
                disabled={isLoading || !activeSessionId}
              />
              <Button type="submit" disabled={isLoading || !input.trim() || !activeSessionId} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

