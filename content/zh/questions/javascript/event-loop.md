---
slug: event-loop
title: 什麼是 Event Loop？請說明 Call Stack 與 Task Queue 的關係
category: javascript
tags: [javascript, async, event-loop]
difficulty: advanced
---

## 核心概念

JavaScript 是**單執行緒（Single-threaded）**語言，同一時間只能執行一件事。**Event Loop** 是讓 JS 能處理非同步操作的核心機制。

::callout
**重點：** Event Loop 本身不在 JS 引擎中，而是由執行環境（瀏覽器 / Node.js）提供。
::

## 組成部分

### 1. Call Stack（呼叫堆疊）

同步程式碼的執行區域，採用 LIFO 結構。函式被呼叫時推入（push），執行完畢後彈出（pop）。

### 2. Web APIs

處理 `setTimeout`、`fetch`、DOM 事件等非同步操作的瀏覽器 API。

### 3. Task Queue（巨集任務佇列）

非同步回呼完成後排隊的地方，等待 Call Stack 清空後執行。

## 執行順序範例

```js
console.log('1')

setTimeout(() => {
  console.log('3')
}, 0)

Promise.resolve().then(() => {
  console.log('2')
})

// 輸出：1 → 2 → 3
```

## Microtask vs Macrotask

| 類型 | 範例 | 優先順序 |
|---|---|---|
| Microtask | `Promise.then`、`queueMicrotask` | 高（Call Stack 清空後立即執行） |
| Macrotask | `setTimeout`、`setInterval` | 低（Microtask 清空後執行） |
