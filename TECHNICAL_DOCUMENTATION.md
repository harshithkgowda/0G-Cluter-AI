# Cluter AI - Technical Documentation

## Complete Technical Report for Research Paper

---

## 1. Executive Summary

**Cluter AI** is a decentralized AI-powered document generation platform that enables users to create professional presentations (PPT), IEEE-format conference papers (PDF), and Word documents using artificial intelligence. The platform integrates with **0G Network** for decentralized storage, **Razorpay** for payments, and utilizes **Google Gemini 2.0 Flash** via OpenRouter for AI content generation.

### Key Value Propositions:
- AI-powered document generation with minimal user input
- Decentralized storage via 0G Network for data sovereignty
- Support for academic paper templates (IEEE, ACM, Springer)
- Credit-based monetization with premium subscription options
- Web3 wallet integration for blockchain interactions

---

## 2. Technology Stack

### 2.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.0 | React framework with App Router |
| **React** | 19.2.0 | UI component library |
| **TypeScript** | ^5 | Type-safe JavaScript |
| **Tailwind CSS** | ^4.1.9 | Utility-first CSS framework |
| **Radix UI** | Various | Headless accessible components |
| **Lucide React** | ^0.454.0 | Icon library |
| **React Hook Form** | ^7.60.0 | Form state management |
| **Zod** | 3.25.76 | Schema validation |

### 2.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.0.0 | Serverless API endpoints |
| **Node.js** | Latest | Runtime environment |

### 2.3 AI & ML Services

| Service | Model | Purpose |
|---------|-------|---------|
| **OpenRouter** | google/gemini-2.0-flash-001 | Content generation for all document types |
| **Pixabay API** | - | Image search and retrieval for presentations |

### 2.4 Document Processing Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **pdf-lib** | 1.17.1 | PDF creation and manipulation |
| **pdf-parse** | 2.4.5 | PDF parsing and text extraction |
| **PizZip** | Latest | ZIP file manipulation for PPTX/DOCX |
| **@xmldom/xmldom** | Latest | XML parsing for Office documents |
| **pptxgenjs** | 4.0.1 | PowerPoint generation |

### 2.5 Blockchain & Web3

| Technology | Purpose |
|------------|---------|
| **Ethers.js** | 6.16.0 | Ethereum/EVM wallet interactions |
| **0G Network (Testnet)** | Decentralized storage |
| **MetaMask** | Wallet connection |

### 2.6 Payment Integration

| Service | Purpose |
|---------|---------|
| **Razorpay** | Indian payment gateway (INR) |

### 2.7 Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **shadcn/ui** | Latest | Pre-built component library |
| **tw-animate-css** | 1.3.3 | Animation utilities |
| **class-variance-authority** | ^0.7.1 | Component variant management |
| **tailwind-merge** | ^2.5.5 | Tailwind class merging |

### 2.8 Analytics & Monitoring

| Service | Purpose |
|---------|---------|
| **Vercel Analytics** | Usage tracking and monitoring |

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16 App Router                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │  PPT Gen UI  │  │  Paper Gen   │  │  Word Gen    │          │   │
│  │  │  Component   │  │  Component   │  │  Component   │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │  Wallet      │  │  Credits     │  │  History     │          │   │
│  │  │  Connect     │  │  Panel       │  │  Panel       │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Next.js API Routes (Serverless)                │   │
│  │                                                                  │   │
│  │  /api/generate-ppt      → PPT generation endpoint               │   │
│  │  /api/generate-paper    → Paper generation endpoint             │   │
│  │  /api/generate-word     → Word document generation              │   │
│  │  /api/razorpay/*        → Payment processing                    │   │
│  │  /api/zerog-storage     → Decentralized storage                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  OpenRouter  │  │   Pixabay    │  │  Razorpay    │                  │
│  │  (Gemini AI) │  │  (Images)    │  │  (Payments)  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                    0G Network (Testnet)                        │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │     │
│  │  │  EVM RPC    │  │  Storage    │  │  Block      │           │     │
│  │  │  Endpoint   │  │  Nodes      │  │  Explorer   │           │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │     │
│  └───────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Architecture

```
app/
├── page.tsx                    # Main application page (client component)
├── layout.tsx                  # Root layout with metadata
├── globals.css                 # Global styles and Tailwind configuration
└── api/
    ├── generate-ppt/route.ts   # PPT generation API
    ├── generate-paper/route.ts # Paper generation API
    ├── generate-word/route.ts  # Word generation API
    ├── zerog-storage/route.ts  # 0G storage API
    └── razorpay/
        ├── create-order/route.ts
        └── verify-payment/route.ts

components/
├── ui/                         # shadcn/ui components (60+ components)
├── wallet-connect.tsx          # Web3 wallet connection UI
├── history-panel.tsx           # Generation history sidebar
├── credits-panel.tsx           # Credits/subscription management
├── zerog-steps.tsx             # 0G upload progress indicator
└── theme-provider.tsx          # Dark/light theme management

lib/
├── ai-content-generator.ts     # AI content generation (PPT)
├── paper-content-generator.ts  # AI content generation (Papers)
├── pdf-generator.ts            # IEEE paper PDF creation
├── pdf-parser.ts               # PDF template parsing
├── pptx-processor.tsx          # PPTX manipulation
├── image-fetcher.ts            # Pixabay image search
├── zerog-storage.ts            # 0G Network integration
└── utils.ts                    # Utility functions

hooks/
├── use-credits.ts              # Credits state management
├── use-wallet.ts               # Web3 wallet state
├── use-generation-history.ts   # History management
├── use-toast.ts                # Toast notifications
└── use-mobile.ts               # Mobile detection
```

---

## 4. Core Features & Implementation

### 4.1 PowerPoint Generation

#### 4.1.1 Process Flow
```
User Input → Template Upload → AI Content Generation → Image Search → PPTX Modification → Download
```

#### 4.1.2 Technical Implementation

**AI Content Generation (`lib/ai-content-generator.ts`)**
```typescript
interface SlideContent {
  slideNumber: number
  title: string
  content: string[]
  imageQuery?: string
}

// Uses OpenRouter API with Gemini 2.0 Flash
// Temperature: 0.8 (creative content)
// Max tokens: 3000
```

**PPTX Processing (`lib/pptx-processor.tsx`)**
- Uses PizZip to unzip and manipulate PPTX files
- Modifies XML content within slides
- Supports dynamic slide dimensions detection
- Embeds images with proper relationship management
- Handles EMU (English Metric Units) conversions

**Image Integration (`lib/image-fetcher.ts`)**
- Searches Pixabay API for relevant images
- Parallel image downloading
- Automatic query simplification for better results
- Fallback to generic business images

#### 4.1.3 Output Specifications
- Format: PPTX (Office Open XML)
- Layout: Dynamic (adapts to template dimensions)
- Typography: Calibri font family
- Title: 26pt bold
- Content: 13.5pt regular
- Bullet style: Wingdings § character

### 4.2 Conference Paper Generation

#### 4.2.1 Supported Templates
| Template ID | Name | Organization |
|-------------|------|--------------|
| ieee-conference | IEEE Conference | IEEE |
| ieee-journal | IEEE Journal | IEEE |
| acm-sigconf | ACM SIGCONF | ACM |
| springer-lncs | Springer LNCS | Springer |

#### 4.2.2 Process Flow
```
Template Selection/Upload → Structure Extraction → AI Content Generation → PDF Rendering → Download
```

#### 4.2.3 Technical Implementation

**PDF Parsing (`lib/pdf-parser.ts`)**
```typescript
interface ParsedPaper {
  title: string
  authors: string[]
  affiliations: string[]
  abstract: string
  keywords: string[]
  sections: PaperSection[]
  references: string[]
  fullText: string
}
```

**AI Paper Generation (`lib/paper-content-generator.ts`)**
- Structured JSON output from AI
- Section-by-section content generation
- Automatic citation generation in IEEE format
- Robust JSON parsing with fallback mechanisms

**PDF Generation (`lib/pdf-generator.ts`)**
- Uses pdf-lib for native PDF creation
- Two-column IEEE format layout
- Proper typography hierarchy
- Roman numeral section numbering
- Standard fonts: Times Roman family

#### 4.2.4 Output Specifications
- Format: PDF
- Page size: Letter (612 x 792 points)
- Margins: 0.75" left/right, 1" top/bottom
- Columns: Two-column layout with 18pt gap
- Title: 14pt bold, centered
- Body: 9pt regular
- References: 8pt regular

### 4.3 Word Document Generation

#### 4.3.1 Document Types
- Report
- Proposal
- Article
- Research
- Default (general purpose)

#### 4.3.2 Process Flow
```
Template Upload → Section Extraction → AI Content Generation → XML Replacement → Download
```

#### 4.3.3 Technical Implementation

**DOCX Processing (`app/api/generate-word/route.ts`)**
- Uses PizZip for DOCX manipulation
- @xmldom/xmldom for XML parsing
- Preserves original template formatting
- Replaces heading and paragraph content
- Maintains document styles

---

## 5. Decentralized Storage (0G Network)

### 5.1 Network Configuration

```typescript
const ZEROG_CONFIG = {
  rpcUrl: 'https://evmrpc-testnet.0g.ai/',
  flowContractAddress: '0xbD2C3F0E65eDF5582141C35969d66e34e8F70B91',
  indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai',
  kvClientUrl: 'https://kv-testnet.0g.ai',
  chainId: 16600,
}
```

### 5.2 Wallet Integration

**Supported Networks:**
- 0G Newton Testnet (Chain ID: 16600 / 0x40D8)

**Native Currency:**
- Name: A0GI
- Symbol: A0GI
- Decimals: 18

### 5.3 Storage Operations

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Upload | POST /api/zerog-storage | Upload file to decentralized storage |
| Download | POST /api/zerog-storage | Retrieve file by root hash |
| List | POST /api/zerog-storage | List uploaded files |
| Balance | POST /api/zerog-storage | Check wallet balance |
| Hash | POST /api/zerog-storage | Generate file content hash |

### 5.4 Upload Process Steps

1. **Wallet Connected** - Verify wallet connection
2. **Preparing Upload** - Hash file content using keccak256
3. **Uploading to 0G** - Send to decentralized storage nodes
4. **Verifying** - Confirm transaction on network
5. **Secured** - File stored with root hash

---

## 6. Payment System

### 6.1 Credit Packages

| Package | Credits | Price (INR) | Description |
|---------|---------|-------------|-------------|
| Starter | 50 | ₹99 | Entry-level package |
| Pro | 150 | ₹249 | Best value (Popular) |
| Enterprise | 500 | ₹699 | For teams |
| Premium Monthly | Unlimited | ₹499/month | Subscription |

### 6.2 Credit Usage
- 1 credit = 1 PPT generation (any slide count)
- 1 credit = 1 Conference paper generation
- 1 credit = 1 Word document generation
- Premium: Includes 0G decentralized storage

### 6.3 Razorpay Integration

**Order Creation Flow:**
```
Client → POST /api/razorpay/create-order → Razorpay API → Order ID
```

**Payment Verification:**
```
Razorpay Callback → POST /api/razorpay/verify-payment → HMAC-SHA256 Verification → Credits Added
```

**Security:**
- HMAC-SHA256 signature verification using Web Crypto API
- Server-side validation of all payments
- No client-side credit manipulation

---

## 7. State Management

### 7.1 Client-Side State

**Credits System (`hooks/use-credits.ts`)**
```typescript
interface CreditsData {
  credits: number
  totalUsed: number
  lastUpdated: number
  isPremium: boolean
  subscriptionEnd?: number
}
```
- Persisted in localStorage
- Initial credits: 30 (free tier)
- Automatic subscription expiry check

**Generation History (`hooks/use-generation-history.ts`)**
```typescript
interface GenerationHistoryItem {
  id: string
  type: 'paper' | 'ppt' | 'word'
  title: string
  prompt: string
  fileName: string
  fileSize: number
  createdAt: number
  zeroGHash?: string
  templateUsed?: string
  slideCount?: number
}
```
- Maximum 50 items stored
- Persisted in localStorage
- Filterable by document type

**Wallet State (`hooks/use-wallet.ts`)**
```typescript
interface WalletState {
  address: string | null
  balance: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: string | null
  error: string | null
}
```
- MetaMask integration
- Auto-reconnection on page load
- Network switching support

### 7.2 Component State

Main page component manages:
- Active tab (paper/ppt/word)
- Document mode (template/upload/edit)
- Generation progress states
- File blobs for download
- 0G upload status

---

## 8. API Reference

### 8.1 POST /api/generate-ppt

**Request:**
```
Content-Type: multipart/form-data

Fields:
- file: File (PPTX template)
- prompt: string
- slideCount: number (optional)
- isBlank: boolean (optional)
```

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="ai-generated-{original-name}"
```

### 8.2 POST /api/generate-paper

**Request:**
```
Content-Type: multipart/form-data

Fields:
- file: File (PDF template, optional)
- prompt: string (research topic)
- title: string (optional)
- authors: string (optional)
- templateId: string (optional, built-in template)
```

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="ai-conference-paper.pdf"
```

### 8.3 POST /api/generate-word

**Request:**
```
Content-Type: multipart/form-data

Fields:
- file: File (DOCX template)
- prompt: string
- documentType: string (report|proposal|article|research|default)
```

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="ai-generated-{original-name}"
```

### 8.4 POST /api/zerog-storage

**Request:**
```
Content-Type: multipart/form-data

Fields:
- action: string (upload|download|list|balance|hash)
- file: File (for upload/hash actions)
- rootHash: string (for download action)
```

**Response (Upload):**
```json
{
  "success": true,
  "rootHash": "0x...",
  "txHash": "0x...",
  "fileSize": 12345,
  "timestamp": 1234567890,
  "walletAddress": "0x...",
  "message": "File uploaded to 0G decentralized storage successfully"
}
```

### 8.5 POST /api/razorpay/create-order

**Request:**
```json
{
  "packageId": "starter|pro|enterprise|premium_monthly"
}
```

**Response:**
```json
{
  "orderId": "order_...",
  "amount": 9900,
  "currency": "INR",
  "keyId": "rzp_...",
  "packageName": "Starter Pack",
  "credits": 50,
  "subscription": false,
  "durationDays": 0
}
```

### 8.6 POST /api/razorpay/verify-payment

**Request:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "...",
  "credits": 50,
  "subscription": false,
  "durationDays": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "credits": 50,
  "subscription": false,
  "durationDays": 0,
  "paymentId": "pay_..."
}
```

---

## 9. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key (starts with sk-or-) |
| `PIXABAY_API_KEY` | No | Pixabay API key for image search |
| `RAZORPAY_KEY_ID` | No | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret key |
| `ZEROG_PRIVATE_KEY` | No | 0G Network wallet private key |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for API referer headers |

---

## 10. Security Considerations

### 10.1 API Security
- All sensitive operations performed server-side
- No exposure of API keys to client
- Rate limiting through credit system

### 10.2 Payment Security
- HMAC-SHA256 signature verification
- Server-side order validation
- No client-side amount manipulation

### 10.3 File Handling
- File type validation on upload
- Size limits enforced
- Content-type verification

### 10.4 Wallet Security
- Private keys stored only in environment variables
- Client-side wallet connection via MetaMask
- No private key exposure to frontend

---

## 11. Performance Optimizations

### 11.1 Frontend
- React 19.2 with concurrent features
- Next.js App Router with streaming
- Lazy loading of heavy components
- Optimistic UI updates

### 11.2 Backend
- Serverless functions (auto-scaling)
- Parallel image downloads
- Streaming responses for large files
- Abort controller for timeout handling

### 11.3 Document Processing
- DEFLATE compression for PPTX/DOCX
- Efficient XML manipulation
- Memory-conscious buffer handling

---

## 12. Error Handling

### 12.1 AI Generation Errors
- JSON parsing with multiple fallback strategies
- Automatic retry on malformed responses
- Graceful degradation with partial content

### 12.2 File Processing Errors
- Type validation with user feedback
- Size limit enforcement
- Corrupt file detection

### 12.3 Network Errors
- Timeout handling (5 minutes for large files)
- Retry mechanisms for transient failures
- User-friendly error messages

---

## 13. Deployment

### 13.1 Platform
- **Vercel** (recommended)
- Supports Next.js 16 App Router
- Serverless function support
- Edge network for global distribution

### 13.2 Build Configuration
```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start"
  }
}
```

### 13.3 Requirements
- Node.js 18+
- pnpm (package manager)
- Environment variables configured

---

## 14. Future Enhancements

### 14.1 Planned Features
- Real-time collaboration
- More template formats (LaTeX, Markdown)
- Additional AI models
- Enhanced 0G Storage integration (full SDK)
- Multi-language support

### 14.2 Scalability Considerations
- Database integration for user accounts
- Redis caching for frequent operations
- CDN for static assets
- Webhook support for async processing

---

## 15. License & Attribution

### 15.1 Open Source Dependencies
All dependencies are used under their respective licenses (MIT, Apache 2.0, etc.)

### 15.2 Third-Party Services
- OpenRouter (AI inference)
- Pixabay (Image search, free tier)
- Razorpay (Payment processing)
- 0G Network (Decentralized storage)

---

## 16. Appendix

### A. File Structure Summary
```
Total Files: ~100+
- React Components: 65+
- API Routes: 5
- Utility Libraries: 8
- Custom Hooks: 5
- Configuration Files: 5
```

### B. Dependencies Count
- Production Dependencies: 43
- Development Dependencies: 8

### C. Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- MetaMask browser extension required for Web3 features

---

*Document generated for research purposes. Last updated: 2026*
