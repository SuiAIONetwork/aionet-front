/**
 * Course Service for MetaGo Academy
 * Handles all course and lesson CRUD operations with admin authentication
 */

import { createClient } from '@supabase/supabase-js'

// Admin wallet address - only this address can perform CRUD operations
const ADMIN_WALLET_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    },
  }
)

// Types
export interface Course {
  id: string
  title: string
  description: string
  icon_name: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  price?: number
  required_tier?: 'NOMAD' | 'PRO' | 'ROYAL'
  is_locked: boolean
  students_count: number
  rating: number
  created_at: string
  updated_at: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string
  duration: string
  video_url: string
  order_index: number
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface UserCourseProgress {
  id: string
  user_address: string
  course_id: string
  lesson_id: string
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface CoursePurchase {
  id: string
  user_address: string
  course_id: string
  price_paid: number
  transaction_hash?: string
  purchase_date: string
  is_verified: boolean
}

export interface CreateCourseData {
  title: string
  description: string
  icon_name: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  price?: number
  required_tier?: 'NOMAD' | 'PRO' | 'ROYAL'
  is_locked: boolean
}

export interface CreateLessonData {
  course_id: string
  title: string
  description: string
  duration: string
  video_url: string
  order_index: number
}

class CourseService {
  /**
   * Check if the user is an admin
   */
  private isAdmin(userAddress: string): boolean {
    return userAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
  }

  /**
   * Validate admin access
   */
  private validateAdminAccess(userAddress: string): void {
    if (!this.isAdmin(userAddress)) {
      throw new Error('Unauthorized: Admin access required')
    }
  }

  // ==================== COURSE OPERATIONS ====================

  /**
   * Get all courses with their lessons
   */
  async getAllCourses(): Promise<Course[]> {
    try {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (
            id,
            course_id,
            title,
            description,
            duration,
            video_url,
            order_index,
            is_completed,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: true })

      if (coursesError) throw coursesError

      // Sort lessons by order_index
      const coursesWithSortedLessons = courses?.map(course => ({
        ...course,
        lessons: course.lessons?.sort((a: Lesson, b: Lesson) => a.order_index - b.order_index) || []
      })) || []

      return coursesWithSortedLessons
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      throw error
    }
  }

  /**
   * Get a single course by ID with lessons
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (
            id,
            course_id,
            title,
            description,
            duration,
            video_url,
            order_index,
            is_completed,
            created_at,
            updated_at
          )
        `)
        .eq('id', courseId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      // Sort lessons by order_index
      if (course.lessons) {
        course.lessons.sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
      }

      return course
    } catch (error) {
      console.error('Failed to fetch course:', error)
      throw error
    }
  }

  /**
   * Create a new course (Admin only)
   */
  async createCourse(userAddress: string, courseData: CreateCourseData): Promise<Course> {
    this.validateAdminAccess(userAddress)

    try {
      const { data: course, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single()

      if (error) throw error

      return course
    } catch (error) {
      console.error('Failed to create course:', error)
      throw error
    }
  }

  /**
   * Update a course (Admin only)
   */
  async updateCourse(userAddress: string, courseId: string, courseData: Partial<CreateCourseData>): Promise<Course> {
    this.validateAdminAccess(userAddress)

    try {
      const { data: course, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseId)
        .select()
        .single()

      if (error) throw error

      return course
    } catch (error) {
      console.error('Failed to update course:', error)
      throw error
    }
  }

  /**
   * Delete a course (Admin only)
   */
  async deleteCourse(userAddress: string, courseId: string): Promise<void> {
    this.validateAdminAccess(userAddress)

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete course:', error)
      throw error
    }
  }

  // ==================== LESSON OPERATIONS ====================

  /**
   * Get lessons for a specific course
   */
  async getLessonsByCourseId(courseId: string): Promise<Lesson[]> {
    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (error) throw error

      return lessons || []
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
      throw error
    }
  }

  /**
   * Create a new lesson (Admin only)
   */
  async createLesson(userAddress: string, lessonData: CreateLessonData): Promise<Lesson> {
    this.validateAdminAccess(userAddress)

    try {
      console.log('🎓 Creating lesson with data:', lessonData)

      // First, let's check if the course exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', lessonData.course_id)
        .single()

      if (courseError) {
        console.error('❌ Course not found:', courseError)
        throw new Error(`Course not found: ${lessonData.course_id}`)
      }

      console.log('📚 Course found:', course)

      const { data: lesson, error } = await supabase
        .from('lessons')
        .insert([lessonData])
        .select()
        .single()

      if (error) {
        console.error('❌ Database error creating lesson:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Lesson created successfully:', lesson)
      return lesson
    } catch (error) {
      console.error('💥 Failed to create lesson:', error)
      throw error
    }
  }

  /**
   * Update a lesson (Admin only)
   */
  async updateLesson(userAddress: string, lessonId: string, lessonData: Partial<CreateLessonData>): Promise<Lesson> {
    this.validateAdminAccess(userAddress)

    try {
      const { data: lesson, error } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', lessonId)
        .select()
        .single()

      if (error) throw error

      return lesson
    } catch (error) {
      console.error('Failed to update lesson:', error)
      throw error
    }
  }

  /**
   * Delete a lesson (Admin only)
   */
  async deleteLesson(userAddress: string, lessonId: string): Promise<void> {
    this.validateAdminAccess(userAddress)

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      throw error
    }
  }

  // ==================== USER PROGRESS OPERATIONS ====================

  /**
   * Get user progress for a specific course
   */
  async getUserCourseProgress(userAddress: string, courseId: string): Promise<UserCourseProgress[]> {
    try {
      const { data: progress, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_address', userAddress)
        .eq('course_id', courseId)

      if (error) throw error

      return progress || []
    } catch (error) {
      console.error('Failed to fetch user progress:', error)
      throw error
    }
  }

  /**
   * Mark a lesson as completed for a user
   */
  async markLessonCompleted(userAddress: string, courseId: string, lessonId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_course_progress')
        .upsert([
          {
            user_address: userAddress,
            course_id: courseId,
            lesson_id: lessonId,
            is_completed: true,
            completed_at: new Date().toISOString()
          }
        ])

      if (error) throw error
    } catch (error) {
      console.error('Failed to mark lesson as completed:', error)
      throw error
    }
  }

  // ==================== COURSE PURCHASE OPERATIONS ====================

  /**
   * Check if user has purchased a course
   */
  async hasUserPurchasedCourse(userAddress: string, courseId: string): Promise<boolean> {
    try {
      const { data: purchase, error } = await supabase
        .from('course_purchases')
        .select('id')
        .eq('user_address', userAddress)
        .eq('course_id', courseId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return !!purchase
    } catch (error) {
      console.error('Failed to check course purchase:', error)
      return false
    }
  }

  /**
   * Record a course purchase
   */
  async recordCoursePurchase(
    userAddress: string,
    courseId: string,
    pricePaid: number,
    transactionHash?: string
  ): Promise<CoursePurchase> {
    try {
      const { data: purchase, error } = await supabase
        .from('course_purchases')
        .insert([
          {
            user_address: userAddress,
            course_id: courseId,
            price_paid: pricePaid,
            transaction_hash: transactionHash,
            is_verified: false // Will be verified later
          }
        ])
        .select()
        .single()

      if (error) throw error

      return purchase
    } catch (error) {
      console.error('Failed to record course purchase:', error)
      throw error
    }
  }
}

// Export singleton instance
export const courseService = new CourseService()

// Helper function to check if user is admin (for UI components)
export function isUserAdmin(userAddress: string): boolean {
  return userAddress?.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
}
