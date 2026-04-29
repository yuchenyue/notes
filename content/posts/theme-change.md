---
date: '2026-04-24T10:00:00+08:00'
lastmod: '2026-04-29T10:00:00+08:00'
draft: false
title: 'Hugo 主题切换'
tags: ['hugo', '主题']
---

## Hugo 使用 Git Submodule 切换主题

Hugo 是一个静态网站生成器，支持通过 Git Submodule 来管理主题。

### 添加主题

```bash
git submodule add https://github.com/user/theme.git themes/theme-name
```

### 切换主题

```bash
# 移除旧主题
git submodule deinit themes/old-theme
git rm themes/old-theme

# 添加新主题
git submodule add https://github.com/user/new-theme.git themes/new-theme
```

### 注意事项

1. 切换主题后需要调整配置文件
2. 不同主题对内容结构要求不同
3. 建议在切换前备份配置