"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Play,
  Clock,
  Users,
  Star,
  CheckCircle,
  Lock,
  TrendingUp,
  Coins,
  Palette,
  Droplets,
  GraduationCap,
  X,
  Plus,
  Edit,
  Trash2,
  Settings,
  Loader2
} from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { CoursePaymentModal } from "@/components/course-payment-modal"
import { AddCourseModal, EditCourseModal, DeleteCourseModal } from "@/components/admin/course-management-modals"
import { LessonManagement } from "@/components/admin/lesson-management"
import { Course, Lesson, courseService, isUserAdmin } from "@/lib/course-service"
import { toast } from "sonner"

// Icon mapping for database icon names
const ICON_MAP: Record<string, React.ReactNode> = {
  'TrendingUp': <TrendingUp className="w-6 h-6 text-[#4DA2FF]" />,
  'Palette': <Palette className="w-6 h-6 text-[#4DA2FF]" />,
  'Droplets': <Droplets className="w-6 h-6 text-[#4DA2FF]" />,
  'Coins': <Coins className="w-6 h-6 text-[#4DA2FF]" />,
  'GraduationCap': <GraduationCap className="w-6 h-6 text-[#4DA2FF]" />,
}

// Extended interface for UI-specific properties
interface UICourse extends Course {
  icon: React.ReactNode
  progress: number
  lessons: UILesson[]
}

interface UILesson extends Lesson {
  videoUrl: string // Map video_url to videoUrl for compatibility
  isCompleted: boolean // Will be populated from user progress
}

export function MetaGoAcademy() {
  const { tier } = useSubscription()
  const { user } = useSuiAuth()
  const [courses, setCourses] = useState<UICourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<UICourse | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<UILesson | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [courseForPurchase, setCourseForPurchase] = useState<UICourse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Admin modal states
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false)
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false)
  const [deleteCourseModalOpen, setDeleteCourseModalOpen] = useState(false)
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<UICourse | null>(null)

  const isAdmin = user?.address ? isUserAdmin(user.address) : false

  // Load courses from database
  const loadCourses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const dbCourses = await courseService.getAllCourses()
      
      // Transform database courses to UI courses
      const uiCourses: UICourse[] = await Promise.all(
        dbCourses.map(async (course) => {
          // Get user progress for this course if user is logged in
          let userProgress: any[] = []
          if (user?.address) {
            try {
              userProgress = await courseService.getUserCourseProgress(user.address, course.id)
            } catch (error) {
              console.warn('Failed to load user progress:', error)
            }
          }

          // Transform lessons with user progress
          const uiLessons: UILesson[] = course.lessons?.map((lesson) => {
            const lessonProgress = userProgress.find(p => p.lesson_id === lesson.id)
            return {
              ...lesson,
              videoUrl: lesson.video_url, // Map database field to UI field
              isCompleted: lessonProgress?.is_completed || false
            }
          }) || []

          // Calculate progress percentage
          const completedLessons = uiLessons.filter(l => l.isCompleted).length
          const progress = uiLessons.length > 0 ? Math.round((completedLessons / uiLessons.length) * 100) : 0

          return {
            ...course,
            icon: ICON_MAP[course.icon_name] || ICON_MAP['TrendingUp'],
            lessons: uiLessons,
            progress,
            students_count: course.students_count, // Keep database field name
            is_locked: course.is_locked, // Keep database field name
            required_tier: course.required_tier // Keep database field name
          }
        })
      )

      setCourses(uiCourses)
    } catch (error) {
      console.error('Failed to load courses:', error)
      setError('Failed to load courses. Please try again.')
      toast.error('Failed to load courses')
    } finally {
      setIsLoading(false)
    }
  }

  // Load courses on component mount and when user changes
  useEffect(() => {
    loadCourses()
  }, [user?.address])

  const canAccessCourse = async (course: UICourse) => {
    if (!course.is_locked) return true

    // Check if course was purchased with SUI
    if (user?.address) {
      try {
        const hasPurchased = await courseService.hasUserPurchasedCourse(user.address, course.id)
        if (hasPurchased) return true
      } catch (error) {
        console.warn('Failed to check course purchase status:', error)
      }
    }

    // Check localStorage for backward compatibility
    const accessKey = `course_access_${course.id}`
    const isPurchased = localStorage.getItem(accessKey) === 'purchased'
    if (isPurchased) return true

    // Check tier-based access
    if (course.required_tier === "PRO" && (tier === "PRO" || tier === "ROYAL")) return true
    if (course.required_tier === "ROYAL" && tier === "ROYAL") return true
    return false
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

  const handleLessonClick = async (lesson: UILesson) => {
    setSelectedLesson(lesson)
    setIsVideoPlaying(true)
    
    // Mark lesson as completed in database
    if (user?.address && selectedCourse) {
      try {
        await courseService.markLessonCompleted(user.address, selectedCourse.id, lesson.id)
        // Update local state
        lesson.isCompleted = true
        // Refresh courses to update progress
        loadCourses()
      } catch (error) {
        console.error('Failed to mark lesson as completed:', error)
      }
    }
  }

  const handleCloseVideo = () => {
    setSelectedLesson(null)
    setIsVideoPlaying(false)
  }

  const handleBuyCourse = (course: UICourse) => {
    setCourseForPurchase(course)
    setPaymentModalOpen(true)
  }

  const handlePaymentSuccess = (courseId: string) => {
    setPaymentModalOpen(false)
    setCourseForPurchase(null)
    // Refresh courses to update access
    loadCourses()
  }

  // Admin handlers
  const handleEditCourse = (course: UICourse) => {
    setSelectedCourseForEdit(course)
    setEditCourseModalOpen(true)
  }

  const handleDeleteCourse = (course: UICourse) => {
    setSelectedCourseForEdit(course)
    setDeleteCourseModalOpen(true)
  }

  const handleCourseUpdated = () => {
    loadCourses() // Refresh courses list
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4DA2FF] mx-auto mb-4" />
          <p className="text-gray-400">Loading courses...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <X className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Error Loading Courses</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={loadCourses} className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80">
          Try Again
        </Button>
      </div>
    )
  }

  // Video Player Modal
  if (selectedLesson && isVideoPlaying) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0f2746' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedLesson.title}</h3>
              <p className="text-[#C0E6FF] text-sm">{selectedLesson.description}</p>
            </div>
            <Button
              onClick={handleCloseVideo}
              variant="outline"
              className="border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>

          {/* Video Player Placeholder */}
          <div className="aspect-video bg-[#030F1C] rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <Play className="w-16 h-16 text-[#4DA2FF] mx-auto mb-4" />
              <p className="text-[#C0E6FF]">Video Player</p>
              <p className="text-sm text-[#C0E6FF]/70">Vimeo integration would be implemented here</p>
              <p className="text-xs text-[#C0E6FF]/50 mt-2">Video URL: {selectedLesson.videoUrl}</p>
            </div>
          </div>

          {/* Lesson Details */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="enhanced-card">
              <div className="enhanced-card-content p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#4DA2FF]" />
                  <span className="text-[#C0E6FF] text-sm">Duration</span>
                </div>
                <p className="text-white font-semibold">{selectedLesson.duration}</p>
              </div>
            </div>

            <div className="enhanced-card">
              <div className="enhanced-card-content p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-[#C0E6FF] text-sm">Status</span>
                </div>
                <p className="text-green-400 font-semibold">
                  {selectedLesson.isCompleted ? 'Completed' : 'In Progress'}
                </p>
              </div>
            </div>

            <div className="enhanced-card">
              <div className="enhanced-card-content p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-[#4DA2FF]" />
                  <span className="text-[#C0E6FF] text-sm">Course</span>
                </div>
                <p className="text-white font-semibold">{selectedCourse?.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Course Detail View with Admin Controls
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setSelectedCourse(null)}
              variant="outline"
              size="sm"
              className="border-[#C0E6FF] text-[#C0E6FF]"
            >
              ← Back to Courses
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-[#FFFFFF]">{selectedCourse.title}</h2>
              <p className="text-[#C0E6FF]">Course Overview</p>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleEditCourse(selectedCourse)}
                variant="outline"
                size="sm"
                className="border-[#4DA2FF] text-[#4DA2FF] hover:bg-[#4DA2FF]/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
              <Button
                onClick={() => handleDeleteCourse(selectedCourse)}
                variant="outline"
                size="sm"
                className="border-red-400 text-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Course Content */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center gap-2 text-white mb-4">
                  <BookOpen className="w-5 h-5 text-[#4DA2FF]" />
                  <h3 className="font-semibold">Course Content</h3>
                </div>
                <div className="space-y-4">
                  {selectedCourse.lessons.map((lesson, i) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200"
                      style={{ backgroundColor: '#0f2746' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f2746cc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f2746'}
                      onClick={() => handleLessonClick(lesson)}
                    >
                      <div className="w-8 h-8 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center">
                        {lesson.isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Play className="w-4 h-4 text-[#4DA2FF]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#FFFFFF] font-medium">{lesson.title}</h4>
                        <p className="text-[#C0E6FF] text-sm">{lesson.description}</p>
                      </div>
                      <div className="text-[#C0E6FF] text-sm">{lesson.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin Lesson Management */}
            {isAdmin && (
              <LessonManagement
                courseId={selectedCourse.id}
                userAddress={user?.address || ''}
                lessons={selectedCourse.lessons}
                onLessonsUpdate={handleCourseUpdated}
              />
            )}
          </div>

          <div className="space-y-6">
            {/* Course Info */}
            <div className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      {selectedCourse.icon}
                    </div>
                    <h3 className="text-[#FFFFFF] font-bold">{selectedCourse.title}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#C0E6FF] text-sm">Duration</span>
                      <span className="text-[#FFFFFF] text-sm">{selectedCourse.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#C0E6FF] text-sm">Lessons</span>
                      <span className="text-[#FFFFFF] text-sm">{selectedCourse.lessons.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#C0E6FF] text-sm">Students</span>
                      <span className="text-[#FFFFFF] text-sm">{selectedCourse.students_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#C0E6FF] text-sm">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-[#FFFFFF] text-sm">{selectedCourse.rating}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-[#FFFFFF]">
                    <Play className="w-4 h-4 mr-2" />
                    Start Course
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Course Grid View
  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#4DA2FF]" />
                <h3 className="text-white font-semibold">Admin Controls</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setAddCourseModalOpen(true)}
                  className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          // Note: canAccessCourse is async, but we'll handle this in the click handler
          // For display purposes, we'll use a synchronous check first
          const hasBasicAccess = !course.is_locked ||
            (course.required_tier === "PRO" && (tier === "PRO" || tier === "ROYAL")) ||
            (course.required_tier === "ROYAL" && tier === "ROYAL") ||
            localStorage.getItem(`course_access_${course.id}`) === 'purchased'

          return (
            <div
              key={course.id}
              className={`enhanced-card transition-all duration-300 ${
                hasBasicAccess ? 'hover:border-[#4DA2FF]/50 cursor-pointer' : course.price ? '' : 'opacity-60'
              }`}
              onClick={async () => {
                if (await canAccessCourse(course)) {
                  setSelectedCourse(course)
                }
              }}
            >
              <div className="enhanced-card-content">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#030F1C] rounded-xl">
                      {course.icon}
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-semibold">{course.title}</h3>
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasBasicAccess && (
                      <Lock className="w-5 h-5 text-[#C0E6FF]" />
                    )}
                    {/* Admin Controls */}
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCourse(course)
                          }}
                          className="text-[#4DA2FF] hover:text-[#4DA2FF]/80 h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCourse(course)
                          }}
                          className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[#C0E6FF] text-sm leading-relaxed">
                    {course.description}
                  </p>

                  <div className="grid gap-2 grid-cols-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#C0E6FF]" />
                      <span className="text-[#C0E6FF]">{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#C0E6FF]" />
                      <span className="text-[#C0E6FF]">{course.lessons.length} lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#C0E6FF]" />
                      <span className="text-[#C0E6FF]">{course.students_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-[#C0E6FF]">{course.rating}</span>
                    </div>
                  </div>

                  {course.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#C0E6FF]">Progress</span>
                        <span className="text-[#FFFFFF]">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  )}

                  {!hasBasicAccess && course.required_tier && (
                    <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                      <p className="text-sm text-orange-400 text-center">
                        Requires {course.required_tier} NFT {course.price ? `or ${course.price} SUI` : ''}
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    {hasBasicAccess ? (
                      <Button className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-[#FFFFFF]">
                        {course.progress > 0 ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Continue
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Start Course
                          </>
                        )}
                      </Button>
                    ) : course.price ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBuyCourse(course)
                        }}
                        className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-[#FFFFFF]"
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Buy for {course.price} SUI
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-[#C0E6FF] text-[#C0E6FF]"
                        disabled
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Learning Path */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex items-center gap-2 text-white mb-6 justify-center">
            <GraduationCap className="w-6 h-6 text-[#4DA2FF]" />
            <h3 className="text-xl font-semibold">Recommended Learning Path</h3>
          </div>
          <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
            {['CEX Basics', 'NFT Basics', 'DEX Basics', 'DeFi Basics', 'Liquidity & Staking'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="text-center space-y-2 min-w-[120px]">
                  <div className="w-10 h-10 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-[#4DA2FF] font-bold">{index + 1}</span>
                  </div>
                  <p className="text-[#C0E6FF] text-sm">{step}</p>
                </div>
                {index < 4 && (
                  <div className="w-8 h-0.5 bg-[#C0E6FF]/30 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Payment Modal */}
      <CoursePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        course={courseForPurchase}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Admin Modals */}
      {isAdmin && user?.address && (
        <>
          <AddCourseModal
            isOpen={addCourseModalOpen}
            onClose={() => setAddCourseModalOpen(false)}
            onSuccess={handleCourseUpdated}
            userAddress={user.address}
          />

          <EditCourseModal
            isOpen={editCourseModalOpen}
            onClose={() => {
              setEditCourseModalOpen(false)
              setSelectedCourseForEdit(null)
            }}
            onSuccess={handleCourseUpdated}
            userAddress={user.address}
            course={selectedCourseForEdit}
          />

          <DeleteCourseModal
            isOpen={deleteCourseModalOpen}
            onClose={() => {
              setDeleteCourseModalOpen(false)
              setSelectedCourseForEdit(null)
            }}
            onSuccess={handleCourseUpdated}
            userAddress={user.address}
            course={selectedCourseForEdit}
          />
        </>
      )}
    </div>
  )
}
