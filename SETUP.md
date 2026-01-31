# AI PPT Generator with 0G Storage

An AI-powered document generator that creates professional presentations, conference papers, and Word documents with decentralized storage on 0G Network.

## Features

✨ **AI-Powered Content Generation**
- Generate conference papers with IEEE, ACM, Springer templates
- Create presentations with AI-generated content and images
- Transform Word documents with AI enhancement

🔐 **0G Decentralized Storage**
- Securely store documents on 0G Network
- Wallet integration for blockchain transactions
- Transparent file hashing and verification

🎨 **Smart Features**
- Automatic image fetching from Pixabay
- Multiple slide layouts and templates
- Professional formatting and styling
- Generation history tracking

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/harshithkgowda/0G-Cluter-AI.git
cd 0G-Cluter-AI
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Required: OpenRouter API Key for AI Content Generation
# Get your key from https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Required: Pixabay API Key for Image Search
# Get your key from https://pixabay.com/api/docs/
PIXABAY_API_KEY=your_pixabay_api_key_here

# Optional: 0G Network Private Key (for decentralized storage)
# This should be a wallet private key with 0G tokens
ZEROG_PRIVATE_KEY=your_0g_private_key_here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Getting API Keys

**OpenRouter API Key (Required)**
1. Visit https://openrouter.ai/
2. Sign up or log in
3. Go to https://openrouter.ai/keys
4. Create a new API key
5. Add credits to your account ($5-10 is sufficient for testing)

**Pixabay API Key (Required)**
1. Visit https://pixabay.com/
2. Sign up for a free account
3. Go to https://pixabay.com/api/docs/
4. Get your API key (free tier includes 5,000 requests/month)

**0G Network Private Key (Optional)**
- Only needed if you want to use decentralized storage features
- You can disable this feature in the UI if not configured

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
pnpm build
pnpm start
```

## Usage

### Generating a Presentation

1. Go to the **Presentation** tab
2. Upload a PPTX template (blank or with existing content)
3. Select the number of slides (3-15)
4. Describe your presentation topic
5. Click **Generate Presentation**
6. Download the generated PPTX file

### Creating a Conference Paper

1. Go to the **Conference Paper** tab
2. Select a built-in template (IEEE, ACM, Springer) or upload your own
3. Enter paper title and authors
4. Describe your research topic in detail
5. Click **Generate Paper**
6. Download the generated PDF

### Transforming a Word Document

1. Go to the **Word Document** tab
2. Upload a DOCX file
3. Provide instructions for AI transformation
4. Click **Generate Document**
5. Download the enhanced document

### Using 0G Decentralized Storage

1. Connect your wallet using the **Connect Wallet** button
2. Enable **Decentralized Storage** toggle (if disabled)
3. Upload any document - it will automatically be stored on 0G Network
4. View the storage animation showing the upload process
5. Copy the root hash for future retrieval

## Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **AI**: OpenRouter API (Gemini 2.0 Flash)
- **Image Search**: Pixabay API
- **Document Processing**: pdf-lib, pptxgenjs, pizzip
- **Blockchain**: ethers.js, 0G Network
- **UI Components**: Radix UI, shadcn/ui

## Troubleshooting

### PPT Not Generating

- **Check API Keys**: Ensure `OPENROUTER_API_KEY` and `PIXABAY_API_KEY` are set correctly
- **Template Required**: Upload a valid .pptx file
- **Prompt Required**: Provide a detailed description of your presentation
- **Check Console**: Open browser DevTools and check for error messages

### 0G Storage Animation Not Showing

- **Enable Toggle**: Make sure "Decentralized Storage" is enabled
- **Private Key**: Add `ZEROG_PRIVATE_KEY` to `.env.local` (optional)
- **File Upload**: The animation only shows when uploading files with 0G enabled
- **Browser DevTools**: Check console for 0G-related errors

### Build Errors

- **Clear Cache**: Delete `.next` folder and `node_modules`, then reinstall
- **Update Dependencies**: Run `pnpm install` to ensure all packages are up to date
- **Check Node Version**: Ensure you're using Node.js 18+ or 20+

### Environment Variables Not Loading

- **File Name**: Ensure file is named `.env.local` (not `.env`)
- **Restart Server**: Stop and restart `pnpm dev` after changing environment variables
- **No Spaces**: Remove any spaces around the `=` sign in environment variables

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables on Vercel

Add these in **Project Settings > Environment Variables**:
- `OPENROUTER_API_KEY`
- `PIXABAY_API_KEY`
- `ZEROG_PRIVATE_KEY` (optional)
- `NEXT_PUBLIC_SITE_URL` (your production URL)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:
- GitHub Issues: https://github.com/harshithkgowda/0G-Cluter-AI/issues
- Discord: [Join our community]

---

Built with ❤️ using Next.js and 0G Network
