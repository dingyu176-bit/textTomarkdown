# Markdown 渲染仪表盘插件

飞书多维表格仪表盘插件，用于渲染指定记录的 Markdown 格式内容。

## 功能特性

- 📝 支持标准 Markdown 语法（标题、列表、链接、图片等）
- 📊 支持表格渲染（GFM 扩展）
- 🎨 支持富文本字段自动转换为 Markdown
- 🌗 基于 Semi UI 的主题适配（浅色/深色模式）
- 🔍 支持搜索选择数据表、记录和字段

## 使用说明

### 配置流程

1. **选择数据表** - 从下拉列表中选择包含 Markdown 内容的数据表
2. **选择记录** - 选择要渲染的具体记录（显示主键内容便于识别）
3. **选择 Markdown 字段** - 选择存储 Markdown 或富文本的字段
4. **保存配置** - 点击保存按钮完成配置

### 字段类型支持

- ✅ **文本字段** - 纯 Markdown 文本
- ✅ **多行文本/富文本** - 自动转换为 Markdown 格式（支持加粗、斜体等样式）

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 部署

1. 运行 `npm run build` 生成 `dist` 目录
2. 将 `dist` 目录部署到静态托管服务（Vercel、GitHub Pages 等）
3. 在飞书多维表格仪表盘中添加自定义插件，输入部署地址

## 目录结构

```
markdown-dashboard-plugin/
├── src/
│   ├── components/
│   │   └── MarkdownRenderer.tsx    # Markdown 渲染组件
│   ├── App.tsx                     # 主应用组件
│   ├── App.css                     # 应用样式
│   ├── index.css                   # Markdown 样式 + 主题适配
│   └── main.tsx                    # 入口文件
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── readme.md
```

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- Semi UI 组件库
- react-markdown + remark-gfm（Markdown 渲染）
- @lark-base-open/js-sdk（飞书多维表格 SDK）

## 注意事项

1. 插件仅适用于飞书多维表格仪表盘
2. 支持中/日/英三种语言（通过 i18n）
3. 自动适配浅色/深色模式
4. 记录列表最多加载 50 条记录供选择
