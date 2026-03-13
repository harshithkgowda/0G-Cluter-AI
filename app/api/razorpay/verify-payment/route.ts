import { NextRequest, NextResponse } from "next/server"

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

// Helper to create HMAC-SHA256 using Web Crypto API
async function createHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const messageData = encoder.encode(message)
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay is not configured" },
        { status: 500 }
      )
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      credits,
      subscription,
      durationDays,
    } = await request.json()

    // Verify signature using Web Crypto API
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = await createHmacSha256(RAZORPAY_KEY_SECRET, body)

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      // Payment verified successfully
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        credits: credits,
        subscription: subscription,
        durationDays: durationDays,
        paymentId: razorpay_payment_id,
      })
    } else {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("[v0] Error verifying payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
