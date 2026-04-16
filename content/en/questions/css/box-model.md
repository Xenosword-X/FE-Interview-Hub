---
slug: box-model
title: Explain the CSS Box Model and the difference between box-sizing values
category: css
tags: [css, box-model, layout]
difficulty: basic
---

## CSS Box Model

Every HTML element is a box made of four layers (inside out):

1. **Content**: The actual content area (text, images)
2. **Padding**: Space between content and border
3. **Border**: The border around the padding
4. **Margin**: Space outside the border

## `box-sizing` Differences

| Value | `width` includes | Common use |
|---|---|---|
| `content-box` (default) | Content only | CSS spec default |
| `border-box` | Content + Padding + Border | Modern development preference |

```css
/* Recommended: apply border-box globally */
*, *::before, *::after {
  box-sizing: border-box;
}
```

With `border-box`, setting `width: 200px` means the element actually occupies 200px — padding doesn't expand it further.
