# Daily Demotivations

Your daily dose of demotivating quotes beautifully displayed on romantic landscapes.

## Overview

Daily Demotivations is a Next.js application that displays a different demotivating quote each day, overlaid on stunning romantic landscape photography. The quote selection is deterministic—everyone sees the same quote on the same day, creating a shared experience.

## Features

- 📅 **Deterministic Daily Quotes** - Same quote for everyone on the same day
- 🏔️ **Beautiful Landscapes** - High-quality romantic landscape backgrounds from Unsplash
- 📱 **Fully Responsive** - Optimized for mobile (320px) through desktop (1920px+)
- ⚡ **Blazing Fast** - Server-side rendering with 24-hour ISR caching
- 🎨 **Elegant Typography** - Serif fonts with zen/meditative aesthetic
- 🔗 **Social Ready** - Open Graph images for beautiful social sharing previews

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Images**: Unsplash API
- **Deployment**: Vercel
- **OG Images**: @vercel/og (Satori + Sharp)

## Prerequisites

- Node.js 18+ and npm
- Unsplash API access key (free tier available)

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd daily-demotivations
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get Unsplash API Key**
   - Visit [Unsplash Developers](https://unsplash.com/developers)
   - Create a new application
   - Copy your Access Key
   - **Important**: Apply for Production API access immediately (5000 req/hour vs 50 req/hour demo)

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Unsplash access key:
   ```
   UNSPLASH_ACCESS_KEY=your_actual_access_key_here
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Visit [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add environment variables in Vercel dashboard**
   - Go to your project settings
   - Navigate to Environment Variables
   - Add `UNSPLASH_ACCESS_KEY` with your key

4. **Redeploy**
   ```bash
   vercel --prod
   ```

## Architecture

- **Deterministic Selection**: Uses date-based hashing to ensure same quote per day globally
- **ISR Caching**: 24-hour revalidation with stale-while-revalidate prevents midnight stampede
- **Multi-layer Caching**: Unsplash API responses cached for 24 hours to prevent rate limit exhaustion
- **Fallback Images**: Local fallback landscapes for graceful degradation
- **Edge Runtime**: OG image generation uses edge functions for fast global distribution

## Performance

- ⚡ Lighthouse Score: 90+ on all metrics
- 🚀 LCP: <2.5s on mobile networks
- 📦 Bundle Size: <1MB (lightweight Satori, no Puppeteer)
- ⏱️ Cold Start: <10s for serverless functions

## License

MIT

## Credits

- Landscape photography via [Unsplash](https://unsplash.com)
- Built by [Kristof.pro](https://kristof.pro)
