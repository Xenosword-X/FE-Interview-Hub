---
slug: box-model
title: 解釋 CSS Box Model，`box-sizing` 有什麼差異？
category: css
tags: [css, box-model, layout]
difficulty: basic
---

## CSS Box Model

每個 HTML 元素都是一個盒子，由四層組成（由內到外）：

1. **Content**：內容區域（文字、圖片）
2. **Padding**：內容與邊框的間距
3. **Border**：邊框
4. **Margin**：元素與外部的間距

## `box-sizing` 差異

| 值 | `width` 的計算範圍 | 常用情境 |
|---|---|---|
| `content-box`（預設） | 只含 Content | CSS 規格預設 |
| `border-box` | Content + Padding + Border | 現代開發首選 |

```css
/* 推薦：全局套用 border-box */
*, *::before, *::after {
  box-sizing: border-box;
}
```

使用 `border-box` 後，設定 `width: 200px` 就是元素實際佔用的寬度，不會因為 padding 而撐大。
