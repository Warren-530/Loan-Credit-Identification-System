"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, X, Send, Bot, FileText, GripHorizontal, Maximize2, Minimize2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

interface AICopilotProps {
  applicationId?: string
}

export function AICopilot({ applicationId }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hello! I'm InsightLoan Copilot. I've analyzed this applicant's documents (Application Form, Bank Statement, Loan Essay, Payslip, and Supporting Docs). Ask me anything about their risk profile, transactions, or claims.",
      sources: []
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Draggable Button State
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Resizable Window State
  const [size, setSize] = useState({ width: 384, height: 500 }) // Default w-96 (384px)
  const isResizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  // Handle Button Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen && isMaximized) return // Don't drag if maximized
    if (isOpen) {
        // Window drag logic
        isDragging.current = true
        // Calculate offset from the top-left of the window
        // Note: position.x/y tracks the top-left of the window when open
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    } else {
        // Button drag logic
        isDragging.current = true
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    }
  }

  // Handle Window Resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    resizeStart.current = { 
      x: e.clientX, 
      y: e.clientY, 
      width: size.width, 
      height: size.height 
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newX = e.clientX - dragStart.current.x
        const newY = e.clientY - dragStart.current.y
        // Keep within bounds
        const boundedX = Math.max(0, Math.min(window.innerWidth - 60, newX))
        const boundedY = Math.max(0, Math.min(window.innerHeight - 60, newY))
        setPosition({ x: boundedX, y: boundedY })
      } else if (isResizing.current) {
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y
        
        // Resize logic (dragging bottom-right corner)
        // Since it's fixed bottom-right relative, increasing width means moving left, increasing height means moving up?
        // Wait, the window is positioned based on `position` state? 
        // Let's anchor the window to the button's position.
        
        // Actually, let's simplify: The window opens at the button's location.
        // If we drag the resize handle (bottom-left or top-left?), we change width/height.
        // Let's assume standard resize: dragging edges increases size.
        
        // Let's implement a simple resize where dragging the handle changes dimensions.
        // We'll use a handle at the top-left of the box since it's anchored bottom-right usually?
        // No, let's anchor top-left to the position.
        
        setSize({
          width: Math.max(300, resizeStart.current.width + deltaX),
          height: Math.max(400, resizeStart.current.height + deltaY)
        })
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      isResizing.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || !applicationId) return
    
    const userMessage: Message = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/copilot/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          application_id: applicationId
        })
      })

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer || "I couldn't process your question. Please try again.",
        sources: data.sources || []
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Copilot error:", error)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        sources: []
      }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!applicationId) {
    return null // Don't show copilot if no application ID
  }

  // Calculate window position to keep it on screen
  const windowStyle = isMaximized ? {
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    borderRadius: 0,
    zIndex: 9999 // Ensure it's on top of everything
  } : {
    left: Math.min(position.x, window.innerWidth - size.width - 20),
    top: Math.min(position.y, window.innerHeight - size.height - 20),
    width: size.width,
    height: size.height
  }

  return (
    <>
      {!isOpen && (
        <div 
          style={{ left: position.x, top: position.y }} 
          className="fixed z-50 touch-none"
        >
          <Button
            ref={buttonRef}
            className="h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-move transition-transform active:scale-95"
            onMouseDown={handleMouseDown}
            onClick={(e) => {
              if (!isDragging.current) setIsOpen(true)
            }}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      )}

      {isOpen && (
        <Card 
          className={`fixed shadow-2xl flex flex-col z-50 bg-white ${isMaximized ? '' : 'rounded-lg'}`}
          style={windowStyle}
        >
          <CardHeader 
            className={`bg-indigo-600 text-white flex flex-row items-center justify-between py-3 ${isMaximized ? '' : 'rounded-t-lg cursor-move'}`}
            onMouseDown={handleMouseDown} // Allow dragging by header
          >
            <div className="flex items-center pointer-events-none">
              <Bot className="h-5 w-5 mr-2" />
              <CardTitle className="text-base">InsightLoan Copilot</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-indigo-700 h-8 w-8" 
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-700 h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap !select-text cursor-text ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ 
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {msg.role === "assistant" ? (
                        <div className="space-y-2">
                          {msg.content.split('\n').map((line, idx) => {
                            // Handle bullet points
                            if (line.trim().startsWith('* ')) {
                              return (
                                <div key={idx} className="flex gap-2 ml-2">
                                  <span className="text-indigo-600 font-bold">•</span>
                                  <span className="flex-1">{line.trim().substring(2)}</span>
                                </div>
                              )
                            }
                            // Handle bold text with **
                            else if (line.includes('**')) {
                              const parts = line.split('**')
                              return (
                                <div key={idx}>
                                  {parts.map((part, pIdx) => 
                                    pIdx % 2 === 1 ? <strong key={pIdx}>{part}</strong> : <span key={pIdx}>{part}</span>
                                  )}
                                </div>
                              )
                            }
                            // Regular line
                            else if (line.trim()) {
                              return <div key={idx}>{line}</div>
                            }
                            // Empty line
                            return <div key={idx} className="h-2" />
                          })}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {msg.sources.map((source, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] py-0 px-1.5">
                            <FileText className="h-2.5 w-2.5 mr-0.5" />
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start">
                    <div className="bg-slate-100 text-slate-900 rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                        <span>Analyzing documents...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t relative">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="Ask about transactions, income, risks..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                onClick={handleSend} 
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {/* Resize Handle */}
            {!isMaximized && (
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-50 hover:opacity-100"
                onMouseDown={handleResizeStart}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0V10H0L10 0Z" fill="#94a3b8"/>
                </svg>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </>
  )
}
