# VALIDATE Proposal Machine

A professional video production proposal generator built for VALIDATE creative agency.

## Features

- AI-powered proposal generation from rough notes
- Visual slide editor with drag-and-drop
- Image library with Supabase storage
- Project management with save/load
- Export to PDF/PPTX
- Real-time chat refinement

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for image storage)
- Anthropic API key (for AI generation)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/validate-proposal-machine.git
cd validate-proposal-machine
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Add your API keys to `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

This project is configured for Vercel deployment:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- Supabase (storage)
- Anthropic Claude API
- Lucide React (icons)

## License

Private - VALIDATE Creative Agency
