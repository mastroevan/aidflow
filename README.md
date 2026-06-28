# AidFlow

AidFlow is a Next.js hackathon project for social-service intake. It lets you:

- open one applicant case in three different portal layouts
- save intake edits into a Prisma-backed case packet
- review the saved packet before submission
- persist reviewer approval and final submission metadata
- verify the same case state from the reviewer dashboard and case detail view

## Stack

- Next.js App Router
- React 19
- Prisma with PostgreSQL
- Tailwind CSS 4

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env`, then set valid `DATABASE_URL` and `DIRECT_URL` values.

```bash
cp .env.example .env
```

Optional AWS Bedrock variables are included in the example for AI-backed intake and eligibility analysis. Set `AWS_BEARER_TOKEN_BEDROCK` to a short-term Bedrock API key, or leave it unset and let the app generate short-term tokens from your active AWS session credentials. If neither path is available, the app uses local fallback analysis.

3. Run Prisma migrations and seed data:

```bash
npx prisma migrate deploy
npx prisma db seed
```

4. Start the app:

```bash
npm run dev
```

## Portal Flow

1. Open `/` to pick a seeded applicant case or sign in with a prepared account.
2. Open any of the three portal layouts and update the packet.
3. Use the review step to approve and submit the case.
4. Open `/reviewer` or `/case/[id]` to confirm the saved submission state.

## Notes

- The login flow is intentionally lightweight and is not production auth.
- `npx tsc --noEmit` is the fastest local validation path.
- Production builds still depend on Prisma engine downloads being available in the environment.
