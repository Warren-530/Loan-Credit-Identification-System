"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, X, Send, Bot, FileText } from "lucide-react"
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
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hello! I'm TrustLens Copilot. I've analyzed this applicant's 4 documents (Application Form, Bank Statement, Loan Essay, Payslip). Ask me anything about their risk profile, transactions, or claims.",
      sources: []
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <>
      {!isOpen && (
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl flex flex-col z-50">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between py-3">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              <CardTitle className="text-base">TrustLens Copilot</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700 h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
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
                                  <span className="text-blue-600 font-bold">•</span>
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
                        <div className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                        <span>Analyzing documents...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t">
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
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
