---
slug: closure
title: Explain the concept of Closure and its practical use cases
category: javascript
tags: [javascript, closure, scope]
difficulty: basic
---

## What is a Closure?

A closure is a function that **remembers and can access its lexical scope** even when executed outside that scope.

## Basic Example

```js
function makeCounter() {
  let count = 0
  return function () {
    count++
    return count
  }
}

const counter = makeCounter()
counter() // 1
counter() // 2
counter() // 3
```

The inner function "remembers" the `count` variable from its outer scope, even after `makeCounter` has finished executing.

## Common Use Cases

1. **Data privacy**: Simulating private variables
2. **Function factories**: Creating functions with specific behaviour based on parameters
3. **Debounce / throttle**: Using closures to store timer IDs
