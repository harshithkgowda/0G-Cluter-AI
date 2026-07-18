# AI PPT Generator

Transform your PowerPoint presentations with AI-powered content generation and automatic image sourcing.

## Features

- **AI Content Generation**: Powered by Gemini 2.0 Flash via OpenRouter
- **Smart Image Sourcing**: Automatically finds relevant images from Pixabay
- **Template Preservation**: Maintains your template's design while replacing content
- **Easy to Use**: Simple 3-step process - upload, describe, generate

## Setup

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables

**Important**: You must add environment variables to your Vercel project for the app to work.

#### In v0 (Current Environment)

1. Click the **sidebar icon** on the left side of the chat
2. Select **"Vars"** from the menu
3. Add the following environment variables:

\`\`\`
OPENROUTER_API_KEY=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
PIXABAY_API_KEY=52589174-34b492089fe2dee32626389f6
NEXT_PUBLIC_SITE_URL=https://your-app-url.vercel.app
\`\`\`

#### For Local Development

Copy `.env.example` to `.env.local` and add your API keys:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then edit `.env.local`:

\`\`\`env
OPENROUTER_API_KEY=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
PIXABAY_API_KEY=52589174-34b492089fe2dee32626389f6
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

1. **Upload Template**: Upload your PowerPoint (.pptx) template
2. **Describe Content**: Tell the AI what your presentation should be about
3. **Generate**: AI creates content, finds images, and generates your presentation

## Troubleshooting

### 401 Authentication Error

If you see "No cookie auth credentials found" error:

1. **Check Environment Variables**: Make sure `OPENROUTER_API_KEY` is set in the Vars section of the v0 sidebar
2. **Verify API Key**: Ensure your OpenRouter API key is valid and starts with `sk-or-v1-`
3. **Restart Preview**: After adding environment variables, refresh the preview

### No Images in Presentation

If images aren't being added:

1. Check that `PIXABAY_API_KEY` is set
2. Verify your Pixabay API key is active
3. Check the console logs for image fetch errors

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **AI**: Gemini 2.0 Flash via OpenRouter
- **Images**: Pixabay API
- **PPTX Processing**: PizZip, @xmldom/xmldom, PptxGenJS
- **UI**: shadcn/ui components with Tailwind CSS v4

## API Endpoints

### POST /api/generate-ppt

Generates an AI-enhanced PowerPoint presentation.

**Request**: FormData
- `file`: PPTX file
- `prompt`: Description of desired content

**Response**: Modified PPTX file

## License

MIT
