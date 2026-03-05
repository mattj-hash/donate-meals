# Donate Meals

Public-facing donation portal for Rethink Food. Helps supporters donate meals to communities in need.

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Hosting**: Vercel (linked to `mattj-hash/donate-meals`, production branch: `main`)

## Project Structure

```
app/
  layout.tsx   # Root layout
  page.tsx     # Home / donation landing page
```

## Dev Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server at http://localhost:3000
npm run build  # Production build
```

## Context

This is a standalone app, separate from the Rethink Food Board Portal (`rethink-food-board-portal`).
It lives at `github.com/mattj-hash/donate-meals` and is deployed independently on Vercel.
