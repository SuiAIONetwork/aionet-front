import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// SECURE ALLOW LIST APPROACH
// Define explicitly allowed public routes (default deny)
const allowedPublicRoutes = [
  // Landing and marketing pages
  '/',
  '/about',
  '/pricing',
  '/features',
  '/contact',
  '/terms',
  '/privacy',
  '/faq',
  '/faqs',

  // Authentication routes
  '/zklogin',
  '/zklogin/callback',
  '/zklogin-test',

  // Public API endpoints (specific endpoints only)
  '/api/health',
  '/api/community-analytics',
  '/api/affiliate/stats',
  '/api/affiliate/sponsor',
  '/api/notifications',
  '/api/profile',
  '/api/debug',
  '/api/paion',
  '/api/zklogin/salt',
  '/api/zklogin/prove',
  '/api/rafflecraft/history',
  '/api/notifications/templates',
  '/api/notifications/test-platform',
  '/api/royalties/metrics',
  '/api/auth/login',

  // Static assets and Next.js internals
  '/_next',
  '/favicon.ico',
  '/images',
  '/placeholder',
  '/bot-images',

  // Public profile views (read-only)
  '/profile/public',
]

// Define routes that require authentication but are not admin-only
const authenticatedRoutes = [
  '/dashboard',
  '/aio-dashboard',
  '/profile',
  '/settings',
  '/notifications',
  '/crypto-bots',
  '/stock-bots',
  '/forex-bots',
  '/mint-nft',
  '/community',
  '/aio-creators',
  '/creator-controls',
  '/copy-trading',
  '/governance',
  '/royalties',
  '/dapps',
  '/metago-academy',
  '/marketplace',
  '/leaderboard',
  '/subscriptions',
  '/trading',
  '/protected',
  '/affiliate-controls',
  '/forum',
  '/transaction-history',
  '/backend-test',
]

// Define admin-only routes
const adminOnlyRoutes = [
  '/admin-dashboard',
  '/admin-reports',
]

// Route classification functions
function isAllowedPublicRoute(pathname: string): boolean {
  return allowedPublicRoutes.some(route => {
    // Exact match
    if (pathname === route) return true

    // Static asset directories
    if (route === '/_next' && pathname.startsWith('/_next/')) return true
    if (route === '/images' && pathname.startsWith('/images/')) return true
    if (route === '/placeholder' && pathname.startsWith('/placeholder')) return true
    if (route === '/bot-images' && pathname.startsWith('/bot-images/')) return true

    // API routes with specific patterns
    if (route.startsWith('/api/') && pathname.startsWith(route)) return true

    return false
  })

  // Special handling for dynamic public profile routes
  if (pathname.startsWith('/profile/') && pathname !== '/profile') {
    const identifier = pathname.split('/profile/')[1]
    if (identifier && isValidDynamicParam(identifier)) {
      return true
    }
  }

  return false
}

function requiresAuthentication(pathname: string): boolean {
  return authenticatedRoutes.some(route => pathname.startsWith(route))
}

function requiresAdminAccess(pathname: string): boolean {
  return adminOnlyRoutes.some(route => pathname.startsWith(route))
}

// Security helper functions
function validateReferralCode(code: string): boolean {
  // Validate referral code format (alphanumeric, 6-20 characters)
  return /^[a-zA-Z0-9]{6,20}$/.test(code)
}

function isValidDynamicParam(param: string): boolean {
  // Validate dynamic route parameters (prevent path traversal)
  return !/[<>:"|?*\\\/]/.test(param) && param.length <= 100
}

function rateLimitCheck(request: NextRequest): boolean {
  // Simple rate limiting based on IP (you might want to use a more sophisticated solution)
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  // For now, just return true - implement proper rate limiting as needed
  return true
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Security: Rate limiting check
  if (!rateLimitCheck(request)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Security: Validate dynamic route parameters
  const pathSegments = pathname.split('/').filter(Boolean)
  for (const segment of pathSegments) {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      // This is a dynamic route parameter
      const paramValue = segment.slice(1, -1)
      if (!isValidDynamicParam(paramValue)) {
        return NextResponse.json(
          { error: 'Invalid request parameter' },
          { status: 400 }
        )
      }
    }
  }

  // Handle referral links with validation
  const refParam = searchParams.get('ref')
  const refPathMatch = pathname.match(/^\/ref\/([^\/]+)$/)

  if (refParam || refPathMatch) {
    const referralCode = refParam || refPathMatch?.[1]

    if (referralCode && validateReferralCode(referralCode)) {
      // Create response that redirects to home page
      const response = NextResponse.redirect(new URL('/', request.url))

      // Set referral code in cookie for client-side processing
      response.cookies.set('aionet_referral_code', referralCode, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false, // Allow client-side access for wallet integration
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      return response
    } else {
      // Invalid referral code - redirect to home without setting cookie
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // SECURE ACCESS CONTROL (Allow List Approach)

  // 1. Allow explicitly permitted public routes
  if (isAllowedPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 2. Check for admin-only routes
  if (requiresAdminAccess(pathname)) {
    // For admin routes, we need to check authentication on the client side
    // since we can't access wallet state in middleware
    // The client-side components will handle the actual admin verification
    return NextResponse.next()
  }

  // 3. Check for authenticated routes
  if (requiresAuthentication(pathname)) {
    // For authenticated routes, we let the client handle authentication
    // since wallet state is not available in middleware
    return NextResponse.next()
  }

  // 4. DEFAULT DENY - Block all other routes
  // This is the key security improvement: anything not explicitly allowed is blocked
  return NextResponse.json(
    {
      error: 'Access denied',
      message: 'This route is not publicly accessible',
      code: 'ROUTE_NOT_ALLOWED'
    },
    { status: 403 }
  )
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
