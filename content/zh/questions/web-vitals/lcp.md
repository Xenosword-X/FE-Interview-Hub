---
slug: lcp
title: 什麼是 LCP？如何優化以達到 Core Web Vitals 標準？
category: web-vitals
tags: [web-vitals, performance, seo, lcp]
difficulty: advanced
---

## 什麼是 LCP？

**Largest Contentful Paint（最大內容繪製）** 測量頁面主要內容載入完成的時間。Google Core Web Vitals 標準：

| 分數 | LCP 時間 |
|---|---|
| 良好 | ≤ 2.5s |
| 需改善 | 2.5s – 4.0s |
| 差 | > 4.0s |

## LCP 的觸發元素

- `<img>` 圖片
- `<video>` 封面圖
- 含背景圖的區塊元素
- 大型文字區塊

## 優化策略

### 1. 預載關鍵資源

```html
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
```

### 2. 使用 WebP / AVIF 格式

```html
<picture>
  <source type="image/avif" srcset="/hero.avif">
  <source type="image/webp" srcset="/hero.webp">
  <img src="/hero.jpg" alt="Hero" width="1200" height="600">
</picture>
```

### 3. 避免 render-blocking 資源

- CSS：Critical CSS inline，非關鍵 CSS `media="print"`
- 字體：`font-display: swap`
