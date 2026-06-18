# Video Optimization Trial 2026-06-18

## Scope

This trial only changes the isolated `codex/asset-perf-v21` worktree. Production `main` is untouched.

Source masters were read from `/Users/flickerchen/Documents/网站/hi/` and preserved unchanged. Generated web derivatives were written into the isolated deploy worktree.

## Trial Targets

| Project | Current deploy asset | Source master | Current size | Source size | Selected web export |
|---|---:|---:|---:|---:|---:|
| `ip-001` | `assets/projects/ip-001/hero.mp4` | `/Users/flickerchen/Documents/网站/hi/assets/projects/ip-001/hero.mp4` | 2,223,140 B | 23,568,934 B | 8,890,839 B |
| `ip-0001` | `assets/projects/ip-0001/hero.mp4` | `/Users/flickerchen/Documents/网站/hi/assets/projects/ip-0001/hero.mp4` | 3,767,098 B | 42,245,636 B | 16,284,367 B |

## Selected Export Settings

```bash
ffmpeg -i SOURCE \
  -vf "scale='min(1920,iw)':-2" \
  -c:v libx264 -preset slow -crf 22 \
  -pix_fmt yuv420p -movflags +faststart \
  -an OUTPUT
```

Notes:

- Kept H.264 MP4 for broad browser compatibility.
- Kept original frame rate for the selected files.
- Removed audio with `-an`; these are muted loop/background motion assets.
- Used `+faststart` so playback metadata is at the beginning of the MP4.

## Candidate Results

| Project | Candidate | Resolution | Frame rate | Size | Notes |
|---|---|---:|---:|---:|---|
| `ip-001` | current deploy | 1280x716 | 24fps | 2.1 MB | Small but visibly soft. |
| `ip-001` | 1280 CRF18 | 1280x716 | 24fps | 7.1 MB | Better compression quality, but same resolution. |
| `ip-001` | 1920 CRF22 | 1920x1074 | 24fps | 8.5 MB | Selected. Clearer and still much smaller than source. |
| `ip-001` | 1920 CRF20 | 1920x1074 | 24fps | 10.9 MB | Slightly safer quality, larger. |
| `ip-0001` | current deploy | 1280x716 | 60fps | 3.6 MB | Small but very low bitrate. |
| `ip-0001` | 1280 CRF18 | 1280x716 | 60fps | 13.0 MB | Better bitrate, but same resolution. |
| `ip-0001` | 1920 CRF22 | 1920x1074 | 60fps | 15.5 MB | Selected. Keeps motion smoothness. |
| `ip-0001` | 1920 CRF20 | 1920x1074 | 60fps | 19.9 MB | Better quality, too large for first pass. |
| `ip-0001` | 1920 30fps CRF22 | 1920x1074 | 30fps | 14.2 MB | Smaller, but changes motion feel. Not selected. |

## Objective Comparison

SSIM was measured against the 4K source normalized to the compared output size.

| Project | Current deploy SSIM | Selected export SSIM | Read |
|---|---:|---:|---|
| `ip-001` | 0.970906 | 0.990666 | Selected export is much closer to source. |
| `ip-0001` | 0.968860 | 0.990127 | Selected export is much closer to source. |

Visual crop sheets generated during trial:

- `/tmp/chennn-video-trial/crops/ip-001-crop-sheet.png`
- `/tmp/chennn-video-trial/crops/ip-0001-crop-sheet.png`

Each crop sheet is ordered: source master / current deploy / selected web export.

## Deployment Impact

This is a clarity-first trial, not a pure loading-speed win.

Compared with the current deploy package:

- `ip-001/hero.mp4`: 2.2 MB -> 8.9 MB
- `ip-0001/hero.mp4`: 3.8 MB -> 16.3 MB
- Combined delta: about +19.2 MB versus current production assets.

Compared with the 4K source masters:

- `ip-001/hero.mp4`: 23.6 MB -> 8.9 MB
- `ip-0001/hero.mp4`: 42.2 MB -> 16.3 MB
- Combined reduction: about -40.6 MB versus source masters.

Conclusion: this method is effective for recovering perceived sharpness from the original masters while still keeping assets far lighter than raw 4K. It does not make the already ultra-compressed current production videos smaller.

## Recommendation

Do not deploy this directly to production without a Vercel Preview/browser check.

Recommended next step:

1. Preview deploy this branch.
2. Use `?debugPerf=reset` to measure whether the preview entry still finishes warmup acceptably.
3. Visually compare `ip-001` and `ip-0001` project pages on desktop and mobile.
4. If the preview entry still gives enough warmup time, ship these two as a quality upgrade.
5. If warmup becomes too heavy, keep the current MP4 as default and add optional higher-quality video loading only after the visitor opens the relevant project page.
