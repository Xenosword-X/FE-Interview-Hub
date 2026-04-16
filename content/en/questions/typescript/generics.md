---
slug: generics
title: What are TypeScript Generics? Give examples of their use
category: typescript
tags: [typescript, generics, types]
difficulty: intermediate
---

## What are Generics?

Generics allow functions, interfaces, and classes to accept **type parameters**, enabling code reuse while maintaining type safety.

## Basic Example

```ts
// Without generics: only handles numbers
function identity(arg: number): number {
  return arg
}

// With generics: handles any type
function identity<T>(arg: T): T {
  return arg
}

identity<string>('hello') // type: string
identity<number>(42)      // type: number
```

## Practical Use Case: API Response Wrapper

```ts
interface ApiResponse<T> {
  data: T
  error: string | null
  status: number
}

// Specify data type when using
type UserResponse = ApiResponse<{ id: number; name: string }>
```
