import { NextRequest, NextResponse } from "next/server"

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  description: string
  popular?: boolean
  subscription?: boolean
  durationDays?: number
}

// Credit packages
export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    credits: 50,
    price: 99, // INR
    description: "50 credits for document generation",
  },
  pro: {
    id: "pro",
    name: "Pro Pack",
    credits: 150,
    price: 249, // INR
    description: "150 credits - Best value!",
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 500,
    price: 699, // INR
    description: "500 credits for teams",
  },
  premium_monthly: {
    id: "premium_monthly",
    name: "Premium Monthly",
    credits: -1, // Unlimited
    price: 499, // INR
    description: "Unlimited generations for 30 days",
    subscription: true,
    durationDays: 30,
  },
}

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay is not configured" },
        { status: 500 }
      )
    }

    const { packageId } = await request.json()

    const selectedPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      )
    }

    // Create Razorpay order
    const orderData = {
      amount: selectedPackage.price * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        packageId: selectedPackage.id,
        credits: selectedPackage.credits.toString(),
        subscription: selectedPackage.subscription ? "true" : "false",
      },
    }

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Razorpay order creation failed:", error)
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      )
    }

    const order = await response.json()

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      packageName: selectedPackage.name,
      credits: selectedPackage.credits,
      subscription: selectedPackage.subscription || false,
      durationDays: selectedPackage.durationDays || 0,
    })
  } catch (error) {
    console.error("[v0] Error creating Razorpay order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
