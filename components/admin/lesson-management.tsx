"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  BookOpen,
  Play,
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { Lesson, CreateLessonData, courseService } from "@/lib/course-service"

interface LessonFormData {
  title: string
  description: string
  duration: string
  video_url: string
  order_index: number
}

interface LessonFormErrors {
  title?: string
  description?: string
  duration?: string
  video_url?: string
  order_index?: string
}

interface LessonManagementProps {
  courseId: string
  userAddress: string
  lessons: Lesson[]
  onLessonsUpdate: () => void
}

interface AddLessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userAddress: string
  courseId: string
  nextOrderIndex: number
}

interface EditLessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userAddress: string
  lesson: Lesson | null
}

interface DeleteLessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userAddress: string
  lesson: Lesson | null
}

// Main Lesson Management Component
export function LessonManagement({ courseId, userAddress, lessons, onLessonsUpdate }: LessonManagementProps) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setEditModalOpen(true)
  }

  const handleDeleteLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setDeleteModalOpen(true)
  }

  const handleReorderLesson = async (lesson: Lesson, direction: 'up' | 'down') => {
    const currentIndex = lesson.order_index
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    // Find the lesson to swap with
    const targetLesson = lessons.find(l => l.order_index === targetIndex)
    if (!targetLesson) return

    try {
      // Swap order indices
      await courseService.updateLesson(userAddress, lesson.id, { order_index: targetIndex })
      await courseService.updateLesson(userAddress, targetLesson.id, { order_index: currentIndex })
      
      toast.success('Lesson order updated!')
      onLessonsUpdate()
    } catch (error) {
      console.error('Failed to reorder lesson:', error)
      toast.error('Failed to reorder lesson. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#4DA2FF]" />
          Course Lessons ({lessons.length})
        </h3>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No lessons added yet. Create your first lesson to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="enhanced-card"
            >
              <div className="enhanced-card-content">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorderLesson(lesson, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorderLesson(lesson, 'down')}
                        disabled={index === lessons.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[#4DA2FF] border-[#4DA2FF]">
                        #{lesson.order_index}
                      </Badge>
                      <Play className="w-4 h-4 text-[#4DA2FF]" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{lesson.title}</h4>
                      <p className="text-gray-400 text-sm line-clamp-2">{lesson.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Video: {lesson.video_url.length > 30 ? `${lesson.video_url.substring(0, 30)}...` : lesson.video_url}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLesson(lesson)}
                      className="text-[#4DA2FF] hover:text-[#4DA2FF]/80"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddLessonModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          onLessonsUpdate()
          setAddModalOpen(false)
        }}
        userAddress={userAddress}
        courseId={courseId}
        nextOrderIndex={lessons.length + 1}
      />

      <EditLessonModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedLesson(null)
        }}
        onSuccess={() => {
          onLessonsUpdate()
          setEditModalOpen(false)
          setSelectedLesson(null)
        }}
        userAddress={userAddress}
        lesson={selectedLesson}
      />

      <DeleteLessonModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedLesson(null)
        }}
        onSuccess={() => {
          onLessonsUpdate()
          setDeleteModalOpen(false)
          setSelectedLesson(null)
        }}
        userAddress={userAddress}
        lesson={selectedLesson}
      />
    </div>
  )
}

// Add Lesson Modal
export function AddLessonModal({ isOpen, onClose, onSuccess, userAddress, courseId, nextOrderIndex }: AddLessonModalProps) {
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    duration: '',
    video_url: '',
    order_index: nextOrderIndex
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<LessonFormErrors>({})

  // Update order index when nextOrderIndex changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, order_index: nextOrderIndex }))
  }, [nextOrderIndex])

  const validateForm = (): boolean => {
    const newErrors: LessonFormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required'
    if (!formData.video_url.trim()) newErrors.video_url = 'Video URL is required'
    if (formData.order_index < 1) newErrors.order_index = 'Order index must be at least 1'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const lessonData: CreateLessonData = {
        ...formData,
        course_id: courseId
      }

      console.log('📝 Submitting lesson form with data:', lessonData)
      console.log('👤 User address:', userAddress)
      console.log('📚 Course ID:', courseId)

      await courseService.createLesson(userAddress, lessonData)
      toast.success('Lesson created successfully!')
      onSuccess()

      // Reset form
      setFormData({
        title: '',
        description: '',
        duration: '',
        video_url: '',
        order_index: nextOrderIndex
      })
    } catch (error) {
      console.error('❌ Failed to create lesson:', error)
      toast.error(`Failed to create lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5 text-[#4DA2FF]" />
            Add New Lesson
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-white">Lesson Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to Smart Contracts"
                className="mt-1"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-white">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn in this lesson..."
                rows={3}
                className="mt-1"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration" className="text-white">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 15 min"
                className="mt-1"
              />
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
            </div>

            {/* Order Index */}
            <div>
              <Label htmlFor="order" className="text-white">Lesson Order *</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
              {errors.order_index && <p className="text-red-400 text-sm mt-1">{errors.order_index}</p>}
            </div>

            {/* Video URL */}
            <div className="md:col-span-2">
              <Label htmlFor="video_url" className="text-white">Video URL *</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://vimeo.com/example-video"
                className="mt-1"
              />
              {errors.video_url && <p className="text-red-400 text-sm mt-1">{errors.video_url}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Lesson
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Lesson Modal
export function EditLessonModal({ isOpen, onClose, onSuccess, userAddress, lesson }: EditLessonModalProps) {
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    duration: '',
    video_url: '',
    order_index: 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<LessonFormErrors>({})

  // Populate form when lesson changes
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        video_url: lesson.video_url,
        order_index: lesson.order_index
      })
    }
  }, [lesson])

  const validateForm = (): boolean => {
    const newErrors: LessonFormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required'
    if (!formData.video_url.trim()) newErrors.video_url = 'Video URL is required'
    if (formData.order_index < 1) newErrors.order_index = 'Order index must be at least 1'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!lesson || !validateForm()) return

    setIsLoading(true)
    try {
      await courseService.updateLesson(userAddress, lesson.id, formData)
      toast.success('Lesson updated successfully!')
      onSuccess()
    } catch (error) {
      console.error('Failed to update lesson:', error)
      toast.error('Failed to update lesson. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!lesson) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Edit className="w-5 h-5 text-[#4DA2FF]" />
            Edit Lesson: {lesson.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-white">Lesson Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to Smart Contracts"
                className="mt-1"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-white">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn in this lesson..."
                rows={3}
                className="mt-1"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <Label htmlFor="duration" className="text-white">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 15 min"
                className="mt-1"
              />
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
            </div>

            <div>
              <Label htmlFor="order" className="text-white">Lesson Order *</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
              {errors.order_index && <p className="text-red-400 text-sm mt-1">{errors.order_index}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="video_url" className="text-white">Video URL *</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://vimeo.com/example-video"
                className="mt-1"
              />
              {errors.video_url && <p className="text-red-400 text-sm mt-1">{errors.video_url}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Lesson
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Lesson Modal
export function DeleteLessonModal({ isOpen, onClose, onSuccess, userAddress, lesson }: DeleteLessonModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!lesson) return

    setIsLoading(true)
    try {
      await courseService.deleteLesson(userAddress, lesson.id)
      toast.success('Lesson deleted successfully!')
      onSuccess()
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      toast.error('Failed to delete lesson. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!lesson) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Delete Lesson
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete the lesson <strong>"{lesson.title}"</strong>?
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">
              <strong>Warning:</strong> This action cannot be undone. All user progress for this lesson will be permanently deleted.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Lesson
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
