---
date: '2026-04-24T10:00:00+08:00'
draft: false
title: 'Vue 基础'
cover: 'https://picsum.photos/seed/vue/600/400'
tags: ['vue', '前端','spring']
---

## Vue.js 基础入门

Vue.js 是一个用于构建用户界面的渐进式 JavaScript 框架。与其他大型框架不同的是，Vue 被设计为可以自底向上逐层应用。

### 核心特性

- **响应式数据绑定**：Vue 最独特的特性之一，是其非侵入性的响应式系统。数据模型仅仅是普通的 JavaScript 对象。
- **组件化应用构建**：组件是 Vue 最强大的功能之一，允许我们使用小型、独立和通常可复用的组件构建大型应用。
- **虚拟 DOM**：Vue 使用虚拟 DOM 来提高渲染效率，只更新需要变化的部分。

### 创建一个 Vue 应用

```javascript
import { createApp } from 'vue'

const app = createApp({
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
})

app.mount('#app')
```

### 模板语法

Vue 使用基于 HTML 的模板语法，允许开发者声明式地将 DOM 绑定至底层组件实例的数据。

```html
<div id="app">
  {{ message }}
</div>
```

### 计算属性

计算属性是基于它们的响应式依赖进行缓存的，只在相关依赖发生改变时才会重新求值。

```javascript
computed: {
  reversedMessage() {
    return this.message.split('').reverse().join('')
  }
}
```