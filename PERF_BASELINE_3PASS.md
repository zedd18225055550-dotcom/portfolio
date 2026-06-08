# PERF_BASELINE_3PASS

Date: 2026-06-08
Deploy: https://portfolio-deploy-kappa-three.vercel.app
Code commit: be1dd80 perf(3pass): poster-first hero media on secondary pages

## Curl Baseline

| Path | Status | TTFB | Total | HTML Size |
| --- | ---: | ---: | ---: | ---: |
| / | 200 | 1.099926s | 1.200085s | 115557 |
| /home.html | 200 | 1.085620s | 1.178299s | 60332 |
| /projects.html | 200 | 1.017762s | 1.199643s | 115742 |
| /project.html?project=the-symphony-of-vines | 200 | 1.008271s | 1.270019s | 287748 |
| /works.html | 200 | 0.651467s | 0.744329s | 114315 |
| /about.html | 200 | 0.820455s | 1.006987s | 129702 |
| /contact.html | 200 | 0.871275s | 0.961919s | 58981 |

## Browser Resource Timing

Measured at DOMContentLoaded + 1.2s in Chromium, 1440x900 viewport.

| Page | Total Transfer | MP4 Resource Entries | Video preload | currentSrc | source Count |
| --- | ---: | ---: | --- | --- | ---: |
| /projects.html | 4753135 | 0 | none | empty | 0 |
| /about.html | 705950 | 0 | none | empty | 0 |
| /contact.html | 582022 | 0 | none | empty | 0 |

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
- Static reference scan found only two template-string false positives: `${mediaAsset}` and `${videoSrc}`.
