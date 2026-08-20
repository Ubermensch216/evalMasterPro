# Build Project Workflow

This workflow compiles and builds the EvalMaster Pro Next.js project for production.

## Prerequisites
- Node.js >= 20.x
- Dependencies installed via `npm install`
- Environment variables configured in `.env.local`

## Steps

1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

2. Run type-checking:
   ```bash
   npm run typecheck
   ```

3. Build production bundle:
   ```bash
   npm run build
   ```
