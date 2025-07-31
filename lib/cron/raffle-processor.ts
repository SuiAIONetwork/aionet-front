// Automated Raffle Processing Cron Job
// This script should be run periodically to process completed raffles

import { raffleManagementService } from '@/lib/services/raffle-management-service'

/**
 * Main raffle processing function
 * Should be called by a cron job every hour or daily
 */
export async function processRafflesCronJob(): Promise<void> {
  console.log('Starting automated raffle processing...')
  
  try {
    // Process completed raffles
    await raffleManagementService.processCompletedRaffles()
    
    // Create next week's raffle if needed
    const nextRaffle = await raffleManagementService.createNextWeekRaffle()
    
    if (nextRaffle) {
      console.log(`Created next raffle for week ${nextRaffle.week_number}`)
    }
    
    // Get and log statistics
    const stats = await raffleManagementService.getRaffleStatistics()
    console.log('Raffle processing completed successfully:', {
      total_raffles: stats.total_raffles,
      active_raffles: stats.active_raffles,
      total_tickets_sold: stats.total_tickets_sold,
      total_prize_distributed: stats.total_prize_distributed
    })
    
  } catch (error) {
    console.error('Error in raffle processing cron job:', error)
    
    // In production, you might want to send alerts here
    // e.g., send email notification, Slack message, etc.
    await notifyAdminOfError(error)
  }
}

/**
 * Notify admin of processing errors
 */
async function notifyAdminOfError(error: unknown): Promise<void> {
  // Implementation depends on your notification system
  // Examples: email, Slack, Discord webhook, etc.
  
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const timestamp = new Date().toISOString()
  
  console.error(`ADMIN ALERT: Raffle processing failed at ${timestamp}: ${errorMessage}`)
  
  // Example webhook notification (replace with your actual webhook URL)
  try {
    const webhookUrl = process.env.ADMIN_WEBHOOK_URL
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 RaffleCraft Error Alert`,
          attachments: [{
            color: 'danger',
            fields: [{
              title: 'Error',
              value: errorMessage,
              short: false
            }, {
              title: 'Timestamp',
              value: timestamp,
              short: true
            }]
          }]
        })
      })
    }
  } catch (webhookError) {
    console.error('Failed to send admin notification:', webhookError)
  }
}

/**
 * Vercel Cron API endpoint
 * Create this file at: app/api/cron/process-raffles/route.ts
 */
export const cronApiHandler = async () => {
  // Verify cron secret for security
  const cronSecret = process.env.CRON_SECRET
  
  return {
    async GET(request: Request) {
      try {
        // Verify authorization
        const authHeader = request.headers.get('authorization')
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
          return new Response('Unauthorized', { status: 401 })
        }
        
        await processRafflesCronJob()
        
        return new Response(JSON.stringify({ 
          success: true, 
          timestamp: new Date().toISOString() 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('Cron job failed:', error)
        return new Response(JSON.stringify({ 
          error: 'Cron job failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  }
}

// For local testing
if (require.main === module) {
  processRafflesCronJob()
    .then(() => {
      console.log('Raffle processing completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Raffle processing failed:', error)
      process.exit(1)
    })
}
