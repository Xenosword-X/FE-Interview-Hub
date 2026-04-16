---
slug: composition-api
title: Vue 3 的 Composition API 相較 Options API 有哪些優勢？
category: vue
tags: [vue, composition-api, vue3]
difficulty: intermediate
---

## Composition API 核心優勢

### 1. 邏輯複用更容易

Options API 依賴 Mixin，容易造成命名衝突與來源不明。Composition API 透過 **Composable** 函式封裝邏輯，清晰且可測試：

```ts
// composables/useCounter.ts
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
```

### 2. TypeScript 支援更完整

`setup()` 中的變數類型可直接推斷，不需要複雜的類型聲明。

### 3. 相關邏輯集中

Options API 把相同功能的程式碼分散在 `data`、`methods`、`computed`、`watch` 中。Composition API 讓相關邏輯集中在一起，大型元件更易維護。

## 什麼時候用 Options API？

- 小型元件、簡單頁面
- 團隊熟悉度考量
- 兩者可在同一專案混用
