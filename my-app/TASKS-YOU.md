# Tasks for you

These need your accounts, secrets, decisions or content. Claude cannot do them.
Checked on 2026-10-20 against Vercel, Neon and the live site.

## Blocking launch

1. **Make the site public.** The project has Vercel SSO protection on
   (`all_except_custom_domains`) and no custom domain, so every `*.vercel.app` URL asks
   visitors to log in to Vercel. Either:
   - add a custom domain in Vercel (the SSO rule excludes custom domains), or
   - turn off Deployment Protection for production in the project settings.
2. **Add outgoing email.** No `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` or `SMTP_PASS` exist in
   Vercel, so order confirmation emails only go to the log and customers never get their
   order number. Pick a provider (Resend, Postmark, Mailgun, SES...) and set the four
   variables for production. Make sure `EMAIL_FROM` (`hello@irisgarden.com`) is a verified
   sender on that provider.
3. **Update the site URL after you add a domain.** Change `NEXT_PUBLIC_SITE_URL` in Vercel,
   then redeploy. It currently points at `iris-garden-gules.vercel.app`, and the sitemap,
   robots file and share tags all use it.
4. **Update Google sign-in for the new domain.** In Google Cloud Console, add
   `<your domain>/auth/google/callback` as an authorised redirect URI on the OAuth client
   whose ID ends in `...apps.googleusercontent.com`. I could not check what is registered.
5. **Decide on payments.** Orders are cash on delivery and stay `pending`. If you want
   online payment, choose a gateway (Stripe, etc.), create the account and give Claude the
   keys through Vercel env vars, not in chat.

## Content to replace (all editable in the admin, no code needed)

6. **Business details.** The site shows placeholders: phone `+1 (555) 014-2200`, address
   `14 Wildflower Lane, Portland, OR`, and an Instagram link that goes to
   `https://instagram.com`. Update them in Admin > Settings.
7. **Photos.** The 15 products, 4 categories and the shop-front image use Unsplash demo
   photos that the seed uploaded. Upload your own and attach them to each product.
8. **Product copy and prices.** The names, descriptions and prices are demo data. Edit or
   replace them in Admin > Products.
9. **About, Delivery and Contact text.** The "started with one cold room and a market
   stall" story is placeholder copy. Check delivery zones, fees, the free-delivery
   threshold (currently $100) and the 2pm same-day cutoff in Settings.

## Account and security housekeeping

10. **Change the admin password** after your first login if the seed password was shared or
    typed anywhere. Add any other staff as users.
11. **Fix the database SSL warning.** Production logs show a `pg` warning about `sslmode`
    (35 times). In the `DATABASE_URI` env var, change `sslmode=require` to
    `sslmode=verify-full`.
12. **Back up before real orders.** The Neon free plan keeps only 6 hours of history and the
    `production` branch is not protected. Consider protecting the branch and a paid plan or
    a scheduled export before taking real orders.
13. **Keep `SEED_ON_BUILD` off in production and preview.** It is correctly set only on
    `development`. Never add it to production: it wipes products, categories and media.

## Optional, when you grow

14. **Redis or edge rate limiting.** Only if you want it instead of the Postgres version
    Claude can build (`TASKS-CLAUDE.md`, item 5). Needs an Upstash account.
15. **Not built yet:** stock counts, discount codes, reviews, analytics and error tracking,
    multi-language. Say which ones matter and Claude can plan them.

## Test it yourself once it is public

- Place a test order as a guest, then look it up at `/order/lookup`.
- Register an account, then sign in with Google.
- Send a message through `/contact` and check it appears in the admin.
- Upload an image in the admin and confirm it shows on the storefront.
