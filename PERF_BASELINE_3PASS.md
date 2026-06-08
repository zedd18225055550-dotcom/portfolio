# PERF_BASELINE_3PASS

Date: 2026-06-08
Deploy: https://portfolio-deploy-kappa-three.vercel.app
Code commit: e12f44a perf(3pass): defer projects card assets until scroll

## Curl Baseline

| Path | Status | TTFB | Total | HTML Size |
| --- | ---: | ---: | ---: | ---: |
| / | 200 | 1.064442s | 1.158114s | 115557 |
| /home.html | 200 | 0.831277s | 0.918253s | 60332 |
| /projects.html | 200 | 0.906569s | 1.086797s | 116944 |
| /project.html?project=the-symphony-of-vines | 200 | 0.966166s | 1.225641s | 287748 |
| /works.html | 200 | 1.062312s | 1.255467s | 114315 |
| /about.html | 200 | 0.608278s | 0.791822s | 129702 |
| /contact.html | 200 | 0.706003s | 0.793528s | 58981 |

## Browser Resource Timing

Measured at DOMContentLoaded + 1.2s in Chromium, 1440x900 viewport.

| Page | Total Transfer | MP4 Transfer | Project Card Image Transfer | Video preload | currentSrc | source Count |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| /projects.html | 3006266 | 0 | 0 | none | empty | 0 |
| /about.html | 705950 | 0 | 0 | none | empty | 0 |
| /contact.html | 582022 | 0 | 0 | none | empty | 0 |

## Asset Changes

| Asset | Before | After |
| --- | ---: | ---: |
| assets/marathon/projects-hero-marathon-video.mp4 | 15647000 | 3823444 |
| assets/about/about-hero-marathon-video.mp4 | 6335953 | 2316997 |
| assets/marathon/contact-hero-marathon-video.mp4 | 12076505 | 3086572 |
| assets/about/here背景.png | 10350218 | 684521 |
| assets/marathon/contact-hero-marathon-bg.png | 2286563 | 574831 |

## Notes

- `/projects.html`, `/about.html`, and `/contact.html` use poster-first lazy hero video.
- The three checked hero videos did not transfer during initial page load.
- `/projects.html` project-card images did not transfer during initial page load; after scroll, the three real card assets loaded normally.
- Static reference scan found only two template-string false positives: `${mediaAsset}` and `${videoSrc}`.
