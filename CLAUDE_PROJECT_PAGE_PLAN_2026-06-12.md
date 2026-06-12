# Claude 方案回应 — project.html 加载体验(2026-06-12)

回应 `CLAUDE_LOADING_ISSUE_BRIEF_2026-06-12.md`。**本文档只给方案,未改任何代码。** 所有结论基于对 `/Users/flickerchen/portfolio-deploy/project.html` 的代码核查 + 生产环境(`?project=ip-001`)的真实网络/DOM 实测。

---

## 一、实测结果:哪些疑点成立、哪些不成立

| Codex 疑点 | 实测结论 |
|---|---|
| 1. 单页模板太重,解析/初始化开销大 | **基本不成立**。HTML 压缩后传输 64KB,DOM 仅 1433 节点,67 张 img 只实际加载 1 张。解析不是瓶颈。 |
| 2. 隐藏视频触发 metadata 拉取 | **部分成立,且比预想更糟**:隐藏视频的 **poster 海报被完整下载**。实测打开 ip-001 时下载了 `the-symphony-of-vines/Group 2090057975.png`(0.97MB)+ `summer-gala-2026/fengmian.png`(2.6MB)——**3.6MB 全是别的项目的素材**,比当前项目 cover(2.3MB)还多。另外 IP 模板硬编码 `<source src="./assets/projects/ip-01/hero.mp4">` 默认值,浏览 ip-001 时浏览器也可能先碰 ip-01 的视频。 |
| 3. ?project= 切换要全量重跑 | **成立但主因不是解析**(64KB HTML 很快),主因是:每次切换都重新走一遍"下载 3.6MB 异项目海报 + 当前 cover + 字体/CSS/JS 重新验证(线上无缓存头,全是 max-age=0)"。 |
| 4. 长图解码 jank | **成立**。7.5MB / 1554×6478 的 detail-01.png 进视口时一次性解码;Blob 上换成 12.3MB / 2010×8379 会更糟(下载和解码都翻倍)。 |
| 5. transition/is-ready 拖慢 | **次要**。is-ready 只有 180ms 定时器。但发现一个真 bug:**当前项目的 hero 视频在页面加载 10 秒后 readyState 仍为 0**(networkState=LOADING 但一帧未解出),海报永远挂着——视频激活链路(src 赋值 → load() → play())有断点,需要修。 |

**核心判断(同意你的方向):URL/CDN 是分发层,不是核心解法。核心是"隐藏模板的真实 src 资产"和"长图切片",其次才是缓存。**

---

## 二、方案(按风险从低到高、收益从大到小排序)

### 方案 1【零结构风险|立刻见效】隐藏模板资产惰性化

不动 DOM 结构、不动布局,只把"非当前案例"的资产引用改成惰性:

- 所有隐藏案例的 `<video>`:`<source src="...">` → `<source data-src="...">`,`poster="..."` → `data-poster="..."`。video 的下载**不受 display:none/hidden 约束**,只要有真实 src/poster 就会拉,所以必须从属性层面摘掉。
- IP 模板里硬编码的 `ip-01/hero.mp4` 默认 src 同样改 `data-src`,由渲染器统一赋值。
- 案例激活时(`renderProject()` 确定当前 case 后),JS 只给**当前案例**的 video 设 `poster`、`src` 并调 `load()`。

预期:每个项目页首屏少 ~3.6MB 异项目海报 + 消灭所有异项目视频的 metadata 拉取。**这是单项收益最大的改动,且不碰任何布局/动效。**

验收:DevTools Network 打开 `?project=ip-001`,不该出现任何 `the-symphony-of-vines/`、`summer-gala-2026/`、`ip-01/` 的请求。

### 方案 2【零结构风险】修当前 hero 视频的激活时序(顺带修实测 bug)

现状 bug:hero 视频 10 秒不出帧。统一激活链路:

1. 渲染器确定当前项目后:设 `source.src` → `video.load()`(实测怀疑现在缺这步或被覆盖)。
2. `IntersectionObserver`(threshold 0.25)进视口 + `requestIdleCallback` 页面安顿后才 `play()`;`navigator.connection.saveData` 或弱网时改为首次交互触发。
3. 海报常驻底层,视频 `canplay` 后淡入(home 已是这个模式,project 对齐即可)。

验收:正常网络下 hero 视频在加载后 1–3 秒内出帧;弱网下海报稳定显示、无突发下载。

### 方案 3【素材无损处理】长图切片(回答问题 2 和 5)

长板图不要整张挂。**切片是无损裁剪,不是压缩**——画质 0 损失:

```bash
# 每 2160px 高切一段(ImageMagick),输出 N 张连续切片
magick detail-01.png -crop 1554x2160 +repage slice-%02d.png
```

页面上 N 张切片按顺序排列(`display:block`,无间隙,视觉与整图完全一致),每张独立 `loading="lazy"` + `decoding="async"` + 明确 `width/height`(防 CLS)。浏览器只下载/解码视口附近的 1–2 片,滚动 jank 直接消失。

Blob 的正确用法(问题 5):**直接把 12MB 整图 URL 换进 src 不是好模式**;应当"切片后上 Blob"——每片 1–2MB,配它自带的 `max-age=2592000`,二次访问全缓存。Blob 的价值定位:① 大素材移出部署包/git;② 现成的长缓存头。小图(<2MB)留本地即可,没必要迁移。

注意:那张 2010×8379 的 Blob 版长图比本地版清晰(2010 vs 1554 宽),如果采用切片方案,**可以直接用这版更清晰的源来切**——清晰度提升 + 加载变好,两头都赚。

### 方案 4【配置层|15 分钟】主站缓存头(配合切换场景)

项目间切换是整页 reload,目前线上所有资源 `max-age=0, must-revalidate`,CSS/JS/字体/已看过的海报每次切换都要重新验证。按 2026-06-11 文档(`hi/CLAUDE_PERF_RESPONSE_2026-06-11.md` 方案 A)加 `vercel.json`:`/assets/*` 30 天 + swr。

效果:从 ip-001 切到 ip-0001 时,字体、CSS、JS、共用海报全部 0 请求,只拉新项目自己的 cover——"切换黑屏感"大幅缩短。这一条和方案 1 是互补的:方案 1 减少要下载的东西,方案 4 让下载过的不再下载。

### 方案 5【低成本加分项】Next Project 预取

详情页"Next ↗"的链路是固定的(`getNextProjectKey`)。当前页安顿后空闲时,`<link rel="prefetch">` 下一个项目的 cover(以及 project.html 本身)。配合方案 4,点 Next 几乎秒开。弱网/saveData 跳过。

### 方案 6【中风险|先不做】案例模板 template 化(回答问题 1)

把每个 case 区块包进 `<template>`,激活时才 stamp 进 DOM——这是"只挂载当前项目"的彻底解法。但实测 DOM 只有 1433 节点、解析 64KB,**结构性收益有限,风险却不小**(所有 `querySelector` 初始化、GSAP/reveal 绑定时序都要重排)。建议:方案 1–5 落地后再实测,若项目切换仍有可感知卡顿才考虑。大概率不需要。

### 方案 7【低优先】content-visibility(回答问题 3)

可用但收益排最后(DOM 小,渲染负担本来不大)。安全边界:只加在**没有 GSAP pin/ScrollTrigger 测量、没有 sticky**的纯内容 section(IP 详情长板区切片后是理想对象);`contain-intrinsic-size: auto 900px` 防滚动条跳动。每次只开一个 section 验证 reveal 是否正常。hero、横向滚动区、curtain 转场区一律不加。

---

## 三、五个问题的直接回答

1. **要不要重构成"只挂载当前案例"?** 不急。实测解析/DOM 不是瓶颈,真正的浪费是隐藏模板里的真实 src(海报 3.6MB)。先做方案 1(资产惰性化,零结构风险),template 化(方案 6)留作最后手段,大概率不需要。
2. **长板图要不要 placeholder→点击加载?** 不需要走到"点击加载"那么重。无损切片(方案 3)+ 原生 lazy 就能让滚动顺畅,体验上仍是"一张完整长图"。可以用 Blob 上那张更清晰的 2010px 源来切,清晰度还能回升。
3. **content-visibility 有没有用?** 有但有限,放最后(方案 7),且只加在无 pin/sticky 的纯内容区,逐区验证。
4. **video metadata 还是不是因素?** 是,而且不止 metadata——隐藏视频的 **poster 整张下载**(实测 3.6MB)。src/poster 全部 data- 化、由渲染器只激活当前案例(方案 1);当前 hero 视频另有一个"10 秒不出帧"的激活 bug,按方案 2 修。
5. **Blob 大 PNG 直接换 src 是不是好模式?** 不是。Blob 当"长缓存 + 部署包瘦身"用,大长图必须先切片再上 Blob;小图留本地。主站本地资源加上 vercel.json 缓存头后,两边缓存能力就一致了。

---

## 四、建议落地顺序与验收

| 顺序 | 方案 | 风险 | 预期 |
|---|---|---|---|
| 1 | 隐藏模板资产惰性化 | 零(只改属性 + 渲染器几行) | 每页省 ~3.6MB,异项目请求归零 |
| 2 | hero 视频激活链路修复 | 零 | 视频 1–3 秒出帧,修掉 10 秒不出帧 bug |
| 3 | vercel.json 缓存头 | 零 | 项目切换时旧资源 0 请求 |
| 4 | 长图无损切片(可顺带换更清晰的 2010px 源) | 低(素材处理,布局不变) | 滚动 jank 消失,清晰度回升 |
| 5 | Next 预取 | 低 | Next 秒开 |
| 6 | content-visibility 试点 | 中(需逐区 QA) | 长页渲染再降一档 |
| — | template 化重构 | 中高 | 仅在 1–5 后仍卡才做 |

统一测量方法:每步前后,DevTools Network(Disable cache)打开 `?project=ip-001`,记录①总传输量②请求里是否有非当前项目资产③hero 视频首帧时间;再用正常缓存从 ip-001 → Next 切换,记录请求数和白屏时长。
