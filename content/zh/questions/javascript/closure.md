---
slug: closure
title: 解釋 Closure（閉包）的概念與實際應用場景
category: javascript
tags: [javascript, closure, scope]
difficulty: basic
---

## 什麼是 Closure？

Closure 是指**函式能記住並存取其詞法作用域（Lexical Scope）的能力**，即使該函式在其原始作用域之外執行。

## 基本範例

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

內部函式「記住」了外部函式的 `count` 變數，即使 `makeCounter` 已執行完畢。

## 常見應用場景

1. **資料私有化**：模擬私有變數
2. **函式工廠**：根據參數建立特定行為的函式
3. **防抖 / 節流**：利用閉包保存計時器 ID
