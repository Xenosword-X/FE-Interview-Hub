---
slug: composition-api
title: What are the advantages of Vue 3 Composition API over Options API?
category: vue
tags: [vue, composition-api, vue3]
difficulty: intermediate
---

## Core Advantages of Composition API

### 1. Better Logic Reuse

Options API relies on Mixins, which cause naming conflicts and unclear origins. Composition API encapsulates logic in **Composable** functions — clear and testable:

```ts
// composables/useCounter.ts
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
```

### 2. Better TypeScript Support

Variables in `setup()` are directly inferred — no complex type declarations needed.

### 3. Co-located Logic

Options API scatters related code across `data`, `methods`, `computed`, and `watch`. Composition API keeps related logic together, making large components easier to maintain.

## When to Use Options API?

- Small components and simple pages
- Team familiarity considerations
- Both can be mixed in the same project
