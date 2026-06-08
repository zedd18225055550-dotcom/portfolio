# PERF_BASELINE_2PASS · 2026-06-08 21:39

## HTTP curl 7 pages
=== / ===
status=200 ttfb=1.050350s total=1.163393s size=115557
=== /home.html ===
status=200 ttfb=0.855061s total=0.935871s size=60332
=== /projects.html ===
status=200 ttfb=0.960632s total=1.049504s size=114632
=== /project.html?project=the-symphony-of-vines ===
status=200 ttfb=0.653061s total=0.908314s size=287748
=== /works.html ===
status=200 ttfb=1.250243s total=1.339136s size=114315
=== /about.html ===
status=200 ttfb=0.637912s total=0.800160s size=128540
=== /contact.html ===
status=200 ttfb=0.559264s total=0.640994s size=57810

## Browser resource timing · home.html

```text
DOMContentLoaded: 1451ms
首屏 DCL 前总下载: 3.17MB
hero video transfer before first screen: 0 bytes
storyboard transfer before first screen: 0 bytes
first video preload: none
first video currentSrc before scroll: empty
wrapped.js loaded before first screen: false
parallax image src before first screen: empty
```

## Top 5 resources before DCL

```text
1658996  assets/marathon/index-hero-marathon-cny.png
1320566  assets/fonts/SmileySans-Oblique-2.ttf
260730   assets/chen-pet.webp?v=node-019
30113    assets/vendor/gsap.min.js
19077    assets/vendor/ScrollTrigger.min.js
```

## Lazy behavior after scroll

```text
hero video loads after scroll: yes
hero video transfer after scroll: 2386934 bytes
wrapped.js loads after scroll: yes
storyboard transfer after scroll sample: 1437848 bytes
failed requests: 0
```
