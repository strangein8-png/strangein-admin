# StrangeIn Admin Panel (Next.js)

Shows user signups and their details. **No backend changes needed.**

## Setup
1. In your StrangeIn app, sign up a normal account to act as the service account
   (e.g. mobile 9999999999, 6-digit password).
2. In MongoDB set `isReported: "true"` on that account (hides it from the swipe feed and from this list).
3. `cp .env.example .env.local` and fill in the values.
4. `npm install`
5. `npm run dev` -> open http://localhost:3001/admin

## How it works
The browser only talks to this app's `/api/admin/*` routes. The Next.js server logs
into your backend `/Signup/login` with the service account, keeps the JWT in memory,
and calls `GET /Signup/`. No backend URL, JWT or password reaches the browser.

## Notes
- `GET /Signup/` doesn't return `createdDate`, so Joined/Today/7-day stats appear
  automatically only if your backend starts returning `createdDate`.
- Deploy on Vercel: add the same 5 env vars in project settings.
