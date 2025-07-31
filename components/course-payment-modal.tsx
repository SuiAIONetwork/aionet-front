"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { Coins, Clock, BookOpen, CheckCircle, AlertCircle, Wallet, Users, Star, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { courseService, Course as DatabaseCourse } from "@/lib/course-service"

// Extended interface for UI compatibility
interface Course extends Partial<DatabaseCourse> {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  price?: number
  students?: number // Legacy field for backward compatibility
  students_count?: number // Database field
  rating: number
}

interface CoursePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course | null
  onPaymentSuccess: (courseId: string) => void
}

export function CoursePaymentModal({ 
  isOpen, 
  onClose, 
  course, 
  onPaymentSuccess 
}: CoursePaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success'>('confirm')
  const account = useCurrentAccount()
  const { isSignedIn } = useSuiAuth()

  // Query for SUI balance
  const { data: balance } = useSuiClientQuery(
    'getBalance',
    {
      owner: account?.address || '',
      coinType: '0x2::sui::SUI',
    },
    {
      enabled: !!account?.address,
    }
  )

  const suiBalance = balance ? parseInt(balance.totalBalance) / 1000000000 : 0 // Convert from MIST to SUI

  const handlePayment = async () => {
    if (!course || !account || !course.price) return

    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // Simulate SUI transaction
      await new Promise(resolve => setTimeout(resolve, 3000))

      // In a real implementation, you would:
      // 1. Create a transaction block
      // 2. Add a transfer SUI transaction
      // 3. Sign and execute the transaction
      // 4. Verify the transaction on-chain
      // 5. Grant permanent access to the course

      setPaymentStep('success')

      // Record purchase in database
      if (account?.address) {
        try {
          await courseService.recordCoursePurchase(
            account.address,
            course.id,
            course.price,
            'simulated-transaction-hash' // In real implementation, use actual transaction hash
          )
        } catch (error) {
          console.error('Failed to record purchase in database:', error)
        }
      }

      // Grant permanent access to the course (backward compatibility)
      const accessKey = `course_access_${course.id}`
      localStorage.setItem(accessKey, 'purchased')

      toast.success(`Successfully purchased ${course.title}!`)
      onPaymentSuccess(course.id)

      setTimeout(() => {
        onClose()
        setPaymentStep('confirm')
      }, 2000)

    } catch (error) {
      console.error('Payment failed:', error)
      toast.error('Payment failed. Please try again.')
      setPaymentStep('confirm')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatSUI = (amount: number) => {
    return amount.toFixed(1)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-[#4DA2FF] text-white'
      case 'Intermediate':
        return 'bg-orange-500 text-white'
      case 'Advanced':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  if (!course || !course.price) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#030F1C] border-[#C0E6FF]/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            {paymentStep === 'success' ? 'Payment Successful!' : 'Purchase Course'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {paymentStep === 'success' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold mb-2">Course Purchased!</h3>
                <p className="text-[#C0E6FF] text-sm">
                  You now have permanent access to <span className="text-white font-medium">{course.title}</span>
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Course Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#0f2746] rounded-lg">
                  <div className="p-3 bg-[#030F1C] rounded-xl">
                    {course.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{course.title}</h3>
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C0E6FF]" />
                    <span className="text-[#C0E6FF]">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C0E6FF]" />
                    <span className="text-[#C0E6FF]">{course.students_count?.toLocaleString() || course.students?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-[#C0E6FF]">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#C0E6FF]" />
                    <span className="text-[#C0E6FF]">Lifetime Access</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="p-4 bg-[#0f2746] rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[#C0E6FF]">Course Price</span>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#4DA2FF]" />
                      <span className="text-white font-semibold">{formatSUI(course.price)} SUI</span>
                    </div>
                  </div>
                  
                  {account && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#C0E6FF] text-sm">Your Balance</span>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#C0E6FF]" />
                        <span className="text-[#C0E6FF] text-sm">{formatSUI(suiBalance)} SUI</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Button */}
                <div className="space-y-3">
                  {!isSignedIn || !account ? (
                    <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                      <p className="text-orange-400 text-sm">Please connect your Sui wallet to continue</p>
                    </div>
                  ) : suiBalance < course.price ? (
                    <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <p className="text-red-400 text-sm">Insufficient SUI balance</p>
                    </div>
                  ) : (
                    <Button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                    >
                      {paymentStep === 'processing' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 mr-2" />
                          Buy Course for {formatSUI(course.price)} SUI
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
