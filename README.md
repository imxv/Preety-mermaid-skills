# Pretty-Mermaid Skills

## 简介
为 AI 提供的 Mermaid 图表渲染 Skill，支持 SVG 和 ASCII 双格式输出，让您的文档更加生动。

## ✨ 功能特性

- 📊 **多格式支持**：支持 SVG 和 ASCII 渲染导出
- 🎨 **丰富主题**：内置 15 种精美主题，满足不同场景需求
- 📈 **全图表支持**：支持 Flowchart, Sequence, State, Class, ER 等 5 种常用图表
- ⚡ **高效渲染**：支持批量并行渲染，速度飞快
- 📚 **开箱即用**：提供完整的模板和详细文档

### 支持主题列表
| Light Themes | Dark Themes | Other |
| :--- | :--- | :--- |
| zinc-light | zinc-dark | nord |
| tokyo-night-light | tokyo-night | nord-light |
| cappuccin-latte | tokyo-night-storm | dracula |
| github-light | cappuccin-mocha | one-dark |
| solarized-light | github-dark | |
| | solarized-dark | |

## 🤖 AI 助手集成

支持与以下 AI 编程环境无缝集成，通过自然语言即可调用绘图能力：

- **Claude Code**
- **Cursor**
- **Gemini CLI**
- **Antigravity**
- **OpenCode**
- **Codex**

## 🚀 安装步骤

### 一键安装
```bash
npx skills add https://github.com/imxv/Preety-mermaid-skills
```

### 验证安装
```bash
cd Pretty-mermaid
node scripts/themes.mjs
```
> **提示**：首次运行时会自动安装依赖，只需确保您的环境中有 Node.js。

## 📖 快速开始

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

## 📂 使用示例

查看 `assets/example_diagrams/` 目录下的 5 个模板文件，快速上手：
- `flowchart.mmd` - 流程图
- `sequence.mmd` - 时序图
- `state.mmd` - 状态图
- `class.mmd` - 类图
- `er.mmd` - ER 图

## 📚 完整文档
详细使用指南请参阅 [SKILL.md](SKILL.md)

## ⚙️ 系统要求
- Node.js 14+

## 📄 许可证
MIT License

## 🙏 致谢
基于 [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) 项目
