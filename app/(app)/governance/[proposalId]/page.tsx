"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useProfile } from '@/contexts/profile-context'
import { useAvatar } from '@/contexts/avatar-context'
import { useProposal } from '@/hooks/useGovernance'

// Type definitions
interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  voting_status: string;
  created_at: string;
  voting_deadline: string;
  votes: any[];
  total_votes: number;
  votes_for: number;
  votes_against: number;
  for_percentage: number;
  against_percentage: number;
  royal_voters: number;
  pro_voters: number;
  seconds_remaining: number;
  royal_vote_weight: number;
  pro_vote_weight: number;
}

interface UserVotingStatus {
  hasVoted: boolean;
  votingPower: number;
  canVote: boolean;
  can_vote: boolean;
  tier: string;
  vote_choice?: string;
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Vote,
  Clock,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Calendar
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, user } = useSuiAuth()
  const { profile } = useProfile()
  const { getAvatarUrl, getFallbackText } = useAvatar()
  const tier = profile?.role_tier || 'NOMAD'
  
  const [proposal, setProposal] = useState<GovernanceProposal | null>(null)
  const [userStatus, setUserStatus] = useState<UserVotingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)

  const proposalId = params.proposalId as string

  // Load proposal data
  const loadProposalData = async () => {
    if (!proposalId) return

    try {
      setIsLoading(true)

      // Load proposal using backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/governance/proposals/${proposalId}`)
      const result = await response.json()
      if (result.success) {
        setProposal(result.data)
      }

      // Load user voting status if signed in
      if (isSignedIn && user?.address) {
        // TODO: Implement user voting status check via backend API
        const status = {
          hasVoted: false,
          votingPower: 1,
          canVote: true,
          can_vote: true,
          tier: 'NOMAD'
        }
        setUserStatus(status)
      }

    } catch (error) {
      console.error('Error loading proposal data:', error)
      toast.error('Failed to load proposal data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProposalData()
  }, [proposalId, isSignedIn, user?.address])

  // Handle voting
  const handleVote = async (choice: 'for' | 'against') => {
    if (!isSignedIn || !user?.address || !proposal) return

    try {
      setIsVoting(true)

      // Submit vote using backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/governance/proposals/${proposal.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ option: choice })
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Vote submitted successfully!`, {
          description: `You voted ${choice.toUpperCase()} with voting power ${userStatus?.votingPower || 1}`
        })
        
        // Reload data to reflect changes
        await loadProposalData()
      } else {
        toast.error('Failed to submit vote', {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    } finally {
      setIsVoting(false)
    }
  }

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
    
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  // Get tier icon
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'ROYAL':
        return <Image src="/images/nfts/royal-nft.png" alt="ROYAL NFT" width={16} height={16} className="w-4 h-4 rounded-sm" />
      case 'PRO':
        return <Image src="/images/nfts/pro-nft.png" alt="PRO NFT" width={16} height={16} className="w-4 h-4 rounded-sm" />
      default:
        return <Shield className="w-4 h-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#4da2ff]" />
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto bg-[#1a2f51] border-[#C0E6FF]/30">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Proposal Not Found</h2>
            <p className="text-[#C0E6FF] mb-4">The requested proposal could not be found.</p>
            <Button 
              onClick={() => router.push('/governance')}
              className="bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white"
            >
              Back to Governance
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/governance')}
          className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Governance
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-[#4da2ff]/20 text-[#4da2ff] border-[#4da2ff]/30">
              Proposal #{proposal.id}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{proposal.title}</h1>
          </div>
          <p className="text-gray-400">Created on {new Date(proposal.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Details */}
          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardHeader>
              <CardTitle className="text-white">Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">{proposal.description}</p>
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Status:</span>
                  <Badge 
                    variant={proposal.voting_status === 'active' ? 'default' : 'secondary'}
                    className={`ml-2 ${
                      proposal.voting_status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {proposal.voting_status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Deadline:</span>
                  <span className="text-white ml-2">
                    {new Date(proposal.voting_deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting Results */}
          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardHeader>
              <CardTitle className="text-white">Voting Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Total Votes Cast</span>
                <span className="text-white font-medium">
                  {proposal.total_votes} vote{proposal.total_votes !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">For: {proposal.votes_for} ({proposal.for_percentage}%)</span>
                  <span className="text-red-400">Against: {proposal.votes_against} ({proposal.against_percentage}%)</span>
                </div>
                <Progress 
                  value={proposal.for_percentage} 
                  className="h-3 bg-gray-700"
                />
              </div>

              <Separator className="bg-gray-700" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Image 
                      src="/images/nfts/royal-nft.png" 
                      alt="ROYAL NFT" 
                      width={16} 
                      height={16} 
                      className="w-4 h-4 rounded-sm"
                    />
                    <span>ROYAL voters: {proposal.royal_voters}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Image 
                      src="/images/nfts/pro-nft.png" 
                      alt="PRO NFT" 
                      width={16} 
                      height={16} 
                      className="w-4 h-4 rounded-sm"
                    />
                    <span>PRO voters: {proposal.pro_voters}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeRemaining(proposal.seconds_remaining)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Voting Power: {proposal.royal_vote_weight + proposal.pro_vote_weight}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Voting Status */}
          {isSignedIn && userStatus && (
            <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
              <CardHeader>
                <CardTitle className="text-white">Your Vote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl()} alt={profile?.username} />
                    <AvatarFallback className="bg-[#4DA2FF] text-white text-sm">
                      {getFallbackText()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      {getTierIcon(userStatus.tier)}
                      <span className="text-sm text-gray-400">
                        Your tier: {userStatus.tier} (Voting Power: {userStatus.votingPower})
                      </span>
                    </div>
                  </div>
                </div>

                {userStatus.hasVoted ? (
                  <div className="flex items-center gap-2 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">
                      You voted {userStatus.vote_choice?.toUpperCase()}
                    </span>
                  </div>
                ) : userStatus.canVote && proposal.voting_status === 'active' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Cast your vote:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleVote('for')}
                        disabled={isVoting}
                        className="bg-green-600 hover:bg-green-600/80 text-white"
                      >
                        {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        For
                      </Button>
                      <Button
                        onClick={() => handleVote('against')}
                        disabled={isVoting}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-600/80"
                      >
                        {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Against
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-500/20 rounded-lg border border-gray-500/30">
                    <span className="text-gray-400 text-sm">
                      {!userStatus.can_vote 
                        ? 'You need PRO or ROYAL tier to vote'
                        : 'Voting has ended'
                      }
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Proposal Timeline */}
          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardHeader>
              <CardTitle className="text-white">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#4da2ff] rounded-full"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Proposal Created</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(proposal.created_at).toLocaleDateString()} at{' '}
                      {new Date(proposal.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    proposal.voting_status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <p className="text-white text-sm font-medium">Voting Deadline</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(proposal.voting_deadline).toLocaleDateString()} at{' '}
                      {new Date(proposal.voting_deadline).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
