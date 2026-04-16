---
slug: prototype-chain
title: 什麼是 Prototype Chain（原型鏈）？JavaScript 繼承如何運作？
category: javascript
tags: [javascript, prototype, oop]
difficulty: intermediate
---

## 原型鏈概念

JavaScript 的每個物件都有一個隱藏屬性 `[[Prototype]]`，指向其原型物件。當存取一個屬性找不到時，JS 引擎會沿著原型鏈向上查找，直到 `null` 為止。

## 範例

```js
const arr = [1, 2, 3]

// arr 本身沒有 map 方法
// 但 arr.__proto__ === Array.prototype
// Array.prototype 有 map 方法
arr.map(x => x * 2) // [2, 4, 6]

// 原型鏈：arr → Array.prototype → Object.prototype → null
```

## ES6 Class 與原型鏈

`class` 語法是原型繼承的語法糖：

```js
class Animal {
  speak() { return 'sound' }
}

class Dog extends Animal {
  speak() { return 'woof' }
}

const d = new Dog()
Object.getPrototypeOf(d) === Dog.prototype // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype // true
```
