"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Vote,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'

// Admin wallet address
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

interface GovernanceProposal {
  id: string
  title: string
  description: string
  status: 'active' | 'closed' | 'cancelled'
  voting_deadline: string
  created_at: string
  votes_for: number
  votes_against: number
  total_votes: number
  for_percentage: number
  against_percentage: number
  voting_status: string
  royal_voters: number
  pro_voters: number
}

interface AdminGovernanceProps {
  isAdmin: boolean
}

export function AdminGovernance({ isAdmin }: AdminGovernanceProps) {
  const [proposals, setProposals] = useState<GovernanceProposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [votingDeadline, setVotingDeadline] = useState('')

  // Load all proposals (including expired/closed)
  const loadProposals = async () => {
    try {
      setIsLoading(true)
      const response = await api.governance.getProposals()
      // Handle the response structure from the backend API
      const proposals = Array.isArray(response) ? response : (response as any)?.data || []
      setProposals(proposals)
    } catch (error) {
      console.error('Error loading proposals:', error)
      toast.error('Failed to load proposals')
    } finally {
      setIsLoading(false)
    }
  }

  // Create new proposal
  const createProposal = async () => {
    if (!title.trim() || !description.trim() || !votingDeadline) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate deadline is in the future
    const deadline = new Date(votingDeadline)
    if (deadline <= new Date()) {
      toast.error('Voting deadline must be in the future')
      return
    }

    try {
      setIsCreating(true)
      
      const response = await fetch(`/api/governance/proposals?admin_address=${ADMIN_ADDRESS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          voting_deadline: deadline.toISOString(),
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Proposal created successfully!')
        setTitle('')
        setDescription('')
        setVotingDeadline('')
        setShowCreateForm(false)
        await loadProposals()
      } else {
        toast.error(data.error || 'Failed to create proposal')
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
      toast.error('Failed to create proposal')
    } finally {
      setIsCreating(false)
    }
  }

  // Update proposal status
  const updateProposalStatus = async (proposalId: string, status: 'active' | 'closed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/governance/proposals?admin_address=${ADMIN_ADDRESS}&proposal_id=${proposalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Proposal ${status} successfully`)
        await loadProposals()
      } else {
        toast.error(data.error || 'Failed to update proposal')
      }
    } catch (error) {
      console.error('Error updating proposal:', error)
      toast.error('Failed to update proposal')
    }
  }

  // Delete proposal
  const deleteProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/governance/proposals?admin_address=${ADMIN_ADDRESS}&proposal_id=${proposalId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Proposal deleted successfully')
        await loadProposals()
      } else {
        toast.error(data.error || 'Failed to delete proposal')
      }
    } catch (error) {
      console.error('Error deleting proposal:', error)
      toast.error('Failed to delete proposal')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'closed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'expired': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadProposals()
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Admin Access Required</h3>
        <p className="text-gray-400">Only administrators can manage governance proposals.</p>
      </div>
    )
  }

  return (
    <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-[#C0E6FF]/10 p-2"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Vote className="w-5 h-5 text-[#4da2ff]" />
              Governance Management
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">Create and manage DAO proposals</p>
          </div>
        </div>
        {isExpanded && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Create Proposal Form */}
          {showCreateForm && (
        <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg">
          <div className="p-6 border-b border-[#C0E6FF]/20">
            <h3 className="text-white text-lg font-semibold">Create New Proposal</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter proposal title..."
                className="bg-[#030f1c] border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed proposal description..."
                rows={4}
                className="bg-[#030f1c] border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voting Deadline
              </label>
              <Input
                type="datetime-local"
                value={votingDeadline}
                onChange={(e) => setVotingDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="bg-[#030f1c] border-gray-600 text-white"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={createProposal}
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Create Proposal
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#4da2ff]" />
          <span className="ml-2 text-gray-400">Loading proposals...</span>
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-12 text-center">
          <Vote className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Proposals</h3>
          <p className="text-gray-400">Create your first governance proposal to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{proposal.title}</h3>
                    <p className="text-gray-300 text-sm mb-3">{proposal.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created: {formatDate(proposal.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Deadline: {formatDate(proposal.voting_deadline)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(proposal.voting_status)}>
                      {proposal.voting_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-gray-700 mb-4" />

                {/* Voting Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{proposal.votes_for}</p>
                    <p className="text-sm text-gray-400">For ({proposal.for_percentage}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{proposal.votes_against}</p>
                    <p className="text-sm text-gray-400">Against ({proposal.against_percentage}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{proposal.total_votes}</p>
                    <p className="text-sm text-gray-400">Total Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{proposal.royal_voters + proposal.pro_voters}</p>
                    <p className="text-sm text-gray-400">Participants</p>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  {proposal.status === 'active' && (
                    <>
                      <Button
                        onClick={() => updateProposalStatus(proposal.id, 'closed')}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                      <Button
                        onClick={() => updateProposalStatus(proposal.id, 'cancelled')}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {proposal.status !== 'active' && (
                    <Button
                      onClick={() => updateProposalStatus(proposal.id, 'active')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Reactivate
                    </Button>
                  )}
                  <Button
                    onClick={() => deleteProposal(proposal.id)}
                    size="sm"
                    variant="destructive"
                    className="ml-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
            </div>
          ))}
          </div>
        )}
        </CardContent>
      )}
    </Card>
  )
}
