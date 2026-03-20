"use client"

import React, { useState, useEffect } from "react"
import { DocumentEditor } from "@/components/document-editor"
import { Document } from "@/types/document"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useCredits } from "@/hooks/use-credits"
import { CreditsPanel, CreditsButton } from "@/components/credits-panel"
import { Boxes, Upload, FileText, Presentation, File, MoreVertical, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function Home() {
  const [document, setDocument] = useState<Document | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isCreditsPanelOpen, setIsCreditsPanelOpen] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const { toast } = useToast()
  const { credits, isPremium, subscriptionEnd, isLoaded: creditsLoaded, useCredits: consumeCredits, addCredits, activatePremium, hasCredits } = useCredits()

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

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
              subscription: orderData.subscription,
              durationDays: orderData.durationDays,
            }),
          })

          const verifyData = await verifyResponse.json()

          if (verifyData.success) {
            if (verifyData.subscription) {
              activatePremium(verifyData.durationDays)
              toast({
                title: "Premium Activated!",
                description: `You now have unlimited generations for ${verifyData.durationDays} days`,
              })
            } else {
              addCredits(verifyData.credits)
              toast({
                title: "Credits Added!",
                description: `${verifyData.credits} credits have been added to your account`,
              })
            }
            setIsCreditsPanelOpen(false)
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#000000",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("[v0] Payment error:", error)
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment",
        variant: "destructive",
      })
    } finally {
      setIsPaymentProcessing(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!hasCredits) {
      toast({
        title: "No credits remaining",
        description: "Please purchase more credits to continue",
        variant: "destructive",
      })
      setIsCreditsPanelOpen(true)
      return
    }

    if (!consumeCredits(1)) {
      toast({
        title: "Failed to use credits",
        description: "Please try again",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      // Determine document type from file
      const fileName = file.name.toLowerCase()
      let docType: "ppt" | "paper" | "word" = "ppt"
      if (fileName.endsWith(".pdf") || fileName.endsWith(".docx")) {
        docType = fileName.endsWith(".pdf") ? "paper" : "word"
      }

      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process document")
      }

      const data = await response.json()

      // Create document object
      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        pages: data.pages || [],
        currentPageIndex: 0,
        template: docType,
        status: "ready",
      }

      setDocument(newDoc)
      toast({
        title: "Document uploaded successfully",
        description: `${newDoc.pages.length} pages detected`,
      })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // If document is loaded, show editor
  if (document) {
    return (
      <div className="w-full h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDocument(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Back to upload"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{document.name}</h1>
              <p className="text-xs text-muted-foreground">{document.pages.length} pages</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {creditsLoaded && (
              <CreditsButton
                credits={credits}
                isPremium={isPremium}
                onClick={() => setIsCreditsPanelOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Editor */}
        <DocumentEditor
          document={document}
          onDocumentChange={setDocument}
        />

        {/* Credits Panel */}
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

  // Upload screen
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background via-background to-background/95">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Cluter AI</span>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Professional Document Generation with AI
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Upload your presentation, paper, or document template. Our AI will generate professional content page-by-page with real-time preview and editing capabilities.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge variant="secondary" className="gap-2">
              <Presentation className="w-3 h-3" />
              Presentations
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <FileText className="w-3 h-3" />
              Papers & Reports
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <File className="w-3 h-3" />
              Documents
            </Badge>
          </div>
        </div>

        {/* Upload Card */}
        <div className="max-w-xl mx-auto mb-16">
          <Card className="glass p-8 border-border/50">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("ring-2", "ring-emerald-500/50", "bg-emerald-500/5")
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("ring-2", "ring-emerald-500/50", "bg-emerald-500/5")
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("ring-2", "ring-emerald-500/50", "bg-emerald-500/5")
                const file = e.dataTransfer.files[0]
                if (file) handleFileUpload(file)
              }}
              className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer"
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Document</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Drag and drop your PowerPoint, PDF, or Word document here
              </p>

              <input
                type="file"
                accept=".pptx,.pdf,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                disabled={isUploading}
                className="hidden"
                id="file-input"
              />

              <Button
                asChild
                disabled={isUploading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <label htmlFor="file-input" className="cursor-pointer">
                  {isUploading ? (
                    <>
                      <div className="animate-spin">⏳</div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Choose File
                    </>
                  )}
                </label>
              </Button>

              {isUploading && (
                <div className="mt-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-muted/20 rounded-lg border border-border/30">
              <h4 className="text-sm font-semibold text-foreground mb-2">Quick Start</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Upload your template or blank document</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>AI generates content page-by-page with streaming</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Edit, regenerate, or refine any section in real-time</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Download your final polished document</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="glass p-6 border-border/50">
            <Presentation className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Smart Presentations</h3>
            <p className="text-sm text-muted-foreground">Generate slide content automatically with AI-powered insights and professional formatting.</p>
          </Card>

          <Card className="glass p-6 border-border/50">
            <FileText className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Research Papers</h3>
            <p className="text-sm text-muted-foreground">Create academic papers with proper formatting, citations, and structured sections.</p>
          </Card>

          <Card className="glass p-6 border-border/50">
            <File className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Documents</h3>
            <p className="text-sm text-muted-foreground">Transform any document template into polished, content-rich files instantly.</p>
          </Card>
        </div>
      </div>

      {/* Credits Panel */}
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
