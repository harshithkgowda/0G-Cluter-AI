"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Upload,
  Sparkles,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  FileType,
  FileIcon,
  LayoutTemplate,
  Wand2,
  RefreshCw,
  ChevronRight,
  BookOpen,
  Presentation,
  File,
  Shield,
  Database,
  Lock,
  Cloud,
  Wallet,
  Box,
  Boxes,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useWallet } from "@/hooks/use-wallet"
import { useGenerationHistory } from "@/hooks/use-generation-history"
import { WalletConnect } from "@/components/wallet-connect"
import { HistoryPanel, HistoryToggle } from "@/components/history-panel"
import { ZeroGSteps, useZeroGSteps } from "@/components/zerog-steps"
import { History } from "lucide-react"

// Template types
interface Template {
  id: string
  name: string
  description: string
  type: "ieee" | "research" | "acm" | "springer"
  preview: string
}

const PAPER_TEMPLATES: Template[] = [
  {
    id: "ieee-conference",
    name: "IEEE Conference",
    description: "Standard IEEE two-column format for conferences",
    type: "ieee",
    preview: "/ieee-conference-paper-template.jpg",
  },
  {
    id: "ieee-journal",
    name: "IEEE Journal",
    description: "IEEE Transactions journal format",
    type: "ieee",
    preview: "/ieee-journal-paper-template.jpg",
  },
  {
    id: "acm-sigconf",
    name: "ACM SIGCONF",
    description: "ACM Conference Proceedings format",
    type: "acm",
    preview: "/acm-conference-paper-template.jpg",
  },
  {
    id: "springer-lncs",
    name: "Springer LNCS",
    description: "Lecture Notes in Computer Science format",
    type: "springer",
    preview: "/springer-lncs-paper-template.jpg",
  },
]

interface GenerationResult {
  fileName: string
  fileSize: number
  slideCount?: number
  timestamp: Date
  type: "ppt" | "paper" | "word"
}

type DocumentMode = "template" | "upload" | "edit"

export default function GeneratorPage() {
  // Global state
  const [activeTab, setActiveTab] = useState<"paper" | "ppt" | "word">("ppt")
  const [documentMode, setDocumentMode] = useState<DocumentMode>("template")

  // Paper Generator State
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [paperFile, setPaperFile] = useState<File | null>(null)
  const [paperPrompt, setPaperPrompt] = useState("")
  const [paperTitle, setPaperTitle] = useState("")
  const [authors, setAuthors] = useState("")
  const [isPaperGenerating, setIsPaperGenerating] = useState(false)
  const [paperProgress, setPaperProgress] = useState(0)
  const [generatedPaperFile, setGeneratedPaperFile] = useState<Blob | null>(null)
  const [paperResult, setPaperResult] = useState<GenerationResult | null>(null)

  // PPT Generator State
  const [pptFile, setPptFile] = useState<File | null>(null)
  const [pptPrompt, setPptPrompt] = useState("")
  const [slideCount, setSlideCount] = useState<number>(5)
  const [isPptGenerating, setIsPptGenerating] = useState(false)
  const [pptProgress, setPptProgress] = useState(0)
  const [generatedPptFile, setGeneratedPptFile] = useState<Blob | null>(null)
  const [pptResult, setPptResult] = useState<GenerationResult | null>(null)
  const [isBlankPpt, setIsBlankPpt] = useState(false)

  // Word Generator State
  const [wordFile, setWordFile] = useState<File | null>(null)
  const [wordPrompt, setWordPrompt] = useState("")
  const [isWordGenerating, setIsWordGenerating] = useState(false)
  const [wordProgress, setWordProgress] = useState(0)
  const [generatedWordFile, setGeneratedWordFile] = useState<Blob | null>(null)
  const [wordResult, setWordResult] = useState<GenerationResult | null>(null)

  const { toast } = useToast()

  // Wallet Connection
  const wallet = useWallet()
  
  // Generation History
  const { history, addToHistory, removeFromHistory, clearHistory } = useGenerationHistory()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  
  // 0G Steps Animation
  const zeroGSteps = useZeroGSteps()

  // 0G Storage State
  const [zeroGStatus, setZeroGStatus] = useState<{
    configured: boolean;
    walletAddress?: string;
    balance?: string;
    network?: string;
  } | null>(null)
  const [isUploadingTo0G, setIsUploadingTo0G] = useState(false)
  const [zeroGUploadResult, setZeroGUploadResult] = useState<{
    rootHash: string;
    txHash: string;
    fileSize: number;
    timestamp: number;
  } | null>(null)
  const [enableDecentralizedStorage, setEnableDecentralizedStorage] = useState(true)

  // Check 0G Storage status on mount
  useEffect(() => {
    checkZeroGStatus()
  }, [])

  const checkZeroGStatus = async () => {
    try {
      const response = await fetch('/api/zerog-storage')
      const data = await response.json()
      setZeroGStatus(data)
      if (data.configured) {
        console.log('[v0] 0G Storage connected:', data.walletAddress)
      }
    } catch (error) {
      console.error('[v0] Failed to check 0G status:', error)
      setZeroGStatus({ configured: false })
    }
  }

  const uploadToZeroG = async (file: File): Promise<{ success: boolean; rootHash?: string }> => {
    if (!enableDecentralizedStorage || !zeroGStatus?.configured) {
      return { success: false }
    }
    
    setIsUploadingTo0G(true)
    zeroGSteps.startProcess()
    
    try {
      // Step 1: Wallet Connected
      zeroGSteps.updateStep('connect', 'active', 'Verifying wallet connection...')
      await new Promise(resolve => setTimeout(resolve, 500))
      zeroGSteps.updateStep('connect', 'complete', `Connected: ${zeroGStatus.walletAddress?.slice(0, 8)}...`)
      
      // Step 2: Preparing Upload
      zeroGSteps.updateStep('prepare', 'active', 'Hashing file content...')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const formData = new FormData()
      formData.append('action', 'upload')
      formData.append('file', file)
      
      zeroGSteps.updateStep('prepare', 'complete', `File: ${file.name}`)
      
      // Step 3: Uploading to 0G
      zeroGSteps.updateStep('upload', 'active', 'Sending to decentralized storage...')
      
      const response = await fetch('/api/zerog-storage', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (result.success) {
        zeroGSteps.updateStep('upload', 'complete', 'Upload complete')
        
        // Step 4: Verifying
        zeroGSteps.updateStep('verify', 'active', 'Confirming on network...')
        await new Promise(resolve => setTimeout(resolve, 500))
        zeroGSteps.updateStep('verify', 'complete', 'Transaction confirmed')
        
        // Step 5: Complete
        zeroGSteps.updateStep('complete', 'complete', 'Secured on 0G network')
        zeroGSteps.completeProcess(result.rootHash)
        
        setZeroGUploadResult({
          rootHash: result.rootHash,
          txHash: result.txHash,
          fileSize: result.fileSize,
          timestamp: result.timestamp,
        })
        
        toast({
          title: "Secured on 0G Network",
          description: `File hash: ${result.rootHash.slice(0, 16)}...`,
        })
        
        return { success: true, rootHash: result.rootHash }
      } else {
        zeroGSteps.updateStep('upload', 'error', result.error || 'Upload failed')
        return { success: false }
      }
    } catch (error) {
      zeroGSteps.updateStep('upload', 'error', 'Network error')
      return { success: false }
    } finally {
      setIsUploadingTo0G(false)
    }
  }

  // Paper Handlers
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setPaperFile(null)
    setDocumentMode("template")
    toast({
      title: "Template selected",
      description: `${template.name} template is ready for content generation`,
    })
  }

  const handlePaperFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      if (uploadedFile.type === "application/pdf") {
        setPaperFile(uploadedFile)
        setSelectedTemplate(null)
        setDocumentMode("upload")
        
        // Upload to 0G for decentralized storage
        if (enableDecentralizedStorage && zeroGStatus?.configured) {
          await uploadToZeroG(uploadedFile)
        }
        
        toast({
          title: "Template uploaded",
          description: `${uploadedFile.name} is ready for AI analysis`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
      }
    }
  }

  const handlePaperDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handlePaperDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === "application/pdf") {
      setPaperFile(droppedFile)
      setSelectedTemplate(null)
      setDocumentMode("upload")
      toast({
        title: "Template uploaded",
        description: `${droppedFile.name} is ready for AI analysis`,
      })
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
    }
  }

  const handlePaperGenerate = async () => {
    if (!paperPrompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a research topic",
        variant: "destructive",
      })
      return
    }

    if (!selectedTemplate && !paperFile) {
      toast({
        title: "Missing template",
        description: "Please select a template or upload your own",
        variant: "destructive",
      })
      return
    }

    setIsPaperGenerating(true)
    setPaperProgress(0)
    setGeneratedPaperFile(null)
    setPaperResult(null)

    try {
      const formData = new FormData()
      if (paperFile) {
        formData.append("file", paperFile)
      }
      formData.append("prompt", paperPrompt)
      formData.append("title", paperTitle)
      formData.append("authors", authors)
      if (selectedTemplate) {
        formData.append("templateId", selectedTemplate.id)
      }

      const progressInterval = setInterval(() => {
        setPaperProgress((prev) => Math.min(prev + 5, 90))
      }, 800)

      const response = await fetch("/api/generate-paper", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setPaperProgress(100)

      if (!response.ok) {
        let errorMessage = "Failed to generate paper"
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            errorMessage = await response.text()
          }
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      setGeneratedPaperFile(blob)

      setPaperResult({
        fileName: `ai-conference-paper.pdf`,
        fileSize: blob.size,
        timestamp: new Date(),
        type: "paper",
      })

      // Add to history
      addToHistory({
        type: 'paper',
        title: paperTitle || 'Conference Paper',
        prompt: paperPrompt,
        fileName: `ai-conference-paper.pdf`,
        fileSize: blob.size,
        templateUsed: selectedTemplate?.name || paperFile?.name,
        zeroGHash: zeroGUploadResult?.rootHash,
      })

      toast({
        title: "Success!",
        description: "Your AI-generated conference paper is ready to download",
      })
    } catch (error) {
      console.error("[v0] Error generating paper:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "There was an error generating your paper",
        variant: "destructive",
      })
    } finally {
      setIsPaperGenerating(false)
      setPaperProgress(0)
    }
  }

  const handlePaperDownload = () => {
    if (!generatedPaperFile || !paperResult) return

    const url = URL.createObjectURL(generatedPaperFile)
    const a = document.createElement("a")
    a.href = url
    a.download = paperResult.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Your conference paper has been downloaded successfully",
    })
  }

  const handlePaperStartOver = () => {
    setSelectedTemplate(null)
    setPaperFile(null)
    setPaperPrompt("")
    setPaperTitle("")
    setAuthors("")
    setGeneratedPaperFile(null)
    setPaperResult(null)
    setDocumentMode("template")
  }

  // PPT Handlers
  const handlePptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      if (uploadedFile.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
        setPptFile(uploadedFile)
        
        // Upload to 0G for decentralized storage
        if (enableDecentralizedStorage && zeroGStatus?.configured) {
          await uploadToZeroG(uploadedFile)
        }
        
        toast({
          title: "Template uploaded",
          description: `${uploadedFile.name} is ready for AI enhancement`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a .pptx file",
          variant: "destructive",
        })
      }
    }
  }

  const handlePptDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handlePptDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      setPptFile(droppedFile)
      toast({
        title: "Template uploaded",
        description: `${droppedFile.name} is ready for AI enhancement`,
      })
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .pptx file",
        variant: "destructive",
      })
    }
  }

  const handlePptGenerate = async () => {
    if (!pptFile || !pptPrompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload a template and provide a prompt",
        variant: "destructive",
      })
      return
    }

    setIsPptGenerating(true)
    setPptProgress(0)
    setGeneratedPptFile(null)
    setPptResult(null)

    try {
      const formData = new FormData()
      formData.append("file", pptFile)
      formData.append("prompt", pptPrompt)
      formData.append("slideCount", slideCount.toString())
      formData.append("isBlank", isBlankPpt.toString())

      const progressInterval = setInterval(() => {
        setPptProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch("/api/generate-ppt", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setPptProgress(100)

      if (!response.ok) {
        let errorMessage = "Failed to generate presentation"
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            errorMessage = await response.text()
          }
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      setGeneratedPptFile(blob)

      setPptResult({
        fileName: `ai-generated-${pptFile.name}`,
        fileSize: blob.size,
        slideCount: slideCount,
        timestamp: new Date(),
        type: "ppt",
      })

      // Add to history
      addToHistory({
        type: 'ppt',
        title: pptPrompt.slice(0, 50),
        prompt: pptPrompt,
        fileName: `ai-generated-${pptFile.name}`,
        fileSize: blob.size,
        slideCount: slideCount,
        templateUsed: pptFile.name,
        zeroGHash: zeroGUploadResult?.rootHash,
      })

      toast({
        title: "Success!",
        description: "Your AI-enhanced presentation is ready to download",
      })
    } catch (error) {
      console.error("[v0] Error generating PPT:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "There was an error generating your presentation",
        variant: "destructive",
      })
    } finally {
      setIsPptGenerating(false)
      setPptProgress(0)
    }
  }

  const handlePptDownload = () => {
    if (!generatedPptFile || !pptResult) return

    const url = URL.createObjectURL(generatedPptFile)
    const a = document.createElement("a")
    a.href = url
    a.download = pptResult.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Your presentation has been downloaded successfully",
    })
  }

  const handlePptStartOver = () => {
    setPptFile(null)
    setPptPrompt("")
    setSlideCount(5)
    setGeneratedPptFile(null)
    setPptResult(null)
    setIsBlankPpt(false)
  }

  // Word Handlers
  const handleWordFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      if (
        uploadedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        uploadedFile.type === "application/msword"
      ) {
        setWordFile(uploadedFile)
        
        // Upload to 0G for decentralized storage
        if (enableDecentralizedStorage && zeroGStatus?.configured) {
          await uploadToZeroG(uploadedFile)
        }
        
        toast({
          title: "Document uploaded",
          description: `${uploadedFile.name} is ready for AI processing`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a .docx or .doc file",
          variant: "destructive",
        })
      }
    }
  }

  const handleWordDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleWordDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (
      droppedFile?.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      droppedFile?.type === "application/msword"
    ) {
      setWordFile(droppedFile)
      toast({
        title: "Document uploaded",
        description: `${droppedFile.name} is ready for AI processing`,
      })
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .docx or .doc file",
        variant: "destructive",
      })
    }
  }

  const handleWordGenerate = async () => {
    if (!wordFile || !wordPrompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload a document and provide a prompt",
        variant: "destructive",
      })
      return
    }

    setIsWordGenerating(true)
    setWordProgress(0)
    setGeneratedWordFile(null)
    setWordResult(null)

    try {
      const formData = new FormData()
      formData.append("file", wordFile)
      formData.append("prompt", wordPrompt)

      const progressInterval = setInterval(() => {
        setWordProgress((prev) => Math.min(prev + 8, 90))
      }, 600)

      const response = await fetch("/api/generate-word", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setWordProgress(100)

      if (!response.ok) {
        let errorMessage = "Failed to generate document"
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            errorMessage = await response.text()
          }
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      setGeneratedWordFile(blob)

      setWordResult({
        fileName: `ai-generated-${wordFile.name}`,
        fileSize: blob.size,
        timestamp: new Date(),
        type: "word",
      })

      // Add to history
      addToHistory({
        type: 'word',
        title: wordPrompt.slice(0, 50),
        prompt: wordPrompt,
        fileName: `ai-generated-${wordFile.name}`,
        fileSize: blob.size,
        templateUsed: wordFile.name,
        zeroGHash: zeroGUploadResult?.rootHash,
      })

      toast({
        title: "Success!",
        description: "Your AI-enhanced document is ready to download",
      })
    } catch (error) {
      console.error("[v0] Error generating Word:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "There was an error generating your document",
        variant: "destructive",
      })
    } finally {
      setIsWordGenerating(false)
      setWordProgress(0)
    }
  }

  const handleWordDownload = () => {
    if (!generatedWordFile || !wordResult) return

    const url = URL.createObjectURL(generatedWordFile)
    const a = document.createElement("a")
    a.href = url
    a.download = wordResult.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Your document has been downloaded successfully",
    })
  }

  const handleWordStartOver = () => {
    setWordFile(null)
    setWordPrompt("")
    setGeneratedWordFile(null)
    setWordResult(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold text-foreground">Cluter AI</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Decentralized AI Document Generation</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            {/* History Button */}
            <HistoryToggle count={history.length} onClick={() => setIsHistoryOpen(true)} />
            
            {/* 0G Storage Status - Hidden on mobile */}
            {zeroGStatus?.configured ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-600">0G Connected</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">0G Offline</span>
              </div>
            )}
            <Badge variant="secondary" className="hidden lg:flex">
              Gemini 2.0
            </Badge>
          </div>
        </div>
      </header>

      {/* 0G Decentralized Storage Banner */}
      {(zeroGStatus?.configured || wallet.isConnected) && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-emerald-500/20">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">0G Storage Active</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Templates secured on 0G Network</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                    {wallet.isConnected 
                      ? `${wallet.address?.slice(0, 4)}...${wallet.address?.slice(-3)}`
                      : zeroGStatus?.walletAddress 
                        ? `${zeroGStatus.walletAddress.slice(0, 4)}...${zeroGStatus.walletAddress.slice(-3)}`
                        : 'Not connected'}
                  </span>
                  {wallet.balance && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs py-0 px-1.5">
                      {wallet.balance} A0GI
                    </Badge>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Privacy Protected</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Switch
                    checked={enableDecentralizedStorage}
                    onCheckedChange={setEnableDecentralizedStorage}
                    className="data-[state=checked]:bg-emerald-500 scale-90 sm:scale-100"
                  />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {enableDecentralizedStorage ? "On" : "Off"}
                  </span>
                </div>
              </div>
            </div>
            {zeroGUploadResult && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-emerald-500/20">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">Upload:</span>
                  <span className="font-mono text-foreground">{zeroGUploadResult.rootHash.slice(0, 12)}...</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/50 text-[10px] sm:text-xs py-0">
                    {(zeroGUploadResult.fileSize / 1024).toFixed(1)} KB
                  </Badge>
                  {isUploadingTo0G && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="hidden sm:inline">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-6 sm:py-12 text-center">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-2xl flex items-center justify-center">
              <Boxes className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
            Decentralized AI Document Creation
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground text-pretty leading-relaxed px-2">
            Generate presentations, papers, and documents with AI. Your templates stay private with 0G decentralized storage.
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground bg-muted/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Smart PPT</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground bg-muted/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>IEEE Papers</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground bg-muted/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span>0G Secured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 h-14">
              <TabsTrigger value="paper" className="flex items-center gap-2 text-sm">
                <FileType className="w-4 h-4" />
                <span className="hidden sm:inline">Conference Paper</span>
                <span className="sm:hidden">Paper</span>
              </TabsTrigger>
              <TabsTrigger value="ppt" className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Presentation</span>
                <span className="sm:hidden">PPT</span>
              </TabsTrigger>
              <TabsTrigger value="word" className="flex items-center gap-2 text-sm">
                <FileIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Word Document</span>
                <span className="sm:hidden">Word</span>
              </TabsTrigger>
            </TabsList>

            {/* Conference Paper Generator */}
            <TabsContent value="paper" className="space-y-8">
              {/* Template Selection */}
              <Card className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        1
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">Choose Template</h2>
                        <p className="text-sm text-muted-foreground">Select a built-in template or upload your own</p>
                      </div>
                    </div>
                  </div>

                  {/* Built-in Templates */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Built-in Templates</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {PAPER_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`relative group p-4 rounded-xl border-2 transition-all text-left ${
                            selectedTemplate?.id === template.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }`}
                        >
                          <div className="aspect-[3/4] bg-muted rounded-lg mb-3 overflow-hidden">
                            <img
                              src={template.preview || "/placeholder.svg"}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-medium text-sm text-foreground">{template.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                          {selectedTemplate?.id === template.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Upload Custom Template */}
                  <div
                    onDragOver={handlePaperDragOver}
                    onDrop={handlePaperDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                      paperFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="paper-file-upload"
                      accept=".pdf"
                      onChange={handlePaperFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="paper-file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-3">
                        {paperFile ? (
                          <>
                            <FileType className="w-12 h-12 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">{paperFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(paperFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                setPaperFile(null)
                                setDocumentMode("template")
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground">Upload Custom Template</p>
                              <p className="text-sm text-muted-foreground">Drag and drop or click to upload (PDF)</p>
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Research Details */}
              <Card className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Describe Your Research</h2>
                      <p className="text-sm text-muted-foreground">AI will generate content for each section</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="paper-title">Paper Title</Label>
                      <Input
                        id="paper-title"
                        placeholder="e.g., AI-Powered Smart Traffic Management"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authors">Authors & Affiliation</Label>
                      <Input
                        id="authors"
                        placeholder="e.g., John Doe - MIT"
                        value={authors}
                        onChange={(e) => setAuthors(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paper-prompt">Research Topic & Details</Label>
                    <Textarea
                      id="paper-prompt"
                      placeholder="Describe your research topic in detail. Include methodology, key findings, and objectives. The more detail you provide, the better the AI-generated content will be."
                      value={paperPrompt}
                      onChange={(e) => setPaperPrompt(e.target.value)}
                      className="min-h-32 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
                    <Wand2 className="w-4 h-4 flex-shrink-0" />
                    <span>
                      AI will generate Abstract, Introduction, Methodology, Results, Conclusion, and References
                    </span>
                  </div>
                </div>
              </Card>

              {/* Generate Button */}
              <Card className="p-6 md:p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      3
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Generate & Download</h2>
                  </div>

                  {isPaperGenerating && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating academic content...</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${paperProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {paperResult && generatedPaperFile && (
                    <div className="border border-border rounded-xl p-6 bg-accent/30">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="font-semibold text-foreground">Paper Generated Successfully</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {(paperResult.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button onClick={handlePaperDownload} className="gap-2">
                              <Download className="w-4 h-4" />
                              Download PDF
                            </Button>
                            <Button variant="outline" onClick={handlePaperStartOver} className="gap-2 bg-transparent">
                              <RefreshCw className="w-4 h-4" />
                              Start Over
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!paperResult && (
                    <Button
                      onClick={handlePaperGenerate}
                      disabled={isPaperGenerating || (!selectedTemplate && !paperFile) || !paperPrompt.trim()}
                      className="w-full h-12 text-base gap-2"
                      size="lg"
                    >
                      {isPaperGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating Paper...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Conference Paper
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Presentation Generator */}
            <TabsContent value="ppt" className="space-y-8">
              {/* Upload Template */}
              <Card className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Upload PowerPoint Template</h2>
                      <p className="text-sm text-muted-foreground">Upload any PPTX file - blank or with content</p>
                    </div>
                  </div>

                  <div
                    onDragOver={handlePptDragOver}
                    onDrop={handlePptDrop}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                      pptFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="ppt-file-upload"
                      accept=".pptx"
                      onChange={handlePptFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="ppt-file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-4">
                        {pptFile ? (
                          <>
                            <FileText className="w-16 h-16 text-primary" />
                            <div>
                              <p className="text-lg font-medium text-foreground">{pptFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(pptFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                setPptFile(null)
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <>
                            <Upload className="w-16 h-16 text-muted-foreground" />
                            <div>
                              <p className="text-lg font-medium text-foreground">Click to upload or drag and drop</p>
                              <p className="text-sm text-muted-foreground">
                                PPTX files (blank or with existing content)
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Blank PPT Option */}
                  <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="blank-ppt"
                      checked={isBlankPpt}
                      onChange={(e) => setIsBlankPpt(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <label htmlFor="blank-ppt" className="text-sm text-foreground cursor-pointer">
                      This is a blank template - AI will create and position all content from scratch
                    </label>
                  </div>
                </div>
              </Card>

              {/* PPT Settings */}
              <Card className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Configure Presentation</h2>
                      <p className="text-sm text-muted-foreground">Set slide count and describe your content</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="slide-count">Number of Slides</Label>
                      <Select value={slideCount.toString()} onValueChange={(v) => setSlideCount(Number.parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select slides" />
                        </SelectTrigger>
                        <SelectContent>
                          {[3, 5, 7, 10, 12, 15].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} slides
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ppt-prompt">Presentation Topic</Label>
                    <Textarea
                      id="ppt-prompt"
                      placeholder="Describe what your presentation should be about. Include key topics, target audience, and any specific points you want to cover."
                      value={pptPrompt}
                      onChange={(e) => setPptPrompt(e.target.value)}
                      className="min-h-32 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
                    <Wand2 className="w-4 h-4 flex-shrink-0" />
                    <span>AI will generate titles, bullet points, and add relevant images from Pixabay</span>
                  </div>
                </div>
              </Card>

              {/* Generate PPT */}
              <Card className="p-6 md:p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      3
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Generate & Download</h2>
                  </div>

                  {isPptGenerating && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating presentation content and images...</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pptProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {pptResult && generatedPptFile && (
                    <div className="border border-border rounded-xl p-6 bg-accent/30">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="font-semibold text-foreground">Presentation Generated Successfully</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pptResult.slideCount} slides • {(pptResult.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button onClick={handlePptDownload} className="gap-2">
                              <Download className="w-4 h-4" />
                              Download PPTX
                            </Button>
                            <Button variant="outline" onClick={handlePptStartOver} className="gap-2 bg-transparent">
                              <RefreshCw className="w-4 h-4" />
                              Start Over
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!pptResult && (
                    <Button
                      onClick={handlePptGenerate}
                      disabled={isPptGenerating || !pptFile || !pptPrompt.trim()}
                      className="w-full h-12 text-base gap-2"
                      size="lg"
                    >
                      {isPptGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating Presentation...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Presentation
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Word Document Generator */}
            <TabsContent value="word" className="space-y-8">
              {/* Upload Word Document */}
              <Card className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Upload Word Document</h2>
                      <p className="text-sm text-muted-foreground">Upload a .docx file to transform with AI</p>
                    </div>
                  </div>

                  <div
                    onDragOver={handleWordDragOver}
                    onDrop={handleWordDrop}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                      wordFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="word-file-upload"
                      accept=".docx,.doc"
                      onChange={handleWordFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="word-file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-4">
                        {wordFile ? (
                          <>
                            <FileIcon className="w-16 h-16 text-primary" />
                            <div>
                              <p className="text-lg font-medium text-foreground">{wordFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(wordFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                setWordFile(null)
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <>
                            <Upload className="w-16 h-16 text-muted-foreground" />
                            <div>
                              <p className="text-lg font-medium text-foreground">Click to upload or drag and drop</p>
                              <p className="text-sm text-muted-foreground">Word documents (.docx, .doc)</p>
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Word Prompt */}
              <Card className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Describe Your Requirements</h2>
                      <p className="text-sm text-muted-foreground">Tell AI what content to generate</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="word-prompt">Content Requirements</Label>
                    <Textarea
                      id="word-prompt"
                      placeholder="Describe what you want the document to contain. AI will analyze your template structure and replace the content accordingly while maintaining the formatting."
                      value={wordPrompt}
                      onChange={(e) => setWordPrompt(e.target.value)}
                      className="min-h-32 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
                    <Wand2 className="w-4 h-4 flex-shrink-0" />
                    <span>AI will preserve document structure and replace text while maintaining formatting</span>
                  </div>
                </div>
              </Card>

              {/* Generate Word */}
              <Card className="p-6 md:p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      3
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Generate & Download</h2>
                  </div>

                  {isWordGenerating && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing document and generating content...</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${wordProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {wordResult && generatedWordFile && (
                    <div className="border border-border rounded-xl p-6 bg-accent/30">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="font-semibold text-foreground">Document Generated Successfully</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {(wordResult.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button onClick={handleWordDownload} className="gap-2">
                              <Download className="w-4 h-4" />
                              Download DOCX
                            </Button>
                            <Button variant="outline" onClick={handleWordStartOver} className="gap-2 bg-transparent">
                              <RefreshCw className="w-4 h-4" />
                              Start Over
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!wordResult && (
                    <Button
                      onClick={handleWordGenerate}
                      disabled={isWordGenerating || !wordFile || !wordPrompt.trim()}
                      className="w-full h-12 text-base gap-2"
                      size="lg"
                    >
                      {isWordGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating Document...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Document
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-4 sm:py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Boxes className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Cluter AI</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Decentralized AI Document Creation powered by Gemini 2.0 & 0G Network
          </p>
        </div>
      </footer>

      {/* History Panel */}
      <HistoryPanel
        history={history}
        onRemove={removeFromHistory}
        onClear={clearHistory}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* 0G Steps Overlay - shows when uploading */}
      {isUploadingTo0G && (
        <div className="fixed bottom-4 right-4 w-80 z-50 animate-in slide-in-from-bottom-4">
          <ZeroGSteps
            steps={zeroGSteps.steps}
            isActive={zeroGSteps.isActive}
            rootHash={zeroGSteps.rootHash}
          />
        </div>
      )}
    </div>
  )
}
