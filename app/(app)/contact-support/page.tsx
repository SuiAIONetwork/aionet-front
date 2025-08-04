"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageSquare, Send, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SupportTicket {
  id: string
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  last_updated: string
  messages: number
}

export default function ContactSupportPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'tickets'>('create')
  
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: ''
  })

  // Mock existing tickets
  const [tickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-001',
      subject: 'Unable to connect Bybit account',
      category: 'Technical',
      priority: 'high',
      status: 'in_progress',
      created_at: '2024-01-15T10:30:00Z',
      last_updated: '2024-01-16T14:20:00Z',
      messages: 3
    },
    {
      id: 'TKT-002',
      subject: 'Affiliate commission not received',
      category: 'Billing',
      priority: 'medium',
      status: 'resolved',
      created_at: '2024-01-10T09:15:00Z',
      last_updated: '2024-01-12T16:45:00Z',
      messages: 5
    }
  ])

  const categories = [
    'Technical Support',
    'Billing & Payments',
    'Account Issues',
    'Trading Bots',
    'Affiliate Program',
    'NFT & Royalties',
    'General Inquiry'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Support ticket created successfully!')
      setFormData({
        subject: '',
        category: '',
        priority: 'medium',
        description: ''
      })
      setActiveTab('tickets')
    } catch (error) {
      toast.error('Failed to create support ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'high': return 'bg-orange-500/20 text-orange-400'
      case 'urgent': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Contact Support
            </h1>
            <p className="text-gray-400 mt-1">
              Get help with your account, technical issues, or general inquiries
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-[#1a2f51]/30 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-[#4DA2FF] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Create Ticket
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'bg-[#4DA2FF] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Tickets ({tickets.length})
        </button>
      </div>

      {activeTab === 'create' ? (
        /* Create Ticket Form */
        <Card className="bg-[#0c1b36] border-[#1a2f51]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#4DA2FF]" />
              Create Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Subject *</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-[#1a2f51] border-[#1a2f51] text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Category *</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    required
                  >
                    <SelectTrigger className="bg-[#1a2f51] border-[#1a2f51] text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2f51] border-[#1a2f51]">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="text-white hover:bg-[#C0E6FF]/10">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="bg-[#1a2f51] border-[#1a2f51] text-white w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f51] border-[#1a2f51]">
                    <SelectItem value="low" className="text-white hover:bg-[#C0E6FF]/10">Low</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-[#C0E6FF]/10">Medium</SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-[#C0E6FF]/10">High</SelectItem>
                    <SelectItem value="urgent" className="text-white hover:bg-[#C0E6FF]/10">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Description *</label>
                <Textarea
                  placeholder="Please provide detailed information about your issue..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-[#1a2f51] border-[#1a2f51] text-white placeholder-gray-400 min-h-32"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Ticket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Existing Tickets */
        <Card className="bg-[#0c1b36] border-[#1a2f51]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#4DA2FF]" />
              My Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Support Tickets</h3>
                <p className="text-gray-400">You haven't created any support tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-[#1a2f51]/30 rounded-lg border border-[#C0E6FF]/10 hover:border-[#C0E6FF]/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{ticket.subject}</h3>
                        <p className="text-gray-400 text-sm">#{ticket.id} • {ticket.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Created: {formatDate(ticket.created_at)}</span>
                      <span>{ticket.messages} messages</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
