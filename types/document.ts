"use client"

export interface DocumentSection {
  id: string
  type: "title" | "heading" | "paragraph" | "bullet-points" | "image"
  content: string
  isEditing?: boolean
  isGenerating?: boolean
}

export interface DocumentPage {
  id: string
  pageNumber: number
  title: string
  sections: DocumentSection[]
}

export interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  uploadedAt: Date
  pages: DocumentPage[]
  currentPageIndex: number
  template: "ppt" | "paper" | "word"
  status: "ready" | "generating" | "error"
}

export interface GenerationState {
  isGenerating: boolean
  currentPage: number
  totalPages: number
  progress: number
}
