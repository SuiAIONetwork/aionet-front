/**
 * Platform-specific notification triggers for AIONET
 * Handles browser notifications for platform, trading, and affiliate actions
 */

import { notificationService } from './notification-service'
import { DatabaseNotification } from '@/types/notifications'

export class PlatformNotifications {
  /**
   * Trading Bot Notifications
   */
  
  /**
   * Notify when a trading bot is deactivated
   */
  static async notifyBotDeactivated(
    userAddress: string,
    botName: string,
    botId: string,
    reason: string
  ): Promise<DatabaseNotification | null> {
    console.log(`🤖 Sending bot deactivated notification for ${botName}`)
    
    return notificationService.createNotificationFromTemplate('bot_deactivated', {
      botName,
      botId,
      reason
    }, userAddress)
  }

  /**
   * Notify when a trading bot is activated
   */
  static async notifyBotActivated(
    userAddress: string,
    botName: string,
    botId: string
  ): Promise<DatabaseNotification | null> {
    console.log(`🤖 Sending bot activated notification for ${botName}`)
    
    return notificationService.createNotificationFromTemplate('bot_activated', {
      botName,
      botId
    }, userAddress)
  }

  /**
   * Notify when a trading bot encounters an error
   */
  static async notifyBotError(
    userAddress: string,
    botName: string,
    botId: string,
    errorMessage: string
  ): Promise<DatabaseNotification | null> {
    console.log(`🤖 Sending bot error notification for ${botName}`)
    
    return notificationService.createNotificationFromTemplate('bot_error', {
      botName,
      botId,
      errorMessage
    }, userAddress)
  }

  /**
   * Affiliate Notifications
   */
  
  /**
   * Notify when affiliate subscription is expiring
   */
  static async notifyAffiliateSubscriptionExpiring(
    userAddress: string,
    days: number
  ): Promise<DatabaseNotification | null> {
    console.log(`💼 Sending affiliate subscription expiring notification (${days} days)`)
    
    return notificationService.createNotificationFromTemplate('affiliate_subscription_expiring', {
      days: days.toString()
    }, userAddress)
  }

  /**
   * Notify when affiliate commission is earned
   */
  static async notifyAffiliateCommissionEarned(
    userAddress: string,
    amount: number,
    currency: string = 'SUI'
  ): Promise<DatabaseNotification | null> {
    console.log(`💼 Sending affiliate commission earned notification (${amount} ${currency})`)
    
    return notificationService.createNotificationFromTemplate('affiliate_commission_earned', {
      amount: amount.toFixed(4),
      currency
    }, userAddress)
  }

  /**
   * Platform Notifications
   */
  
  /**
   * Notify about platform updates
   */
  static async notifyPlatformUpdate(
    userAddress: string,
    updateDetails: string
  ): Promise<DatabaseNotification | null> {
    console.log(`🚀 Sending platform update notification`)
    
    return notificationService.createNotificationFromTemplate('platform_update', {
      updateDetails
    }, userAddress)
  }

  /**
   * Notify about scheduled maintenance
   */
  static async notifyMaintenanceScheduled(
    userAddress: string,
    date: string,
    time: string,
    duration: string
  ): Promise<DatabaseNotification | null> {
    console.log(`🔧 Sending maintenance scheduled notification`)
    
    return notificationService.createNotificationFromTemplate('maintenance_scheduled', {
      date,
      time,
      duration
    }, userAddress)
  }

  /**
   * Trading Notifications
   */
  
  /**
   * Notify when a trade is opened
   */
  static async notifyTradeOpened(
    userAddress: string,
    symbol: string,
    tradeType: string,
    price: string
  ): Promise<DatabaseNotification | null> {
    console.log(`📈 Sending trade opened notification for ${symbol}`)
    
    return notificationService.createNotificationFromTemplate('trade_opened', {
      symbol,
      tradeType,
      price
    }, userAddress)
  }

  /**
   * Notify when a trade is closed
   */
  static async notifyTradeClosed(
    userAddress: string,
    symbol: string,
    tradeType: string,
    profitLoss: 'profit' | 'loss',
    amount: string
  ): Promise<DatabaseNotification | null> {
    console.log(`📉 Sending trade closed notification for ${symbol}`)
    
    return notificationService.createNotificationFromTemplate('trade_closed', {
      symbol,
      tradeType,
      profitLoss,
      amount
    }, userAddress)
  }

  /**
   * System Notifications
   */
  
  /**
   * Notify about subscription expiring
   */
  static async notifySubscriptionExpiring(
    userAddress: string,
    tier: string,
    days: number
  ): Promise<DatabaseNotification | null> {
    console.log(`💎 Sending subscription expiring notification (${tier}, ${days} days)`)
    
    return notificationService.createNotificationFromTemplate('subscription_expiring', {
      tier,
      days: days.toString()
    }, userAddress)
  }

  /**
   * Notify about referral bonus earned
   */
  static async notifyReferralBonus(
    userAddress: string,
    amount: number,
    username: string
  ): Promise<DatabaseNotification | null> {
    console.log(`🎁 Sending referral bonus notification (${amount} SUI)`)
    
    return notificationService.createNotificationFromTemplate('referral_bonus', {
      amount: amount.toFixed(4),
      username
    }, userAddress)
  }

  /**
   * Batch Notifications
   */
  
  /**
   * Send notifications to multiple users
   */
  static async notifyMultipleUsers(
    userAddresses: string[],
    templateKey: string,
    variables: Record<string, any>
  ): Promise<(DatabaseNotification | null)[]> {
    console.log(`📢 Sending batch notifications to ${userAddresses.length} users`)
    
    const promises = userAddresses.map(userAddress =>
      notificationService.createNotificationFromTemplate(templateKey, variables, userAddress)
    )
    
    return Promise.all(promises)
  }

  /**
   * Utility Functions
   */
  
  /**
   * Check if user has browser notifications enabled for a category
   */
  static async canSendNotification(
    userAddress: string,
    category: 'platform' | 'trade' | 'system'
  ): Promise<boolean> {
    try {
      const settings = await notificationService.loadUserSettings(userAddress)
      
      if (!settings?.browser_enabled) {
        return false
      }
      
      switch (category) {
        case 'platform':
          return settings.platform_enabled
        case 'trade':
          return settings.trade_enabled
        case 'system':
          return settings.system_enabled
        default:
          return false
      }
    } catch (error) {
      console.error('Error checking notification settings:', error)
      return false
    }
  }

  /**
   * Send notification only if user has enabled the category
   */
  static async sendConditionalNotification(
    userAddress: string,
    category: 'platform' | 'trade' | 'system',
    templateKey: string,
    variables: Record<string, any>
  ): Promise<DatabaseNotification | null> {
    const canSend = await this.canSendNotification(userAddress, category)
    
    if (!canSend) {
      console.log(`🔕 Skipping notification for ${userAddress} - category ${category} disabled`)
      return null
    }
    
    return notificationService.createNotificationFromTemplate(templateKey, variables, userAddress)
  }
}

// Export singleton instance
export const platformNotifications = PlatformNotifications
