# Export verification — 9 October 2026

Verified on Node.js 24.19.0 / Next.js 16.3.4:
- Production build and TypeScript checks.
- 52-food data integrity, source mapping, grams/serving calculations, missing-versus-zero handling and basket save/import compatibility.
- The actual setup script generated a test administrator and local configuration.
- Local registration, login and logout; opaque sessions and password hashes; forged ChatGPT identity headers rejected.
- Cross-origin requests rejected; public registration cannot claim the configured administrator address.
- Private food/weight/settings writes and account isolation for reads, edits, deletes and exports.
- Food calorie/amino calculations, repeated-write idempotency, signup/feedback and creator-only dashboard/export.
- Creator setup restricted to the configured local administrator; forged headers and other accounts cannot claim creator access.
- Chosen creator credentials, sign-in/sign-out, protected dashboard/CSV exports, password changes, recovery and revocation of old creator sessions.
- Food/weight/settings, ordinary account sessions and creator sessions survived stopping and restarting the Node server.
- Feedback portal rendering, saved ratings/comments and private creator feedback CSV.
- Identical feedback retries do not create duplicates; reusing an ID with changed content returns a conflict instead of silently confirming the old response.
- Subscription and checkout paths are unavailable; the homepage explains the beta features and planned price.

All test identities and data were temporary. They were removed before packaging. This ZIP contains no .env.local, real database, saved account, private signup, secret token, node_modules or build cache. Run setup on your own server.

Not executed: Docker image build/run; desktop and phone browser interaction/visual QA. Billing and outbound email are not connected. Test your actual HTTPS domain, proxy and persistent disk before inviting customers.
