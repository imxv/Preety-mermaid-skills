# Beautiful-Mermaid Skills

## 简介
为 Claude AI 提供的 Mermaid 图表渲染 Skill，支持 SVG 和 ASCII 双格式输出。

## 功能特性
- 📊 支持 SVG 和 ASCII 渲染导出
- 🎨 15 种主题选择（zinc-light

zinc-dark

tokyo-night

tokyo-night-storm

tokyo-night-light

cappuccin-mocha

cappuccin-latte

nord

nord-light

dracula

github-light

github-dark

solarized-light

solarized-dark

one-dark）
- 📈 支持 5 种图表类型（Flowchart, Sequence, State, Class, ER）
- ⚡ 支持批量并行渲染
- 📚 完整的模板和文档

## 安装步骤

### 1. 安装到 Skills 目录
```bash
npx skills add https://github.com/intellectronica/agent-skills --skill Pretty-mermaid
```

### 2. 验证安装
```bash
cd beautiful-mermaid
node scripts/themes.mjs
```

> **首次运行时会自动安装依赖，只需 Node.js 环境。**

## 快速开始

### 列出可用主题
```bash
node scripts/themes.mjs
```

### 渲染单个图表
```bash
node scripts/render.mjs \
  --input diagram.mmd \
  --output output.svg \
  --theme tokyo-night
```

### 批量渲染
```bash
node scripts/batch.mjs \
  --input-dir ./diagrams \
  --output-dir ./output \
  --theme dracula
```

## 使用示例

查看 `assets/example_diagrams/` 目录下的 5 个模板文件：
- `flowchart.mmd` - 流程图
- `sequence.mmd` - 时序图
- `state.mmd` - 状态图
- `class.mmd` - 类图
- `er.mmd` - ER 图

## 完整文档

详细使用指南请参阅 [SKILL.md](SKILL.md)

## 系统要求

- Node.js 14+

## 许可证

MIT License

## 致谢

基于 [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) 项目
