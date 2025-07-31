"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useRaffleCraft } from "@/hooks/use-rafflecraft"
import { useSuiRaffleTransactions } from "@/lib/services/sui-raffle-service"
import { useEnokiRaffleTransactions, useEnokiStatus } from "@/lib/services/enoki-raffle-service"
import { useSuiAuth } from "@/contexts/sui-auth-context"

import { ZkLoginServiceNotice } from "@/components/zklogin-service-notice"

import { toast } from "sonner"
import {
  Brain,
  Trophy,
  Users,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Wallet,
  DollarSign,
  Gift,
  Star,
  Sparkles,
  Timer,
  Target,
  Play,
  Ticket,
  Calendar,
  Hash,
  Crown,
  HelpCircle,
  Award,
  Coins,
  BarChart3
} from "lucide-react"

// Quiz Component for displaying questions and handling answers
interface QuizComponentProps {
  question: string
  options: string[]
  selectedAnswer: string
  onAnswerSelect: (answer: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  timeRemaining: number
  difficulty: string
  category: string
  canSubmit: boolean
}

function QuizComponent({
  question,
  options,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  isSubmitting,
  timeRemaining,
  difficulty,
  category,
  canSubmit
}: QuizComponentProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="enhanced-card bg-gradient-to-br from-purple-500/10 to-indigo-600/10 border-purple-400/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-4 right-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-4 left-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-1000" />

      <div className="enhanced-card-content relative z-10">
        <div className="space-y-8">
          {/* Question Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${getDifficultyColor(difficulty)} bg-current/10`}>
                {difficulty.toUpperCase()}
              </div>
              <div className="px-4 py-2 rounded-full text-sm font-bold bg-[#4DA2FF]/20 text-[#4DA2FF]">
                {category.toUpperCase()}
              </div>
            </div>

            {/* Timer Display */}
            <div className="relative inline-block mb-6">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 px-6 py-3 rounded-full border border-orange-400/30">
                <div className="flex items-center gap-3">
                  <Timer className="w-6 h-6 text-orange-400" />
                  <span className="text-white text-2xl font-mono font-bold">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              {timeRemaining <= 60 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Quiz Challenge</h3>
            <p className="text-[#C0E6FF]">Choose the correct answer to earn your ticket minting rights</p>
          </div>

          {/* Question */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-purple-500/30 rounded-full flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-purple-400" />
            </div>
            <div className="p-6 bg-gradient-to-br from-[#0f2746] to-[#1a2f51] rounded-xl border border-[#4DA2FF]/30 ml-4">
              <p className="text-white text-xl leading-relaxed font-medium">{question}</p>
            </div>
          </div>

          {/* Options */}
          <RadioGroup value={selectedAnswer} onValueChange={onAnswerSelect}>
            <div className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="relative group">
                  <div className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                    selectedAnswer === option
                      ? 'border-[#4DA2FF] bg-[#4DA2FF]/10 shadow-lg shadow-[#4DA2FF]/20'
                      : 'border-gray-600/30 hover:border-[#4DA2FF]/50 hover:bg-[#4DA2FF]/5'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem
                        value={option}
                        id={`option-${index}`}
                        className="border-[#4DA2FF] text-[#4DA2FF] w-5 h-5"
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="text-[#C0E6FF] cursor-pointer flex-1 text-lg font-medium"
                      >
                        {option}
                      </Label>
                      {selectedAnswer === option && (
                        <div className="w-6 h-6 bg-[#4DA2FF] rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-4 text-lg font-bold transition-all duration-300 ${
                canSubmit && !isSubmitting
                  ? 'bg-[#4da2ff] hover:bg-[#3d8ae6] text-white shadow-lg'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Submitting Answer...
                </>
              ) : canSubmit ? (
                <>
                  <Target className="w-5 h-5 mr-3" />
                  Submit My Answer
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 mr-3" />
                  Select an Answer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Quiz Results Component
interface QuizResultsProps {
  isCorrect: boolean
  correctAnswer: string
  userAnswer: string
  explanation?: string
  pointsEarned: number
  canMintTicket: boolean
  onContinue: () => void
}

function QuizResults({
  isCorrect,
  correctAnswer,
  userAnswer,
  explanation,
  pointsEarned,
  canMintTicket,
  onContinue
}: QuizResultsProps) {
  return (
    <div className="enhanced-card">
      <div className="enhanced-card-content">
        <div className="text-center space-y-6">
          {/* Result Icon */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
            isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isCorrect ? (
              <CheckCircle className="w-10 h-10 text-green-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-400" />
            )}
          </div>

          {/* Result Message */}
          <div>
            <h3 className={`text-2xl font-bold mb-2 ${
              isCorrect ? 'text-green-400' : 'text-red-400'
            }`}>
              {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
            </h3>
            <p className="text-[#C0E6FF]">
              {isCorrect
                ? 'Great job! You can now mint a raffle ticket.'
                : 'Better luck next week! You can try again in the next weekly quiz.'
              }
            </p>
          </div>

          {/* Answer Details */}
          <div className="space-y-4 text-left">
            <div className="p-4 bg-[#0f2746] rounded-lg border border-gray-600/30">
              <p className="text-sm text-gray-400 mb-1">Your Answer:</p>
              <p className={`font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {userAnswer}
              </p>
            </div>

            {!isCorrect && (
              <div className="p-4 bg-[#0f2746] rounded-lg border border-green-600/30">
                <p className="text-sm text-gray-400 mb-1">Correct Answer:</p>
                <p className="font-medium text-green-400">{correctAnswer}</p>
              </div>
            )}

            {explanation && (
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-400 mb-1">Explanation:</p>
                <p className="text-white text-sm">{explanation}</p>
              </div>
            )}
          </div>

          {/* Points Earned */}
          <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">
              +{pointsEarned} XP Earned
            </span>
          </div>

          {/* Continue Button */}
          <Button
            onClick={onContinue}
            className={`w-full py-3 text-lg ${
              canMintTicket
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {canMintTicket ? (
              <>
                <Ticket className="w-5 h-5 mr-2" />
                Continue to Mint Ticket
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Try Again Next Week
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Ticket Minting Component
interface TicketMintingProps {
  ticketPrice: number
  onMintSuccess: (ticketNumber: number) => void
  isLoading: boolean
}

function TicketMinting({ ticketPrice, onMintSuccess, isLoading }: TicketMintingProps) {
  // Try Enoki first, fallback to traditional zkLogin
  const enokiService = useEnokiRaffleTransactions()
  const traditionalService = useSuiRaffleTransactions()
  const { checkStatus } = useEnokiStatus()

  const [userBalance, setUserBalance] = useState(0)
  const [estimatedGas, setEstimatedGas] = useState(0)
  const [isMinting, setIsMinting] = useState(false)
  const [useEnoki, setUseEnoki] = useState(true)
  const [enokiStatus, setEnokiStatus] = useState<any>(null)

  // Check Enoki status on mount
  useEffect(() => {
    const checkEnokiStatus = async () => {
      const status = await checkStatus()
      setEnokiStatus(status)
      // For now, always use traditional service since Enoki is not fully implemented
      setUseEnoki(false)
    }
    checkEnokiStatus()
  }, [])

  useEffect(() => {
    const loadBalanceAndFees = async () => {
      const service = useEnoki ? enokiService : traditionalService
      const balance = await service.getUserBalance()
      const gas = await service.estimateGasFees(ticketPrice)
      setUserBalance(balance)
      setEstimatedGas(gas)
    }
    loadBalanceAndFees()
  }, [useEnoki, enokiService, traditionalService, ticketPrice])

  const handleMintTicket = async () => {
    setIsMinting(true)
    try {
      const service = useEnoki ? enokiService : traditionalService
      const result = await service.purchaseTicket(ticketPrice)

      if (result.success && result.transactionHash) {
        // Generate ticket number (in real implementation, this would come from blockchain)
        const ticketNumber = Math.floor(Math.random() * 999) + 1
        onMintSuccess(ticketNumber)
        toast.success(`Ticket #${ticketNumber} minted successfully using ${useEnoki ? 'Enoki' : 'traditional zkLogin'}!`)
      } else {
        toast.error(result.error || 'Failed to mint ticket')
      }
    } catch (error) {
      console.error('Error minting ticket:', error)
      toast.error('Failed to mint ticket')
    } finally {
      setIsMinting(false)
    }
  }

  const totalCost = ticketPrice + estimatedGas
  const canAfford = userBalance >= totalCost

  return (
    <div className="enhanced-card bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-400/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-green-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl animate-pulse delay-500" />

      <div className="enhanced-card-content relative z-10">
        <div className="space-y-8">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                <Ticket className="w-12 h-12 text-green-400" />
              </div>
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                MINT
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Mint Your Raffle Ticket</h3>
            <p className="text-[#C0E6FF] text-lg">You answered correctly! Now mint your ticket to enter the raffle.</p>
          </div>

          {/* Cost Breakdown */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#4DA2FF]/30 rounded-full flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#4DA2FF]" />
            </div>
            <div className="space-y-4 p-6 bg-gradient-to-br from-[#0f2746] to-[#1a2f51] rounded-xl border border-[#4DA2FF]/30 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-[#C0E6FF] text-lg">Ticket Price:</span>
                <span className="text-white font-bold text-xl">{ticketPrice} SUI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#C0E6FF] text-lg">Estimated Gas:</span>
                <span className="text-white font-bold text-xl">{estimatedGas.toFixed(4)} SUI</span>
              </div>
              <div className="border-t border-gray-600/50 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-xl">Total Cost:</span>
                  <span className="text-green-400 font-bold text-2xl">{totalCost.toFixed(4)} SUI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
            canAfford
              ? 'bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/20'
              : 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  canAfford ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <Wallet className={`w-6 h-6 ${canAfford ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <span className="text-[#C0E6FF] text-lg font-medium">Your Balance:</span>
              </div>
              <span className={`font-bold text-2xl ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                {userBalance.toFixed(4)} SUI
              </span>
            </div>
            {!canAfford && (
              <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                <p className="text-red-400 text-sm text-center">
                  Insufficient balance. You need {(totalCost - userBalance).toFixed(4)} more SUI.
                </p>
              </div>
            )}
          </div>

          {/* Mint Button */}
          <div className="pt-4">
            <Button
              onClick={handleMintTicket}
              disabled={!canAfford || isMinting || isLoading}
              className={`w-full py-4 text-lg font-bold transition-all duration-300 ${
                canAfford && !isMinting && !isLoading
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isMinting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Minting Your Ticket...
                </>
              ) : !canAfford ? (
                <>
                  <Wallet className="w-5 h-5 mr-3" />
                  Insufficient Balance
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5 mr-3" />
                  Mint Ticket with SUI
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RaffleCraftPage() {
  const { user } = useSuiAuth()
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(300) // 5 minutes
  const [isAdmin, setIsAdmin] = useState(true) // For demo purposes
  const [showAdminControls, setShowAdminControls] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // Use the RaffleCraft hook
  const {
    currentWeek,
    userEligibility,
    userTickets,
    userQuizAttempt,
    quizCompleted,
    showQuizResults,
    showTicketMinting,
    isLoadingQuiz,
    isSubmittingQuiz,
    isMintingTicket,
    canTakeQuiz,
    canMintTicket,
    hasTicketThisWeek,
    timeRemaining,
    startQuiz,
    submitQuiz,
    mintTicket,
    resetQuiz,
    showTicketMintingInterface
  } = useRaffleCraft()

  // Quiz timer
  useEffect(() => {
    if (canTakeQuiz && quizTimeRemaining > 0) {
      const timer = setInterval(() => {
        setQuizTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [canTakeQuiz, quizTimeRemaining])

  const handleStartQuiz = () => {
    startQuiz()
    setQuizTimeRemaining(300) // Reset timer
    setSelectedAnswer('')
  }

  const handleSubmitQuiz = async () => {
    if (!selectedAnswer.trim()) {
      toast.error('Please select an answer')
      return
    }

    try {
      await submitQuiz(selectedAnswer)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit quiz')
    }
  }

  const handleMintSuccess = (ticketNumber: number) => {
    // This would be called after successful ticket minting
    toast.success(`Ticket #${ticketNumber} minted successfully!`)
  }

  if (isLoadingQuiz) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4" />
          <p className="text-[#C0E6FF]">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!currentWeek) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Quiz</h3>
          <p className="text-[#C0E6FF]">There's no active quiz this week. Check back later!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-8">
        {/* Page Title */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">RaffleQuiz</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-white border-[#1a2f51] hover:bg-[#1a2f51]"
          >
            {showDiagnostics ? 'Hide' : 'Show'} Wallet Diagnostics
          </Button>
        </div>

        {/* zkLogin Service Notice */}
        <div className="mb-6">
          <ZkLoginServiceNotice />
        </div>



        {/* Diagnostics Panel */}
        {showDiagnostics && (
          <div className="mb-6">
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <p className="text-[#C0E6FF]">Wallet diagnostics component has been removed.</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Style Layout */}
        <div className="space-y-6">
          {/* Top 4 Cards - Dashboard Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Weekly Round */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-purple-400 font-semibold text-sm mb-1">Current Weekly Round</h3>
                    <p className="text-white text-2xl font-bold">Week {currentWeek.week_number}</p>
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse mt-2 inline-block">
                      🟢 ACTIVE
                    </div>
                  </div>
                  <Calendar className="w-10 h-10 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Current Prize Pool */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-sm mb-1">Current Prize Pool</h3>
                    <p className="text-white text-2xl font-bold">{currentWeek.prize_pool_sui} SUI</p>
                    <p className="text-[#C0E6FF] text-xs mt-1">≈ ${(currentWeek.prize_pool_sui * 2.5).toFixed(2)} USD</p>
                  </div>
                  <img src="/images/logo-sui.png" alt="SUI" className="w-10 h-10" />
                </div>
              </div>
            </div>

            {/* Total Participants */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[#4DA2FF] font-semibold text-sm mb-1">Total Participants</h3>
                    <p className="text-white text-2xl font-bold">1,247</p>
                    <p className="text-[#C0E6FF] text-xs mt-1">All Time</p>
                  </div>
                  <Users className="w-10 h-10 text-[#4DA2FF]" />
                </div>
              </div>
            </div>

            {/* Total Prizes Distributed */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-green-400 font-semibold text-sm mb-1">Total Prizes Distributed</h3>
                    <p className="text-white text-2xl font-bold">127.5 SUI</p>
                    <p className="text-[#C0E6FF] text-xs mt-1">All Time</p>
                  </div>
                  <img src="/images/logo-sui.png" alt="SUI" className="w-10 h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Current Weekly Round Table */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center gap-2 text-white mb-4">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Current Weekly Round</h3>
                </div>

                <div className="space-y-3">
                  {/* Quiz Ticket Price */}
                  <div className="flex items-center justify-between p-3 bg-[#0f2746] rounded-lg border border-[#4DA2FF]/30">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#4DA2FF]/20 p-2 rounded">
                        <img src="/images/logo-sui.png" alt="SUI" className="w-6 h-6" />
                      </div>
                      <span className="text-[#C0E6FF] font-medium">Quiz Ticket Price</span>
                    </div>
                    <div className="text-white font-bold">{currentWeek.ticket_price_sui}</div>
                  </div>

                  {/* Quiz Tickets Minted */}
                  <div className="flex items-center justify-between p-3 bg-[#0f2746] rounded-lg border border-purple-400/30">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500/20 p-2 rounded">
                        <Ticket className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-[#C0E6FF] font-medium">Quiz Tickets Minted</span>
                    </div>
                    <div className="text-white font-bold">{currentWeek.total_tickets_sold}</div>
                  </div>

                  {/* Raffle Time Left */}
                  <div className="flex items-center justify-between p-3 bg-[#0f2746] rounded-lg border border-orange-400/30">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-500/20 p-2 rounded">
                        <Clock className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-[#C0E6FF] font-medium">Raffle Time Left</span>
                    </div>
                    <div className="text-white font-bold">
                      {Math.floor(timeRemaining / (1000 * 60 * 60 * 24))}d {Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h
                    </div>
                  </div>

                  {/* Your Ticket Number */}
                  <div className="flex items-center justify-between p-3 bg-[#0f2746] rounded-lg border border-cyan-400/30">
                    <div className="flex items-center gap-3">
                      <div className="bg-cyan-500/20 p-2 rounded">
                        <Users className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-[#C0E6FF] font-medium">Your Ticket Number</span>
                    </div>
                    <div className="text-white font-bold">
                      {hasTicketThisWeek ? (
                        <div className="flex gap-2">
                          {userTickets
                            .filter(t => t.week_number === currentWeek.week_number)
                            .map(ticket => (
                              <span key={ticket.id} className="bg-cyan-500/20 px-2 py-1 rounded text-cyan-400 text-sm">
                                #{ticket.ticket_number}
                              </span>
                            ))
                          }
                        </div>
                      ) : (
                        <span className="text-gray-400">No Ticket</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Quiz Card */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                {/* Quiz Content - Dynamic State */}
                {!user ? (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <Wallet className="w-16 h-16 text-gray-400 mx-auto" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-[#C0E6FF]">Connect your SUI wallet to participate in the quiz and raffle.</p>
                  </div>
                ) : hasTicketThisWeek ? (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="mx-auto w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        ✓ ENTERED
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-green-400 mb-2">You're In the Raffle!</h3>
                    <p className="text-[#C0E6FF] mb-4">
                      You have {userTickets.filter(t => t.week_number === currentWeek.week_number).length} ticket(s) for this week's raffle.
                    </p>
                  </div>
                ) : quizCompleted && userQuizAttempt ? (
                  userQuizAttempt.is_correct ? (
                    showTicketMinting ? (
                      <TicketMinting
                        ticketPrice={currentWeek.ticket_price_sui}
                        onMintSuccess={handleMintSuccess}
                        isLoading={isMintingTicket}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <div className="relative mb-6">
                          <div className="mx-auto w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                          </div>
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            READY
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-green-400 mb-2">Quiz Completed!</h3>
                        <p className="text-[#C0E6FF] mb-4">You answered correctly and can now mint a raffle ticket.</p>
                        <Button
                          onClick={showTicketMintingInterface}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                        >
                          <Ticket className="w-4 h-4 mr-2" />
                          Mint Your Ticket
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative mb-6">
                        <div className="mx-auto w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center">
                          <XCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          NEXT WEEK
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-red-400 mb-2">Better Luck Next Week</h3>
                      <p className="text-[#C0E6FF]">You answered incorrectly. Try again in next week's quiz!</p>
                    </div>
                  )
                ) : canTakeQuiz ? (
                  showQuizResults ? (
                    <QuizResults
                      isCorrect={userQuizAttempt?.is_correct || false}
                      correctAnswer={currentWeek.options[0]}
                      userAnswer={selectedAnswer}
                      explanation="Great job! You've earned the right to mint a raffle ticket."
                      pointsEarned={userQuizAttempt?.points_earned || 0}
                      canMintTicket={userQuizAttempt?.can_mint_ticket || false}
                      onContinue={showTicketMintingInterface}
                    />
                  ) : (
                    <QuizComponent
                      question={currentWeek.question_text}
                      options={currentWeek.options}
                      selectedAnswer={selectedAnswer}
                      onAnswerSelect={setSelectedAnswer}
                      onSubmit={handleSubmitQuiz}
                      isSubmitting={isSubmittingQuiz}
                      timeRemaining={quizTimeRemaining}
                      difficulty={currentWeek.difficulty}
                      category={currentWeek.category}
                      canSubmit={!!selectedAnswer && quizTimeRemaining > 0}
                    />
                  )
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="mx-auto w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center">
                        <Brain className="w-12 h-12 text-purple-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                        START
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready to Start?</h3>
                    <p className="text-[#C0E6FF] mb-4">
                      Answer this week's quiz question correctly to earn the right to mint a raffle ticket.
                    </p>
                    <Button
                      onClick={handleStartQuiz}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Quiz Challenge
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Winners Table and Transactions - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Winners Table */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center gap-2 text-white mb-4">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold">Recent Winners</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600/30">
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">Week</th>
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">Winner</th>
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">Prize</th>
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">Ticket #</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-600/20">
                        <td className="py-3 text-white font-medium">Week 4</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <span className="text-purple-400 text-xs font-bold">A</span>
                            </div>
                            <span className="text-white text-sm">0x1234...5678</span>
                          </div>
                        </td>
                        <td className="py-3 text-green-400 font-bold">24.5 SUI</td>
                        <td className="py-3 text-[#C0E6FF]">#127</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Current Round Transactions */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center gap-2 text-white mb-4">
                  <Ticket className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Current Round Transactions</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600/30">
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">User</th>
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">Ticket #</th>
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">Amount</th>
                        <th className="text-left text-[#C0E6FF] text-sm font-medium py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-600/20">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center">
                              <span className="text-[#4DA2FF] text-xs font-bold">B</span>
                            </div>
                            <span className="text-white text-sm">0x9876...4321</span>
                          </div>
                        </td>
                        <td className="py-3 text-purple-400 font-bold">#156</td>
                        <td className="py-3 text-white font-medium">1.0 SUI</td>
                        <td className="py-3 text-[#C0E6FF] text-sm">2 hours ago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works - Diagonal Layout */}
          <div className="mt-16 relative">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">How RaffleCraft Works</h2>
              <p className="text-[#C0E6FF] text-lg">Three simple steps to win big</p>
            </div>

            <div className="relative max-w-6xl mx-auto">
              {/* Step 1 - Left */}
              <div className="flex flex-col lg:flex-row items-center gap-6 mb-12">
                <div className="lg:w-1/2 order-2 lg:order-1">
                  <div className="enhanced-card transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500 max-w-md mx-auto">
                    <div className="enhanced-card-content flex flex-col items-center text-center py-6 px-4">
                      <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <Brain className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-purple-400 text-xs font-medium mb-1">STEP 1</span>
                      <h3 className="text-white text-lg font-bold mb-3">Answer Quiz</h3>
                      <p className="text-[#C0E6FF] text-sm">
                        Test your blockchain knowledge with our weekly quiz. Get it right to unlock ticket minting privileges.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2 order-1 lg:order-2 text-center">
                  <div className="text-6xl font-bold text-purple-500/20">01</div>
                </div>
              </div>

              {/* Step 2 - Right */}
              <div className="flex flex-col lg:flex-row items-center gap-6 mb-12">
                <div className="lg:w-1/2 text-center">
                  <div className="text-6xl font-bold text-green-500/20">02</div>
                </div>
                <div className="lg:w-1/2">
                  <div className="enhanced-card transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 max-w-md mx-auto">
                    <div className="enhanced-card-content flex flex-col items-center text-center py-6 px-4">
                      <div className="bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <Coins className="w-6 h-6 text-green-400" />
                      </div>
                      <span className="text-green-400 text-xs font-medium mb-1">STEP 2</span>
                      <h3 className="text-white text-lg font-bold mb-3">Mint Ticket</h3>
                      <p className="text-[#C0E6FF] text-sm">
                        Pay {currentWeek.ticket_price_sui} SUI to mint your unique raffle ticket. Each ticket gets a random number for the draw.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 - Left (Zig-zag effect) */}
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="lg:w-1/2 order-2 lg:order-1">
                  <div className="enhanced-card transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500 max-w-md mx-auto">
                    <div className="enhanced-card-content flex flex-col items-center text-center py-6 px-4">
                      <div className="bg-yellow-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                      </div>
                      <span className="text-yellow-400 text-xs font-medium mb-1">STEP 3</span>
                      <h3 className="text-white text-lg font-bold mb-3">Win Prize</h3>
                      <p className="text-[#C0E6FF] text-sm">
                        At week's end, one lucky ticket wins the entire prize pool. Will it be yours?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2 order-1 lg:order-2 text-center">
                  <div className="text-6xl font-bold text-yellow-500/20">03</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tickets - Horizontal Scroll */}
          {userTickets.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Your Ticket History</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 px-4">
                {userTickets.slice(0, 10).map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="enhanced-card min-w-[200px] transform hover:scale-105 transition-transform duration-300"
                    style={{ transform: `rotate(${(index % 3 - 1) * 2}deg)` }}
                  >
                    <div className="enhanced-card-content text-center">
                      <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Ticket className="w-6 h-6 text-purple-400" />
                      </div>
                      <p className="text-white font-bold text-lg">#{ticket.ticket_number}</p>
                      <p className="text-[#C0E6FF] text-sm">Week {ticket.week_number}</p>
                      <p className="text-purple-400 font-semibold">{ticket.amount_paid_sui} SUI</p>
                      <p className="text-[#C0E6FF] text-xs">
                        {new Date(ticket.minted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Controls - Floating Button */}
          {isAdmin && (
            <div className="fixed bottom-8 right-8 z-20">
              {!showAdminControls ? (
                /* Floating Admin Button */
                <div className="relative">
                  <button
                    onClick={() => setShowAdminControls(true)}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-lg shadow-yellow-500/25 border-2 border-yellow-400/30 transition-all duration-300 hover:scale-110 relative z-50 flex items-center justify-center cursor-pointer"
                  >
                    <Crown className="w-8 h-8 text-white" />
                  </button>

                  {/* Pulsing Ring Animation */}
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-400/50 animate-ping pointer-events-none z-40"></div>

                  {/* Admin Badge - Bottom Center */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse pointer-events-none z-50">
                    ADMIN
                  </div>
                </div>
              ) : (
                /* Expanded Admin Controls */
                <div className="enhanced-card w-80 border-yellow-400/30 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="enhanced-card-content">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-white">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <h3 className="font-semibold">Admin Controls</h3>
                      </div>
                      <Button
                        onClick={() => setShowAdminControls(false)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white h-8 w-8 p-0"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          toast.info('Winner selection would be triggered here')
                          setShowAdminControls(false)
                        }}
                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Draw Winner for Week {currentWeek.week_number}
                      </Button>

                      <Button
                        onClick={() => {
                          toast.info('Next week raffle would be created here')
                          setShowAdminControls(false)
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Create Next Week Raffle
                      </Button>

                      <div className="pt-2 border-t border-gray-600/30">
                        <div className="text-xs text-gray-400 text-center">
                          Week {currentWeek.week_number} • {currentWeek.total_tickets_sold} tickets sold
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
