---
slug: event-loop
title: What is the Event Loop? Explain the relationship between Call Stack and Task Queue
category: javascript
tags: [javascript, async, event-loop]
difficulty: advanced
---

## Core Concept

JavaScript is a **single-threaded** language. The **Event Loop** is the mechanism that allows JS to handle asynchronous operations.

::callout
**Key point:** The Event Loop is provided by the runtime environment (browser / Node.js), not the JS engine itself.
::

## Components

### 1. Call Stack

The execution area for synchronous code (LIFO). Functions are pushed on call and popped on completion.

### 2. Web APIs

Browser-provided APIs handling `setTimeout`, `fetch`, DOM events etc.

### 3. Task Queue (Macrotask Queue)

Where async callbacks queue after completing, waiting for the Call Stack to empty.

## Execution Order Example

```js
console.log('1')

setTimeout(() => {
  console.log('3')
}, 0)

Promise.resolve().then(() => {
  console.log('2')
})

// Output: 1 → 2 → 3
```

## Microtask vs Macrotask

| Type | Examples | Priority |
|---|---|---|
| Microtask | `Promise.then`, `queueMicrotask` | High (runs immediately after Call Stack empties) |
| Macrotask | `setTimeout`, `setInterval` | Low (runs after all Microtasks) |
