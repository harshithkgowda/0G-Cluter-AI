import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

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

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex")

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
