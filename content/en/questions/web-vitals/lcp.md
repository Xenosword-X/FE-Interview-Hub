---
slug: lcp
title: What is LCP? How do you optimise it to meet Core Web Vitals standards?
category: web-vitals
tags: [web-vitals, performance, seo, lcp]
difficulty: advanced
---

## What is LCP?

**Largest Contentful Paint** measures when the largest content element in the viewport finishes rendering. Google Core Web Vitals targets:

| Score | LCP time |
|---|---|
| Good | ≤ 2.5s |
| Needs improvement | 2.5s – 4.0s |
| Poor | > 4.0s |

## LCP Trigger Elements

- `<img>` images
- `<video>` poster images
- Block elements with background images
- Large text blocks

## Optimisation Strategies

### 1. Preload critical resources

```html
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
```

### 2. Use WebP / AVIF formats

```html
<picture>
  <source type="image/avif" srcset="/hero.avif">
  <source type="image/webp" srcset="/hero.webp">
  <img src="/hero.jpg" alt="Hero" width="1200" height="600">
</picture>
```

### 3. Eliminate render-blocking resources

- CSS: Inline critical CSS, defer non-critical CSS with `media="print"`
- Fonts: Use `font-display: swap`
