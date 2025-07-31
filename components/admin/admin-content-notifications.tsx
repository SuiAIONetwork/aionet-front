"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Play,
  ExternalLink,
  RefreshCw,
  GraduationCap,
  Send,
  Megaphone,
  FileText,
  Users,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { AddCourseModal, EditCourseModal, DeleteCourseModal } from "@/components/admin/course-management-modals"
import { LessonManagement } from "@/components/admin/lesson-management"
import { courseService, Course, Lesson } from "@/lib/course-service"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { NotificationCategory, NotificationType } from "@/types/notifications"

interface AdminContentNotificationsProps {
  isAdmin: boolean
}

export function AdminContentNotifications({ isAdmin }: AdminContentNotificationsProps) {
  const { user } = useSuiAuth()

  // Card Collapse State
  const [isExpanded, setIsExpanded] = useState(false)

  // Content Management State
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null)
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([])

  // Notifications State
  const [isLoadingNotification, setIsLoadingNotification] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'platform' as NotificationCategory,
    type: 'info' as NotificationType,
    priority: 2,
    actionUrl: '',
    actionLabel: ''
  })

  useEffect(() => {
    if (isAdmin) {
      fetchCourses()
    }
  }, [isAdmin])

  const fetchCourses = async () => {
    setIsLoadingCourses(true)
    try {
      const coursesData = await courseService.getAllCourses()
      setCourses(coursesData)
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setIsLoadingCourses(false)
    }
  }

  // Content Management Functions
  const handleAddCourse = () => {
    setSelectedCourse(null)
    setShowAddModal(true)
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setShowEditModal(true)
  }

  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course)
    setShowDeleteModal(true)
  }

  const handleCourseCreated = () => {
    fetchCourses()
    setShowAddModal(false)
    toast.success('Course created successfully!')
  }

  const handleCourseUpdated = () => {
    fetchCourses()
    setShowEditModal(false)
    toast.success('Course updated successfully!')
  }

  const handleCourseDeleted = async () => {
    if (!selectedCourse || !user?.address) return

    try {
      await courseService.deleteCourse(selectedCourse.id, user.address)
      fetchCourses()
      setShowDeleteModal(false)
      toast.success('Course deleted successfully!')
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    }
  }

  // Lesson Management Functions
  const handleManageLessons = async (course: Course) => {
    setSelectedCourseForLessons(course)
    try {
      const lessons = await courseService.getLessonsByCourseId(course.id)
      setCourseLessons(lessons)
    } catch (error) {
      console.error('Error fetching lessons:', error)
      toast.error('Failed to load lessons')
    }
  }

  const handleLessonsUpdate = async () => {
    if (selectedCourseForLessons) {
      try {
        const lessons = await courseService.getLessonsByCourseId(selectedCourseForLessons.id)
        setCourseLessons(lessons)
        fetchCourses() // Refresh courses to update lesson counts
      } catch (error) {
        console.error('Error refreshing lessons:', error)
      }
    }
  }

  // Notification Functions
  const handleSubmitNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in title and message')
      return
    }

    setIsLoadingNotification(true)
    
    try {
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type,
          category: formData.category,
          priority: formData.priority,
          action_url: formData.actionUrl.trim() || undefined,
          action_label: formData.actionLabel.trim() || undefined,
          admin_address: '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Notification sent to ${result.users_notified} users!`)
        setFormData({
          title: '',
          message: '',
          category: 'platform',
          type: 'info',
          priority: 2,
          actionUrl: '',
          actionLabel: ''
        })
      } else {
        throw new Error(result.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setIsLoadingNotification(false)
    }
  }

  // Helper Functions
  const getTotalLessons = () => {
    return courses.reduce((total, course) => total + (course.lessons?.length || 0), 0)
  }

  const getActiveCourses = () => {
    return courses.filter(course => !course.is_locked).length
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
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
                <GraduationCap className="w-5 h-5 text-blue-400" />
                Content & Communications
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">Course management and platform notifications</p>
            </div>
          </div>
          {isExpanded && (
            <div className="flex items-center gap-2">
              <Link href="/metago-academy">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Academy
                </Button>
              </Link>
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#0a1628]">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#1a2f51]">Overview</TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-[#1a2f51]">Course Management</TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-[#1a2f51]">Send Notifications</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Combined Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{courses.length}</p>
                  <p className="text-sm text-gray-400">Total Courses</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{getTotalLessons()}</p>
                  <p className="text-sm text-gray-400">Total Lessons</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{getActiveCourses()}</p>
                  <p className="text-sm text-gray-400">Unlocked Courses</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#0a1628] rounded-lg p-4 space-y-4">
                <h4 className="text-white font-medium">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    onClick={handleAddCourse}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCourses}
                    disabled={isLoadingCourses}
                    className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingCourses ? 'animate-spin' : ''}`} />
                    Refresh Courses
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    Quick Notification
                  </Button>
                </div>
              </div>

              {/* Recent Courses Preview */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Recent Courses</h4>
                {isLoadingCourses ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-[#0a1628] rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-2">
                    {courses.slice(0, 3).map((course) => (
                      <div key={course.id} className="bg-[#0a1628] rounded-lg p-3 hover:bg-[#0a1628]/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium truncate">{course.title}</span>
                            <Badge variant={!course.is_locked ? "default" : "secondary"} className="text-xs">
                              {!course.is_locked ? "Active" : "Locked"}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">{course.lessons?.length || 0} lessons</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0a1628] rounded-lg p-6 text-center">
                    <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">No courses found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Course Management Tab */}
            <TabsContent value="courses" className="space-y-4 mt-4">
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{courses.length}</p>
                  <p className="text-sm text-gray-400">Total Courses</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{getTotalLessons()}</p>
                  <p className="text-sm text-gray-400">Total Lessons</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{getActiveCourses()}</p>
                  <p className="text-sm text-gray-400">Unlocked Courses</p>
                </div>
              </div>

              {/* Course Management Actions */}
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">Manage Courses</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCourses}
                    disabled={isLoadingCourses}
                    className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingCourses ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddCourse}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </div>
              </div>

              {/* Courses List */}
              {isLoadingCourses ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#0a1628] rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-[#0a1628] rounded-lg p-4 hover:bg-[#0a1628]/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            <p className="text-white font-medium truncate">{course.title}</p>
                            <Badge variant={!course.is_locked ? "default" : "secondary"} className="text-xs">
                              {!course.is_locked ? "Active" : "Locked"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{course.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {course.lessons?.length || 0} lessons
                            </span>
                            <span>{course.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageLessons(course)}
                            className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                            title="Manage Lessons"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            title="Edit Course"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0a1628] rounded-lg p-6 text-center">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">No courses found</p>
                  <Button
                    size="sm"
                    onClick={handleAddCourse}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Course
                  </Button>
                </div>
              )}

              {/* Lesson Management */}
              {selectedCourseForLessons && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">
                      Manage Lessons - {selectedCourseForLessons.title}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCourseForLessons(null)}
                      className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </div>

                  <LessonManagement
                    courseId={selectedCourseForLessons.id}
                    userAddress={user?.address || ''}
                    lessons={courseLessons}
                    onLessonsUpdate={handleLessonsUpdate}
                  />
                </div>
              )}
            </TabsContent>

            {/* Send Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4 mt-4">
              <div className="bg-[#0a1628] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#4da2ff]/20 p-3 rounded-full">
                    <Megaphone className="w-6 h-6 text-[#4da2ff]" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">Broadcast Notification</h3>
                    <p className="text-gray-400 text-sm">Send notifications to all platform users</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitNotification} className="space-y-4">
                  {/* Title and Message */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-white font-medium">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Notification title..."
                        className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-white font-medium">Category</Label>
                      <Select value={formData.category} onValueChange={(value: NotificationCategory) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="platform">Platform</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                          <SelectItem value="trade">Trade</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white font-medium">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your notification message..."
                      className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Type and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type" className="text-white font-medium">Type</Label>
                      <Select value={formData.type} onValueChange={(value: NotificationType) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority" className="text-white font-medium">Priority</Label>
                      <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
                        <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Low (1)</SelectItem>
                          <SelectItem value="2">Normal (2)</SelectItem>
                          <SelectItem value="3">High (3)</SelectItem>
                          <SelectItem value="4">Urgent (4)</SelectItem>
                          <SelectItem value="5">Critical (5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Optional Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actionUrl" className="text-white font-medium">Action URL (Optional)</Label>
                      <Input
                        id="actionUrl"
                        value={formData.actionUrl}
                        onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="actionLabel" className="text-white font-medium">Action Label (Optional)</Label>
                      <Input
                        id="actionLabel"
                        value={formData.actionLabel}
                        onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                        placeholder="Learn More"
                        className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoadingNotification || !formData.title.trim() || !formData.message.trim()}
                    className="w-full bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white"
                  >
                    {isLoadingNotification ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send to All Users
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
          </CardContent>
        )}
      </Card>

      {/* Course Management Modals */}
      <AddCourseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleCourseCreated}
        userAddress={user?.address || ''}
      />
      
      <EditCourseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleCourseUpdated}
        userAddress={user?.address || ''}
        course={selectedCourse}
      />
      
      <DeleteCourseModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleCourseDeleted}
        userAddress={user?.address || ''}
        course={selectedCourse}
      />
    </>
  )
}
