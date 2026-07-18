"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Coins, Zap, Crown, Sparkles, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreditsPanelProps {
  isOpen: boolean
  onClose: () => void
  credits: number
  isPremium: boolean
  subscriptionEnd?: number
  onPurchase: (packageId: string) => Promise<void>
  isProcessing: boolean
}

const PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 50,
    price: 99,
    description: "Perfect for trying out",
    icon: Coins,
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 150,
    price: 249,
    description: "Best value for regular users",
    icon: Zap,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 500,
    price: 699,
    description: "For power users & teams",
    icon: Sparkles,
  },
  {
    id: "premium_monthly",
    name: "Premium Monthly",
    credits: -1,
    price: 499,
    description: "Unlimited for 30 days",
    icon: Crown,
    subscription: true,
  },
]

export function CreditsPanel({
  isOpen,
  onClose,
  credits,
  isPremium,
  subscriptionEnd,
  onPurchase,
  isProcessing,
}: CreditsPanelProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId)
    await onPurchase(packageId)
    setSelectedPackage(null)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-x-4 top-[10%] bottom-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl bg-background rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Credits & Subscription</h2>
            <p className="text-sm text-muted-foreground">Purchase credits to generate documents</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Current Status */}
        <div className="p-4 sm:p-6 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                isPremium ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-emerald-400 to-teal-500"
              )}>
                {isPremium ? (
                  <Crown className="w-7 h-7 text-white" />
                ) : (
                  <Coins className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold">
                  {isPremium ? "Unlimited" : credits}
                  {!isPremium && <span className="text-lg font-normal text-muted-foreground ml-1">credits</span>}
                </p>
              </div>
            </div>
            {isPremium && subscriptionEnd && (
              <Badge variant="secondary" className="text-sm">
                Premium until {formatDate(subscriptionEnd)}
              </Badge>
            )}
          </div>
        </div>

        {/* Packages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Choose a Package</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PACKAGES.map((pkg) => {
              const Icon = pkg.icon
              const isSelected = selectedPackage === pkg.id
              const isLoading = isProcessing && isSelected

              return (
                <Card
                  key={pkg.id}
                  className={cn(
                    "relative cursor-pointer transition-all hover:shadow-lg",
                    pkg.popular && "border-2 border-primary",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        pkg.subscription 
                          ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                          : "bg-gradient-to-br from-slate-700 to-slate-900"
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <CardDescription className="text-xs">{pkg.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <span className="text-3xl font-bold">₹{pkg.price}</span>
                        {pkg.subscription && (
                          <span className="text-sm text-muted-foreground">/month</span>
                        )}
                      </div>
                      <div className="text-right">
                        {pkg.credits === -1 ? (
                          <Badge variant="secondary">Unlimited</Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground">{pkg.credits} credits</p>
                        )}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant={pkg.popular ? "default" : "outline"}
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isProcessing}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {pkg.subscription ? "Subscribe" : "Buy Now"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Features */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <h4 className="font-medium mb-3">What you get with credits:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                1 credit = 1 PPT generation (any slide count)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                1 credit = 1 Conference paper generation
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                1 credit = 1 Word document generation
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Premium includes 0G decentralized storage
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

// Credits display button for header
export function CreditsButton({
  credits,
  isPremium,
  onClick,
}: {
  credits: number
  isPremium: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-1.5 px-2 sm:px-3",
        isPremium && "border-amber-500/50 text-amber-600"
      )}
    >
      {isPremium ? (
        <>
          <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          <span className="hidden sm:inline">Premium</span>
        </>
      ) : (
        <>
          <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">{credits}</span>
        </>
      )}
    </Button>
  )
}
