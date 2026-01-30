# Beautiful-Mermaid Skill for Claude

## 简介
为 Claude AI 提供的 Mermaid 图表渲染 Skill，支持 SVG 和 ASCII 双格式输出。

## 功能特性
- 📊 SVG 和 ASCII 渲染
- 🎨 14 个精美主题（tokyo-night, dracula, github-dark...）
- 📈 5 种图表类型（Flowchart, Sequence, State, Class, ER）
- ⚡ 批量并行渲染
- 📚 完整的模板和文档

## 安装步骤

### 1. 安装到 Claude Skills 目录
```bash
cd ~/.claude/skills
git clone https://github.com/[用户名]/beautiful-mermaid.git
```

### 2. 安装依赖
```bash
# 安装 Node.js（如果未安装）
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm

# 安装 beautiful-mermaid
npm install -g beautiful-mermaid
```

### 3. 验证安装
```bash
cd beautiful-mermaid
python3 scripts/list_themes.py
```

## 快速开始

### 列出可用主题
```bash
python3 scripts/list_themes.py
```

### 渲染单个图表
```bash
python3 scripts/render_mermaid.py \
  --input diagram.mmd \
  --output output.svg \
  --theme tokyo-night
```

### 批量渲染
```bash
python3 scripts/batch_render.py \
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

- Python 3.7+
- Node.js 14+
- npm 或 yarn

## 许可证

MIT License

## 致谢

基于 [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) 项目
