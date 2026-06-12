# CHENNN Portfolio Loading Issue Brief for Claude

Date: 2026-06-12

## Goal

The final goal is to improve perceived loading speed and reduce the "black screen / spinner / long wait" feeling when browsing the project detail pages, especially when switching from one IP project to the next.

The constraint is important: do not solve this mainly by making images or videos much blurrier. The site is a visual portfolio, so clarity matters. We are looking for architecture/loading-order fixes first.

## Current Live / Preview URLs

- Production main site:
  - `https://portfolio-deploy-kappa-three.vercel.app`
  - Project detail example: `https://portfolio-deploy-kappa-three.vercel.app/project.html?project=ip-001`
- Vercel Preview with one Blob image test:
  - `https://portfolio-deploy-m46aaokce-tongs-projects-d87ea0c4.vercel.app/project.html?project=ip-001&blob-preview=1`
  - Note: this preview may require Vercel login because Preview Protection returns 401 for unauthenticated curl/browser sessions.

## Local File Paths

Primary deployed repo:

- `/Users/flickerchen/portfolio-deploy/project.html`
- `/Users/flickerchen/portfolio-deploy/.vercelignore`
- `/Users/flickerchen/portfolio-deploy/assets/projects/`

Source workspace, do not assume it is identical to deploy repo:

- `/Users/flickerchen/Documents/网站/hi/project.html`
- `/Users/flickerchen/Documents/网站/hi/PROGRESS.md`
- `/Users/flickerchen/Documents/网站/hi/CODEX_WORKTREE_TRIAGE_2026-06-04.md`

Current local preview test changed only the deploy repo:

- `/Users/flickerchen/portfolio-deploy/project.html`
- `/Users/flickerchen/portfolio-deploy/.vercelignore`

## Current Test Change

Only `ip-001` image references were changed to Vercel Blob URLs for testing:

```js
"ip-001": {
  title: "魔法面包工坊",
  media: "url('https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/001.png')",
  ipCase: {
    hero: "./assets/projects/ip-001/hero.mp4",
    poster: "https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/001.png",
    cover: "https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/001.png",
    details: ["https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/002.png"],
  }
}
```

Video was intentionally not moved to Blob in this test. The uploaded MOV is much larger than the current local MP4.

## Blob Assets Verified

These URLs are public and return cache headers:

- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/001.png`
  - `content-length: 2300007`
  - `content-type: image/png`
  - size: `2010 x 1215`
  - cache: `public, max-age=2592000`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/002.png`
  - `content-length: 12302403`
  - `content-type: image/png`
  - size: `2010 x 8379`
  - cache: `public, max-age=2592000`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/here%E8%A7%86%E9%A2%91.MOV`
  - `content-type: video/quicktime`
  - about `27.9 MB`
  - not connected to the page yet

Another uploaded folder also exists:

- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/ip-001/01.png`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/ip-001/02.png`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/ip-001/03.png`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/ip-001/04.png`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/ip-001/05.png`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/ip-001/here%E8%A7%86%E9%A2%91.mp4`
- `https://jno0ryddhbwn33vf.public.blob.vercel-storage.com/assets/projects/ip-001/%E6%B5%87%E8%8A%B1.mp4`

## Evidence So Far

Blob is not automatically a speed fix.

- The `ip-001` cover changed from local `2.2 MB` to Blob `2.3 MB`, so the first view is not expected to become much faster.
- The `ip-001` detail long image changed from local `7.5 MB / 1554 x 6478` to Blob `12.3 MB / 2010 x 8379`, so clarity improves but first-load payload increases.
- Blob helps with CDN caching and with separating assets from the website deploy package, but it does not fix heavy DOM initialization, video metadata loading, lazy-image decode jank, or transition logic by itself.

The project page is a single large HTML file with many case templates in one document.

- `project.html` currently contains about `77` `<img>`, `<video>`, or `<source>` tags.
- The IP project view is rendered by mutating one reusable IP template rather than loading a smaller per-project page.
- Non-current case templates for CNY, Benefit, Summer Gala, Time Arena, etc. are still present in the same document.
- Several video tags for other case sections exist in the DOM with `preload="metadata"` and `autoplay muted loop`.

Relevant code positions in `/Users/flickerchen/portfolio-deploy/project.html`:

- IP project data:
  - around lines `7636-7810`
- IP renderer:
  - around lines `7937-8045`
- Generic `renderProject()` and next-project link update:
  - around lines `8129-8182`
- Reveal / IntersectionObserver logic:
  - around lines `8802-8850`

Large local assets currently in deploy repo:

```text
~7.8 MB  assets/projects/ip-0001/detail-01.png
~7.5 MB  assets/projects/ip-001/detail-01.png
~7.5 MB  assets/projects/ip-00001/detail-01.png
~7.5 MB  assets/projects/ip-000001/detail-01.png
~7.5 MB  assets/projects/ip-10/detail-01.png
~4.5 MB  assets/projects/ip-01/hero.mp4
~3.6 MB  assets/projects/ip-0001/hero.mp4
~3.3 MB  assets/projects/ip-0001/insert-01.mp4
```

## Suspected Root Causes

Please verify rather than assume.

1. The single `project.html` carries multiple full case-study templates and many media nodes. Even if lazy loading prevents all images from downloading immediately, parsing and initialization are still broad.

2. Hidden/non-current videos may still trigger metadata fetch or decoding work because video elements exist in the DOM with sources and `preload="metadata"`.

3. IP navigation uses the same page URL with `?project=...`. The page still has to parse the whole large HTML and run all initialization scripts again on each project switch.

4. Long PNG boards cause scroll-time decode jank. Moving them to Blob helps caching, but a 12 MB `2010 x 8379` PNG still must download and decode when it enters the viewport.

5. The perceived stall may be worsened by route transition / body ready state / reveal logic:
   - project-to-project links now have `data-no-transition`, but there may still be blocking initialization before useful content appears.
   - `body.is-ready` is set after timers/IntersectionObserver setup.

## What We Need From Claude

Please inspect `/Users/flickerchen/portfolio-deploy/project.html` and recommend the best architecture-level fixes for perceived speed without making the portfolio assets visibly worse.

Prefer solutions that:

1. Render or activate only the current project's case DOM/media.
2. Prevent non-current videos from setting `src`, `load()`, or `autoplay` until needed.
3. Keep hero poster immediate, then defer hero video until page is idle and user/network conditions are good.
4. Avoid heavy adjacent prefetch that competes with current navigation.
5. Reduce scroll-time decode jank for long boards without lowering visual quality too much.
6. Preserve the current visual design and case layout.

Specific questions:

1. Should `project.html` be refactored so each case type is inserted from data/templates only when active, instead of keeping many inactive DOM sections in the HTML?
2. Should the IP project long boards use smaller placeholder/poster first, then full image on click or after idle?
3. Can `content-visibility`, `contain-intrinsic-size`, or section-level lazy hydration help here without breaking GSAP/reveal/sticky behavior?
4. Is video metadata loading still a likely contributor, and where should `src` assignment be delayed?
5. For Vercel Blob assets, is there a better pattern than directly swapping `src` to big PNG URLs?

## Current Recommended Direction From Codex

Do not continue compressing images first.

The next high-impact direction is likely:

1. Make current project render first with only its hero poster, cover, and above-the-fold text.
2. Assign hero video `src` only after first paint + idle, not during initial render.
3. Build detail image DOM only when its section is near viewport.
4. Keep other project case templates inert or not mounted.
5. Use Blob/CDN mainly for caching and large long boards, not as the only optimization.

## Current Git State Warning

The deploy repo currently has local test changes:

```text
M .vercelignore
M project.html
```

These changes are only for preview testing and have not been pushed to production.

