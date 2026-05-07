# emerging.tools

Find what's next in dev tooling. Themes, extensions, fonts, and customizations — ranked by momentum, not popularity.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4

## Run

```bash
npm install
npm run dev
```

## Deploy

Deploys automatically to Vercel on push to `main`.

## Sync

`data/latest.json` is the production snapshot used during deploys and page rendering.

- `npm run sync` refreshes the local snapshot files.
- `.github/workflows/weekly-sync.yml` refreshes and commits snapshots on a schedule.
- `/api/sync` writes snapshot files only when running outside Vercel.
- On Vercel, `/api/sync` dispatches the GitHub Actions workflow instead of writing to ephemeral disk.

Hosted `/api/sync` requires:

- `SYNC_SECRET` for endpoint auth
- `GITHUB_TOKEN` with permission to dispatch workflows
- `SYNC_GITHUB_REPOSITORY` in `owner/repo` form
- Optional `SYNC_GITHUB_WORKFLOW` and `SYNC_GITHUB_REF`

## SEO

- `robots.ts` — crawling rules
- `sitemap.ts` — auto-generated sitemap
- JSON-LD structured data on all pages
- OpenGraph + Twitter card meta tags
