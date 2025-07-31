"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  TrendingUp,
  Palette,
  Droplets,
  Coins,
  GraduationCap,
  BookOpen,
  Play
} from "lucide-react"
import { Course, CreateCourseData, Lesson, CreateLessonData, courseService } from "@/lib/course-service"

// Icon mapping for course icons
const ICON_OPTIONS = [
  { value: 'TrendingUp', label: 'Trending Up', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'Palette', label: 'Palette', icon: <Palette className="w-4 h-4" /> },
  { value: 'Droplets', label: 'Droplets', icon: <Droplets className="w-4 h-4" /> },
  { value: 'Coins', label: 'Coins', icon: <Coins className="w-4 h-4" /> },
  { value: 'GraduationCap', label: 'Graduation Cap', icon: <GraduationCap className="w-4 h-4" /> },
]

interface CourseFormData {
  title: string
  description: string
  icon_name: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  price: number
  required_tier: 'NOMAD' | 'PRO' | 'ROYAL' | 'none' | ''
  is_locked: boolean
}

interface CourseFormErrors {
  title?: string
  description?: string
  icon_name?: string
  duration?: string
  difficulty?: string
  price?: string
  required_tier?: string
  is_locked?: string
}

interface AddCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userAddress: string
}

interface EditCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userAddress: string
  course: Course | null
}

interface DeleteCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userAddress: string
  course: Course | null
}

// Add Course Modal
export function AddCourseModal({ isOpen, onClose, onSuccess, userAddress }: AddCourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    icon_name: 'TrendingUp',
    duration: '',
    difficulty: 'Beginner',
    price: 0,
    required_tier: 'none',
    is_locked: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<CourseFormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: CourseFormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required'
    if (Number(formData.price) < 0) newErrors.price = 'Price cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const courseData: CreateCourseData = {
        ...formData,
        required_tier: formData.required_tier === 'none' ? undefined : formData.required_tier || undefined,
        price: Number(formData.price) > 0 ? Number(formData.price) : undefined
      }

      await courseService.createCourse(userAddress, courseData)
      toast.success('Course created successfully!')
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        icon_name: 'TrendingUp',
        duration: '',
        difficulty: 'Beginner',
        price: 0,
        required_tier: 'none',
        is_locked: false
      })
    } catch (error) {
      console.error('Failed to create course:', error)
      toast.error('Failed to create course. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5 text-[#4DA2FF]" />
            Add New Course
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-white">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Advanced DeFi Strategies"
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
                placeholder="Describe what students will learn in this course..."
                rows={3}
                className="mt-1"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Icon */}
            <div>
              <Label htmlFor="icon" className="text-white">Course Icon</Label>
              <Select value={formData.icon_name} onValueChange={(value) => setFormData({ ...formData, icon_name: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration" className="text-white">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 2h 30m"
                className="mt-1"
              />
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
            </div>

            {/* Difficulty */}
            <div>
              <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
              <Select value={formData.difficulty} onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price" className="text-white">Price (SUI)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0 for free course"
                className="mt-1"
              />
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>

            {/* Required Tier */}
            <div>
              <Label htmlFor="tier" className="text-white">Required Tier</Label>
              <Select value={formData.required_tier || "none"} onValueChange={(value) => setFormData({ ...formData, required_tier: value === "none" ? '' : value as any })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None (Free for all)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Free for all)</SelectItem>
                  <SelectItem value="NOMAD">NOMAD</SelectItem>
                  <SelectItem value="PRO">PRO</SelectItem>
                  <SelectItem value="ROYAL">ROYAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Is Locked */}
            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="locked"
                checked={formData.is_locked}
                onCheckedChange={(checked) => setFormData({ ...formData, is_locked: checked })}
              />
              <Label htmlFor="locked" className="text-white">Course is locked (requires payment or tier access)</Label>
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
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Course Modal
export function EditCourseModal({ isOpen, onClose, onSuccess, userAddress, course }: EditCourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    icon_name: 'TrendingUp',
    duration: '',
    difficulty: 'Beginner',
    price: 0,
    required_tier: '',
    is_locked: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<CourseFormErrors>({})

  // Populate form when course changes
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        icon_name: course.icon_name,
        duration: course.duration,
        difficulty: course.difficulty,
        price: course.price || 0,
        required_tier: course.required_tier || 'none',
        is_locked: course.is_locked
      })
    }
  }, [course])

  const validateForm = (): boolean => {
    const newErrors: CourseFormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required'
    if (Number(formData.price) < 0) newErrors.price = 'Price cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!course || !validateForm()) return

    setIsLoading(true)
    try {
      const courseData: Partial<CreateCourseData> = {
        ...formData,
        required_tier: formData.required_tier === 'none' ? undefined : formData.required_tier || undefined,
        price: Number(formData.price) > 0 ? Number(formData.price) : undefined
      }

      await courseService.updateCourse(userAddress, course.id, courseData)
      toast.success('Course updated successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to update course:', error)
      toast.error('Failed to update course. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!course) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Edit className="w-5 h-5 text-[#4DA2FF]" />
            Edit Course: {course.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Same form fields as AddCourseModal */}
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-white">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Advanced DeFi Strategies"
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
                placeholder="Describe what students will learn in this course..."
                rows={3}
                className="mt-1"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <Label htmlFor="icon" className="text-white">Course Icon</Label>
              <Select value={formData.icon_name} onValueChange={(value) => setFormData({ ...formData, icon_name: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration" className="text-white">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 2h 30m"
                className="mt-1"
              />
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
            </div>

            <div>
              <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
              <Select value={formData.difficulty} onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price" className="text-white">Price (SUI)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0 for free course"
                className="mt-1"
              />
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <Label htmlFor="tier" className="text-white">Required Tier</Label>
              <Select value={formData.required_tier || "none"} onValueChange={(value) => setFormData({ ...formData, required_tier: value === "none" ? '' : value as any })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None (Free for all)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Free for all)</SelectItem>
                  <SelectItem value="NOMAD">NOMAD</SelectItem>
                  <SelectItem value="PRO">PRO</SelectItem>
                  <SelectItem value="ROYAL">ROYAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="locked"
                checked={formData.is_locked}
                onCheckedChange={(checked) => setFormData({ ...formData, is_locked: checked })}
              />
              <Label htmlFor="locked" className="text-white">Course is locked (requires payment or tier access)</Label>
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
                  Update Course
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Course Modal
export function DeleteCourseModal({ isOpen, onClose, onSuccess, userAddress, course }: DeleteCourseModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!course) return

    setIsLoading(true)
    try {
      await courseService.deleteCourse(userAddress, course.id)
      toast.success('Course deleted successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!course) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Delete Course
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete the course <strong>"{course.title}"</strong>?
          </p>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">
              <strong>Warning:</strong> This action cannot be undone. All lessons and user progress for this course will be permanently deleted.
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
                  Delete Course
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
