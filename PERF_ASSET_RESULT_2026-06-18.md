# PERF_ASSET_RESULT_2026-06-18

Scope: execution result for the v2.1 small-step asset optimization plan.

## Summary

Result: P0/P0.5/P0.6 is effective and deployable after final human visual review. P1 slicing was tested but should not ship yet.

The production site was not modified. A Vercel Preview deployment was created:

- Preview: `https://portfolio-deploy-2337tyg0b-tongs-projects-d87ea0c4.vercel.app`
- Inspect: `https://vercel.com/tongs-projects-d87ea0c4/portfolio-deploy/3K5DKLbCvyxVPMcBsYoAefJNM9vc`
- Deployment: `dpl_3K5DKLbCvyxVPMcBsYoAefJNM9vc`
- State: `READY`

Note: this Vercel team's preview deployments are protected. Anonymous curl/browser access returns 401. Authenticated `vercel curl` was used to verify the preview output.

## What Changed

Two real referenced IP long boards were replaced in the deploy package:

| asset | before | after | reduction |
|---|---:|---:|---:|
| `assets/projects/ip-001/detail-01.png` -> `detail-01.webp` | 7,865,309 B | 1,187,862 B | 84.9% |
| `assets/projects/ip-0001/detail-01.png` -> `detail-01.webp` | 8,185,061 B | 1,741,064 B | 78.7% |
| combined | 16,050,370 B | 2,928,926 B | 81.8% |

Deploy package size changed:

| metric | before | after |
|---|---:|---:|
| all files except `.git` | 397.8 MB | 385.3 MB |
| `assets/` | 396.3 MB | 383.8 MB |
| images | 342.4 MB | 329.9 MB |

Files changed:

- `index.html`
  - Warmup detail entries now preload `ip-001/detail-01.webp` and `ip-0001/detail-01.webp`.
- `project.html`
  - `ip-001` and `ip-0001` project detail entries now use WebP.
  - Trial detail images include `width`, `height`, `loading="lazy"`, and `decoding="async"`.
  - The detail button receives an inline `aspect-ratio` from asset metadata.
- `asset-manifest.json`
  - Records source/optimized paths, dimensions, byte sizes, hashes, first-screen/warmup status, and strategy notes.
- Deploy package
  - Removed `assets/projects/ip-001/detail-01.png`.
  - Removed `assets/projects/ip-0001/detail-01.png`.
  - Added WebP replacements.

Source workspace PNG masters are preserved under `/Users/flickerchen/Documents/网站/hi`.

## Verification

Static verification:

- `index.html`, `project.html`, `works.html`, and `eye-intro.html` parsed with Python `HTMLParser`.
- Inline scripts in `index.html` and `project.html` parsed with `new Function(...)`.
- `asset-manifest.json` parsed as valid JSON.
- Old trial PNG references are absent from `index.html` and `project.html`.
- Old project-page perf pass markers are not reintroduced:
  - `data-case-video`
  - `scheduleAdjacentProjectPrefetch`
  - `getProjectPrefetchAssets`
  - `addProjectPrefetch`

Local HTTP verification:

- `/` -> 200
- `/works.html?skipIntro=1` -> 200
- `/project.html?project=ip-001` -> 200
- `/project.html?project=ip-0001` -> 200
- `/assets/projects/ip-001/detail-01.webp` -> 200, 1,187,862 B
- `/assets/projects/ip-0001/detail-01.webp` -> 200, 1,741,064 B
- `/assets/projects/ip-001/detail-01.png` -> 404
- `/assets/projects/ip-0001/detail-01.png` -> 404

Local Playwright verification:

- Desktop and mobile checked for `/`, `/works.html?skipIntro=1`, `/project.html?project=ip-001`, and `/project.html?project=ip-0001`.
- No old PNG requests were observed.
- Trial long-board WebP requests were observed with correct byte sizes.
- Detail images have `width`/`height`, `loading`, and `decoding` attributes.
- Approximate CLS stayed near zero:
  - desktop `ip-001`: 0.000200
  - desktop `ip-0001`: 0.000170
  - mobile `ip-001`: 0
  - mobile `ip-0001`: 0
- No console errors were observed.
- One `ip-0001/hero.mp4` `net::ERR_ABORTED` appeared during automation. This is a browser video load interruption, not a missing asset or image regression.

Preview verification:

- Preview deployment is READY.
- Authenticated `vercel curl` confirmed:
  - `ip-001/detail-01.webp` -> 200, `image/webp`, `content-length: 1187862`, CDN HIT.
  - `ip-0001/detail-01.webp` -> 200, `image/webp`, `content-length: 1741064`, CDN HIT.
  - `ip-001/detail-01.png` -> 404.
  - `ip-0001/detail-01.png` -> 404.
  - Preview `index.html` and `project.html` contain the WebP references.

## P1 Slicing Result

P1 was attempted on `ip-001` only:

- Four WebP slices were generated and wired locally.
- Browser visual QA showed a visible horizontal seam at a slice boundary.
- The slicing code and slice files were removed from the final trial branch.

Conclusion: do not ship P1 slicing yet. Full high-quality WebP is simpler and visually safer for this round.

## Deployment Impact

If this branch is deployed to production:

- The current public site entry flow remains the same.
- The HR-facing URL should keep working.
- The two warmup long-board downloads drop from about 16.05 MB to about 2.93 MB.
- The preview-page warmup should become lighter by about 12.5 MB.
- The two project detail pages should load their long board as WebP instead of PNG.
- No CDN migration is needed for this first round.

Expected improvement:

- Most visible on first visit or cold cache.
- Less impact after the site is already warm in browser cache.
- This does not solve every heavy resource on the site; it validates the safer pattern for the remaining IP long boards.

Recommended next action:

1. Review the local screenshots or run a quick human visual check on the branch.
2. If accepted, deploy this branch to production.
3. Next batch can apply the same full WebP method to:
   - `ip-00001/detail-01.png`
   - `ip-000001/detail-01.png`
   - `ip-10/detail-01.png`

Do not proceed with P2 LQIP or P3 CDN until this P0 method is accepted in production.

