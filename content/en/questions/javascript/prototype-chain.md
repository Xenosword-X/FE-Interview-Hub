---
slug: prototype-chain
title: What is the Prototype Chain? How does JavaScript inheritance work?
category: javascript
tags: [javascript, prototype, oop]
difficulty: intermediate
---

## The Prototype Chain

Every JavaScript object has a hidden `[[Prototype]]` property pointing to its prototype object. When a property is not found on an object, the JS engine walks up the prototype chain until it reaches `null`.

## Example

```js
const arr = [1, 2, 3]

// arr doesn't have a map method directly
// but arr.__proto__ === Array.prototype
// Array.prototype has the map method
arr.map(x => x * 2) // [2, 4, 6]

// Chain: arr → Array.prototype → Object.prototype → null
```

## ES6 Class and the Prototype Chain

The `class` syntax is syntactic sugar over prototype-based inheritance:

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
