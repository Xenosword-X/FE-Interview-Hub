---
slug: generics
title: TypeScript Generics（泛型）是什麼？請舉例說明用途
category: typescript
tags: [typescript, generics, types]
difficulty: intermediate
---

## 什麼是 Generics？

Generics 讓函式、介面、類別能接受**類型參數**，使程式碼在保持類型安全的同時具備複用性。

## 基本範例

```ts
// 不用 generics：只能處理 number
function identity(arg: number): number {
  return arg
}

// 用 generics：可處理任何類型
function identity<T>(arg: T): T {
  return arg
}

identity<string>('hello') // 類型：string
identity<number>(42)      // 類型：number
```

## 實用場景：API 回應包裝

```ts
interface ApiResponse<T> {
  data: T
  error: string | null
  status: number
}

// 使用時明確指定資料類型
type UserResponse = ApiResponse<{ id: number; name: string }>
```
