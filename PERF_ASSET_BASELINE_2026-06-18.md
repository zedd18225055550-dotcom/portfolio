# PERF_ASSET_BASELINE_2026-06-18

Scope: P-1 read-only baseline for the production portfolio deploy package.

Branch/worktree:

- Worktree: `/Users/flickerchen/.config/superpowers/worktrees/portfolio-deploy/codex-asset-perf-v21`
- Branch: `codex/asset-perf-v21`
- HEAD: `a3ea67e chore: add preview perf self-test`
- Production URL checked: `https://portfolio-deploy-kappa-three.vercel.app`

No image conversion, CDN migration, page rewrite, push, or deployment was performed.

## 1. Package Size Baseline

Measured from the isolated deploy worktree, excluding `.git` by pruning it from `find`.

| area | size |
|---|---:|
| all files except `.git` | 397.8 MB |
| `assets/` | 396.3 MB |
| `assets/projects/` | 295.9 MB |
| all images (`png/jpg/jpeg/webp/avif`) | 342.4 MB |
| PNG images | 318.0 MB |
| WebP images | 8.7 MB |
| JPG/JPEG images | 15.7 MB |
| videos (`mp4/mov/webm`) | 38.1 MB |

Interpretation:

- The practical deploy package baseline is about 398 MB, not the larger stale parent-directory reading.
- The current optimization pressure is mostly PNG images, especially IP long boards.
- Video is noticeable in first-visit experience, but only about 38 MB total in the deploy package.

## 2. Deploy Excludes And Safety Scan

Current `.vercelignore`:

```text
.git/
.vercel/
.perf-backup-*/
node_modules/
.DS_Store
```

Safety scan for `.env*`, `.vercel/`, `.perf-backup-*`, `.DS_Store`, `*.swp`, `*.bak`, `*backup*`, `*.psd`, `*.sketch`, `*.zip` returned no matching files in the isolated worktree output.

Note: `chen-fx/` and `pet-demo.html` are present in this deploy package. They were not modified during this baseline pass.

## 3. Production Page Baseline

`curl -sL -o /dev/null` page checks:

| page | status | TTFB | total | HTML size |
|---|---:|---:|---:|---:|
| `/` | 200 | 0.377733s | 0.451914s | 37,432 B |
| `/eye-intro.html?fromPreview=1` | 200 | 0.281178s | 0.375998s | 111,308 B |
| `/works.html?skipIntro=1` | 200 | 0.275983s | 0.440091s | 113,866 B |
| `/project.html?project=ip-001` | 200 | 0.268580s | 0.525295s | 335,362 B |
| `/project.html?project=ip-0001` | 200 | 0.278722s | 0.547162s | 335,362 B |

Production HTML headers:

- HTML pages: `cache-control: public, max-age=0, must-revalidate`
- HTML pages are Vercel CDN HIT, but still revalidated by browser semantics.
- Asset files under `/assets/`: `cache-control: public, max-age=2592000, stale-while-revalidate=86400`
- Checked key assets are Vercel CDN HIT.

## 4. Browser Asset Inventory

The in-app browser `pageAssets` inventory was used as a browser-level check. The Performance resource entries were unavailable in this browser runtime, so transfer size is based on file size and HTTP headers rather than `performance.getEntriesByType("resource")`.

Observed resource counts after loading each page and waiting about 3 seconds:

| page | total observed assets | images | videos | scripts | fonts | stylesheets | other |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 26 | 8 | 5 | 2 | 1 | 1 | 9 |
| `/eye-intro.html?fromPreview=1` | 8 | 4 | 0 | 3 | 1 | 0 | 0 |
| `/works.html?skipIntro=1` | 15 | 11 | 0 | 3 | 1 | 0 | 0 |
| `/project.html?project=ip-001` | 23 | 5 | 4 | 9 | 2 | 3 | 0 |
| `/project.html?project=ip-0001` | 23 | 5 | 4 | 9 | 2 | 3 | 0 |

Important browser observations:

- `/` observes the warmup route documents, six selected covers, two IP long boards, and five selected work videos.
- `/works.html?skipIntro=1` observes the selected works covers but not card videos during the initial 3-second idle window.
- `/project.html?project=ip-001` observes project-level shared scripts/styles and current-project hero media.
- Lazy images in `project.html` generally lack explicit `width`/`height` attributes in DOM observation. P0/P1 changes should add dimensions or stable aspect ratio wrappers to avoid CLS.

## 5. Warmup Queue

`index.html` warmup queue:

- Core phase: 18 resources
- Detail phase: 9 resources
- Motion phase: 5 resources
- Total: 32 resources
- Queue order: core concurrency 3, then detail concurrency 2, then motion concurrency 1

Core phase includes:

- 9 route documents
- `styles.css`
- `app.js`
- `assets/fonts/SmileySans-Oblique-2.ttf`
- 6 selected case covers

Detail phase includes:

- `assets/projects/summer-gala-2026/01.png`
- `assets/projects/the-symphony-of-vines/cny-map-preview.webp`
- `assets/projects/time-arena/1.png`
- `assets/projects/benefit-system/Frame 2090053523.png`
- `assets/projects/ip-001/detail-01.png`
- `assets/projects/ip-0001/detail-01.png`
- `assets/ip-mask-demo/bg-contour-field.svg`
- `assets/ip-mask-demo/ip-base.png`
- `assets/ip-mask-demo/ip-explorer.png`

Motion phase includes five selected work videos:

- `assets/projects/summer-gala-2026/hero.mp4`
- `assets/projects/the-symphony-of-vines/18f602113140cfe95ac518a4.mp4`
- `assets/projects/时间档争霸赛封面。.mp4`
- `assets/projects/ip-001/hero.mp4`
- `assets/projects/ip-0001/hero.mp4`

## 6. Candidate Heavy Assets

Top referenced heavy resources from local static scan:

| size | path | referenced in |
|---:|---|---|
| 7.81 MB | `assets/projects/ip-0001/detail-01.png` | `index.html`, `project.html` |
| 7.52 MB | `assets/projects/ip-000001/detail-01.png` | `project.html` |
| 7.50 MB | `assets/projects/ip-00001/detail-01.png` | `project.html` |
| 7.50 MB | `assets/projects/ip-001/detail-01.png` | `index.html`, `project.html` |
| 7.49 MB | `assets/projects/ip-10/detail-01.png` | `project.html` |
| 6.15 MB | `assets/audio/world-bgm-b.mp3` | `app.js` |
| 5.22 MB | `assets/audio/world-bgm-a.mp3` | `app.js` |
| 4.69 MB | `assets/ip-mask-demo/bg-map-b.png` | `ip-mask-demo.html` |
| 4.45 MB | `assets/projects/ip-01/hero.mp4` | `works.html`, `project.html` |
| 4.11 MB | `assets/projects/the-symphony-of-vines/18f602113140cfe95ac518a4.mp4` | `eye-intro.html`, `index.html`, `works.html`, `project.html` |
| 4.00 MB | `assets/marathon/projects-hero-marathon-bg-clean.png` | `projects.html` |
| 3.97 MB | `assets/projects/ip-tutorial/detail-03.png` | `project.html` |
| 3.95 MB | `assets/about/here背景.png` | `about.html` |

Large files not found in scanned root `html/css/js` should not be optimized first:

- `assets/projects/the-symphony-of-vines/新素材/ip手办卡片 1.png` - 5.17 MB
- `assets/projects/the-symphony-of-vines/预览地图.png` - 5.10 MB
- `assets/projects/the-symphony-of-vines/新素材/新2.png` - 4.66 MB
- `assets/projects/the-symphony-of-vines/海报展示.png` - 4.29 MB
- `assets/projects/the-symphony-of-vines/新素材/线上效果1.png` - 4.28 MB

## 7. Trial Asset Details

Recommended P0 trial assets remain:

| asset | local size | production content-length | dimensions | referenced in |
|---|---:|---:|---|---|
| `assets/projects/ip-001/detail-01.png` | 7.50 MB | 7,865,309 B | 1554 x 6478 | `index.html`, `project.html` |
| `assets/projects/ip-0001/detail-01.png` | 7.81 MB | 8,185,061 B | 1080 x 7016 | `index.html`, `project.html` |

Other IP long boards:

| asset | dimensions |
|---|---|
| `assets/projects/ip-10/detail-01.png` | 1433 x 7421 |
| `assets/projects/ip-00001/detail-01.png` | 1354 x 5411 |
| `assets/projects/ip-000001/detail-01.png` | 1483 x 7335 |

Key production headers:

| asset | content-length | cache | CDN |
|---|---:|---|---|
| `ip-001/detail-01.png` | 7,865,309 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |
| `ip-0001/detail-01.png` | 8,185,061 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |
| `ip-001/cover.png` | 2,300,007 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |
| `ip-0001/cover.png` | 2,673,859 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |
| `ip-001/hero.mp4` | 2,223,140 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |
| `ip-0001/hero.mp4` | 3,767,098 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |
| `SmileySans-Oblique-2.ttf` | 2,098,640 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |
| `SmileySans-Oblique-2.woff2` | 942,540 B | `max-age=2592000, stale-while-revalidate=86400` | HIT |

## 8. Risk Markers

Static scan found no occurrences of previously reverted project-page perf pass markers:

- `data-case-video`
- `scheduleAdjacentProjectPrefetch`
- `getProjectPrefetchAssets`
- `addProjectPrefetch`

This means P0 must avoid reintroducing that old project-page perf pass or adjacent prefetch behavior.

## 9. P0 Recommendation

Proceed with a very small P0 trial only after review:

1. Convert only:
   - `assets/projects/ip-001/detail-01.png`
   - `assets/projects/ip-0001/detail-01.png`
2. Generate WebP as the required output. AVIF can be generated for comparison only.
3. First trial should target direct WebP references in:
   - `index.html` warmup detail entries
   - `project.html` IP project data entries
4. Add stable dimensions or aspect-ratio wrappers for these two lazy long-board images before relying on lazy loading.
5. Exclude the two PNG deployment copies only after the WebP references are verified in Vercel Preview.
6. Do not modify source workspace PNG masters under `/Users/flickerchen/Documents/网站/hi`.

Stop conditions:

- Any 404 in preview for either trial project.
- Any visible clarity regression in the two long boards.
- Any black-screen or project-page stall regression.
- Any reappearance of the old adjacent/project-page perf pass markers.

