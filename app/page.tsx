"use client"

import React, { useState, useRef, useEffect } from "react"
import { DocumentEditor } from "@/components/document-editor"
import { Document } from "@/types/document"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCredits } from "@/hooks/use-credits"
import { CreditsPanel, CreditsButton } from "@/components/credits-panel"
import {
  Upload, FileText, Presentation, Wand2, Sparkles, Zap,
  ArrowRight, CheckCircle2, X, Loader2, FileUp
} from "lucide-react"
import { cn } from "@/lib/utils"

declare global {
  interface Window { Razorpay: any }
}

export default function Home() {
  const [document, setDocument] = useState<Document | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { credits, isPremium, subscriptionEnd, isLoaded: creditsLoaded, useCredits: consumeCredits } = useCredits()
  const [isCreditsPanelOpen, setIsCreditsPanelOpen] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load Razorpay
  useEffect(() => {
    const script = window.document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    window.document.body.appendChild(script)
    return () => { window.document.body.removeChild(script) }
  }, [])

  const handlePurchase = async (packageId: string) => {
    setIsPaymentProcessing(true)
    try {
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })
      if (!orderResponse.ok) throw new Error("Failed to create order")
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
            toast({ title: "Payment successful!", description: `${verifyData.credits} credits added` })
            setIsCreditsPanelOpen(false)
          }
        },
        theme: { color: "#10b981" },
      }
      if (typeof window !== "undefined" && window.Razorpay) {
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      toast({ title: "Payment failed", description: "Please try again", variant: "destructive" })
    } finally {
      setIsPaymentProcessing(false)
    }
  }

  const processFile = async (file: File) => {
    if (!creditsLoaded || !consumeCredits(1)) {
      toast({ title: "No credits", description: "Purchase credits to continue", variant: "destructive" })
      setIsCreditsPanelOpen(true)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Animate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 8, 85))
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/process-document", { method: "POST", body: formData })
      if (!response.ok) throw new Error("Upload failed")
      const data = await response.json()
      setUploadProgress(100)

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
      setTimeout(() => setDocument(newDoc), 400)
      toast({ title: "Document loaded", description: `${newDoc.pages.length} slides ready` })
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" })
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => { setIsUploading(false); setUploadProgress(0) }, 500)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) processFile(file)
    e.currentTarget.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  if (document) {
    return (
      <div className="w-full h-screen flex flex-col bg-background overflow-hidden">
        {/* Editor Top Bar */}
        <div className="h-14 border-b border-border/60 px-4 flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDocument(null)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Presentation className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">{document.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{document.pages.length} slides</p>
              </div>
            </div>
          </div>
          {creditsLoaded && (
            <CreditsButton credits={credits} isPremium={isPremium} onClick={() => setIsCreditsPanelOpen(true)} />
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
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-teal-500/8 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-400/6 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Cluter AI</span>
          </div>
          <div className="flex items-center gap-3">
            {creditsLoaded && (
              <CreditsButton credits={credits} isPremium={isPremium} onClick={() => setIsCreditsPanelOpen(true)} />
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-8">
          <Zap className="w-3 h-3" />
          AI-powered document editing
        </div>
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
          <span className="text-foreground">Transform any</span>
          <br />
          <span className="gradient-text">document with AI</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          Upload your PowerPoint, PDF, or Word file. Watch AI rewrite every slide in real-time with typing animations, then edit or regenerate any section instantly.
        </p>

        {/* Upload Card */}
        <div className="max-w-2xl mx-auto">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden",
              isDragging
                ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
                : "border-border/60 bg-card/50 hover:border-emerald-500/60 hover:bg-card/80",
              isUploading && "pointer-events-none"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pptx,.pdf,.docx"
            />

            {isUploading ? (
              <div className="p-16 text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  </div>
                </div>
                <p className="text-base font-semibold mb-2">Processing your document...</p>
                <p className="text-sm text-muted-foreground mb-4">Extracting slides and content</p>
                <div className="w-48 mx-auto bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className={cn(
                  "w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isDragging ? "bg-emerald-500 scale-110" : "bg-emerald-500/15 border border-emerald-500/30"
                )}>
                  <FileUp className={cn("w-7 h-7 transition-colors", isDragging ? "text-white" : "text-emerald-400")} />
                </div>
                <p className="text-xl font-semibold mb-2">
                  {isDragging ? "Drop it here!" : "Drop your document here"}
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Supports PowerPoint (.pptx), PDF, and Word (.docx)
                </p>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 shadow-lg shadow-emerald-500/25">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            {[
              { icon: CheckCircle2, label: "Free 30 credits" },
              { icon: CheckCircle2, label: "Real-time AI generation" },
              { icon: CheckCircle2, label: "Edit any section" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-emerald-500" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Wand2,
              title: "Real-time AI Writing",
              desc: "Watch AI generate content character by character with live typing animations as it fills every slide.",
              color: "emerald",
            },
            {
              icon: FileText,
              title: "Full Slide Preview",
              desc: "See your exact slide layout with a 16:9 canvas. Titles, bullets, and body text all stay in position.",
              color: "teal",
            },
            {
              icon: Zap,
              title: "Instant Regeneration",
              desc: "Not happy with a section? Prompt AI to rewrite just that part while keeping the rest intact.",
              color: "emerald",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-emerald-500/40 hover:bg-card/80 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/25 transition-colors">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              <ArrowRight className="w-4 h-4 text-emerald-500 mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

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
