# KEN — Real-Time Editor

The app source lives in this directory (`V3/editor`) — a Next.js 15 App
Router project. The full project README (features, screenshots, setup,
architecture) is at the repository root: [../README.md](../README.md).

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Required environment variables are listed
in `.env.example`.

## Deploy

The production deployment targets Vercel (this directory is the Vercel
project root). The `V3/cloudflare` worker handles document translation
and answer evaluation via Cloudflare Workers AI.
