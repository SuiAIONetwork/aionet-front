import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

export async function POST(request: NextRequest) {
  try {
    const { encryptedUsername, userAddress } = await request.json()

    if (!encryptedUsername || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use the same decryption logic as the frontend
    const appSecret = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'your-app-secret-salt'
    const encryptionKey = userAddress + appSecret

    try {
      // Decrypt using CryptoJS (same as frontend)
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedUsername, encryptionKey)
      const decryptedUsername = decryptedBytes.toString(CryptoJS.enc.Utf8)

      if (decryptedUsername && decryptedUsername.length > 0) {
        return NextResponse.json({
          success: true,
          username: decryptedUsername
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Decryption resulted in empty string'
        })
      }
    } catch (decryptError) {
      console.error('Decryption error:', decryptError)
      return NextResponse.json({
        success: false,
        error: 'Failed to decrypt username'
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
