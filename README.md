# AidFlow

AidFlow is a Next.js hackathon demo for social-service intake. It lets you:

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

2. Ensure `.env` contains valid `DATABASE_URL` and `DIRECT_URL` values.

3. Run Prisma migrations and seed data:

```bash
npx prisma migrate deploy
npx prisma db seed
```

4. Start the app:

```bash
npm run dev
```

## Demo Flow

1. Open `/` to pick a seeded applicant case or sign in as a demo user.
2. Open any of the three layout demos and update the packet.
3. Use the review step to approve and submit the case.
4. Open `/reviewer` or `/case/[id]` to confirm the saved submission state.

## Notes

- The login flow is intentionally lightweight for demo use and is not production auth.
- `npx tsc --noEmit` is the fastest local validation path.
- Production builds still depend on Prisma engine downloads being available in the environment.
