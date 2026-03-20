"use client"

import React, { useState, useRef } from "react"
import { DocumentEditor } from "@/components/document-editor"
import { Document } from "@/types/document"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useCredits } from "@/hooks/use-credits"
import { CreditsPanel, CreditsButton } from "@/components/credits-panel"
import { Boxes, Upload, FileText, Presentation, File, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const [document, setDocument] = useState<Document | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { credits, isPremium, subscriptionEnd, isLoaded: creditsLoaded, useCredits: consumeCredits } = useCredits()
  const [isCreditsPanelOpen, setIsCreditsPanelOpen] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)

  const handlePurchase = async (packageId: string) => {
    setIsPaymentProcessing(true)
    try {
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })

      if (!orderResponse.ok) {
        throw new Error("Failed to create order")
      }

      const orderData = await orderResponse.json()
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Cluter AI",
        description: orderData.packageName,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          const verifyResponse = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              credits: orderData.credits,
            }),
          })

          const verifyData = await verifyResponse.json()
          if (verifyData.success) {
            toast({
              title: "Payment successful!",
              description: `${verifyData.credits} credits added`,
            })
            setIsCreditsPanelOpen(false)
          }
        },
        theme: { color: "#000000" },
      }

      if (typeof window !== "undefined" && window.Razorpay) {
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsPaymentProcessing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    if (!creditsLoaded || !consumeCredits(1)) {
      toast({
        title: "No credits",
        description: "Please purchase credits to continue",
        variant: "destructive",
      })
      setIsCreditsPanelOpen(true)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()

      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        pages: data.pages || [],
        currentPageIndex: 0,
        template: "ppt",
        status: "ready",
      }

      setDocument(newDoc)
      toast({
        title: "Document loaded",
        description: `${newDoc.pages.length} pages ready to edit`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (document) {
    return (
      <div className="w-full h-screen flex flex-col bg-background">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDocument(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{document.name}</h1>
              <p className="text-xs text-muted-foreground">{document.pages.length} pages</p>
            </div>
          </div>
          {creditsLoaded && (
            <CreditsButton
              credits={credits}
              isPremium={isPremium}
              onClick={() => setIsCreditsPanelOpen(true)}
            />
          )}
        </div>
        <DocumentEditor document={document} onDocumentChange={setDocument} />
        <CreditsPanel
          isOpen={isCreditsPanelOpen}
          onClose={() => setIsCreditsPanelOpen(false)}
          credits={credits}
          isPremium={isPremium}
          subscriptionEnd={subscriptionEnd}
          onPurchase={handlePurchase}
          isProcessing={isPaymentProcessing}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background via-background to-background/95">
      <div className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">Cluter AI</span>
          </div>
          {creditsLoaded && (
            <CreditsButton
              credits={credits}
              isPremium={isPremium}
              onClick={() => setIsCreditsPanelOpen(true)}
            />
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            Transform Documents with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Upload any document and let AI generate, edit, and enhance content in real-time with our intelligent editor
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass p-8 border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 transition-colors cursor-pointer hover:bg-emerald-500/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              accept=".pptx,.pdf,.docx"
            />
            <div className="text-center py-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-80" />
              <p className="text-lg font-semibold mb-2">Drop your document here</p>
              <p className="text-muted-foreground mb-4">
                {isUploading ? "Uploading..." : "PowerPoint, PDF, or Word documents"}
              </p>
              <Button disabled={isUploading} variant="default">
                {isUploading ? "Uploading..." : "Choose File"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Presentation className="w-8 h-8" />, title: "Smart Generation", desc: "AI generates content page by page" },
              { icon: <FileText className="w-8 h-8" />, title: "Live Preview", desc: "See changes instantly with typing animations" },
              { icon: <File className="w-8 h-8" />, title: "Full Editing", desc: "Edit any section or regenerate with AI" },
            ].map((feature, i) => (
              <Card key={i} className="glass p-6 border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
                <div className="text-emerald-500 mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <CreditsPanel
        isOpen={isCreditsPanelOpen}
        onClose={() => setIsCreditsPanelOpen(false)}
        credits={credits}
        isPremium={isPremium}
        subscriptionEnd={subscriptionEnd}
        onPurchase={handlePurchase}
        isProcessing={isPaymentProcessing}
      />
    </div>
  )
}
