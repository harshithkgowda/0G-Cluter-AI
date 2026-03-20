export interface DocumentPage {
  id: string
  pageNumber: number
  title: string
  sections: DocumentSection[]
  generatedAt?: Date
  thumbnail?: string
}

export interface DocumentSection {
  id: string
  type: "title" | "heading" | "paragraph" | "bullet-points" | "image" | "code"
  content: string
  isEditing?: boolean
  isGenerating?: boolean
  generationPrompt?: string
}

export interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  uploadedAt: Date
  pages: DocumentPage[]
  currentPageIndex: number
  currentSectionIndex?: number
  template: "ppt" | "paper" | "word"
  status: "uploading" | "processing" | "ready" | "generating" | "error"
  error?: string
  downloadUrl?: string
}

export interface GenerationState {
  isGenerating: boolean
  currentPage: number
  totalPages: number
  currentSection?: string
  progress: number
}
