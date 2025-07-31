"use client"

import { useState, useEffect } from 'react'

interface UseWelcomePopupProps {
  userAddress?: string
  unreadCount: number
  isAuthenticated: boolean
}

export function useWelcomePopup({ userAddress, unreadCount, isAuthenticated }: UseWelcomePopupProps) {
  // Get actual unread count from DOM if the passed count is 0
  const getActualUnreadCount = () => {
    if (unreadCount > 0) return unreadCount;

    // Try different selectors for the notification badge
    const selectors = [
      'button span[class*="bg-red"]',
      '[data-testid="notification-badge"]',
      '.notification-badge',
      'button[class*="bell"] span'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const count = parseInt(element.textContent) || 0;
        if (count > 0) return count;
      }
    }

    return 0;
  };
  const [showPopup, setShowPopup] = useState(false)
  const [hasShownPopup, setHasShownPopup] = useState(false)

  useEffect(() => {
    if (!userAddress || !isAuthenticated || hasShownPopup) {
      return
    }

    // Get the actual unread count from DOM
    const actualUnreadCount = getActualUnreadCount()

    // Check if user has visited before
    const lastVisitKey = `last_visit_${userAddress}`
    const popupShownKey = `popup_shown_${userAddress}_${new Date().toDateString()}`

    const lastVisit = localStorage.getItem(lastVisitKey)
    const popupShownToday = localStorage.getItem(popupShownKey)

    // If user has visited before and popup hasn't been shown today
    const isReturningUser = lastVisit !== null
    const shouldShowPopup = isReturningUser && !popupShownToday && actualUnreadCount > 0

    console.log('🔍 Welcome popup debug:', {
      userAddress: userAddress.slice(0, 10) + '...',
      isReturningUser,
      popupShownToday: !!popupShownToday,
      passedUnreadCount: unreadCount,
      actualUnreadCount,
      shouldShowPopup
    })

    if (shouldShowPopup) {
      console.log('🎉 Welcome popup will show in 1.5 seconds...')
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        console.log('🔔 Showing welcome popup now!')
        setShowPopup(true)
        setHasShownPopup(true)
        // Mark popup as shown today
        localStorage.setItem(popupShownKey, 'true')
      }, 1500)

      return () => clearTimeout(timer)
    } else {
      console.log('❌ Welcome popup conditions not met')
    }

    // Update last visit timestamp for next time
    localStorage.setItem(lastVisitKey, new Date().toISOString())
  }, [userAddress, unreadCount, isAuthenticated, hasShownPopup])

  const closePopup = () => {
    setShowPopup(false)
  }

  const resetPopupState = () => {
    setHasShownPopup(false)
    setShowPopup(false)
  }

  return {
    showPopup,
    closePopup,
    resetPopupState
  }
}
