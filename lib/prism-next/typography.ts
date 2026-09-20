export const TYPOGRAPHY_VERSION = "0.2.1"
export const typographyRoles = [
  {
    "id": "page-title",
    "label": "页面标题",
    "size": 26,
    "lineHeight": 36,
    "weight": 600,
    "usage": "页面主标题、Agent 欢迎标题",
    "className": "text-page-title"
  },
  {
    "id": "section-title",
    "label": "分区标题",
    "size": 20,
    "lineHeight": 30,
    "weight": 600,
    "usage": "主要分区、完整任务弹窗标题",
    "className": "text-section-title"
  },
  {
    "id": "block-title",
    "label": "内容块标题",
    "size": 16,
    "lineHeight": 24,
    "weight": 600,
    "usage": "独立阅读、核对或编辑模块",
    "className": "text-block-title"
  },
  {
    "id": "item-title",
    "label": "项目标题",
    "size": 14,
    "lineHeight": 20,
    "weight": 600,
    "usage": "同一集合中的材料、任务条目",
    "className": "text-item-title"
  },
  {
    "id": "read-body",
    "label": "阅读正文",
    "size": 16,
    "lineHeight": 28,
    "weight": 400,
    "usage": "题干、解析、完整回复与长内容编辑",
    "className": "text-read-body"
  },
  {
    "id": "ui-body",
    "label": "界面正文",
    "size": 14,
    "lineHeight": 20,
    "weight": 400,
    "usage": "短界面内容、表格值、短属性输入",
    "className": "text-ui-body"
  },
  {
    "id": "ui-action",
    "label": "操作文字",
    "size": 14,
    "lineHeight": 20,
    "weight": 500,
    "usage": "导航、按钮、菜单、字段标签",
    "className": "text-ui-action"
  },
  {
    "id": "ui-hint",
    "label": "辅助说明",
    "size": 14,
    "lineHeight": 22,
    "weight": 400,
    "usage": "错误原因、操作引导、状态解释",
    "className": "text-ui-hint"
  },
  {
    "id": "ui-meta",
    "label": "附属信息",
    "size": 12,
    "lineHeight": 18,
    "weight": 400,
    "usage": "低优先级时间戳、来源编号",
    "className": "text-ui-meta"
  },
  {
    "id": "component-label",
    "label": "组件短标签",
    "size": 12,
    "lineHeight": 16,
    "weight": 500,
    "usage": "非关键徽标、快捷键提示",
    "className": "text-component-label"
  },
  {
    "id": "stat-display",
    "label": "重点数据",
    "size": 24,
    "lineHeight": 32,
    "weight": 600,
    "usage": "少量概览指标，保留界面字体",
    "className": "text-stat-display"
  }
] as const
export type TypographyRole = typeof typographyRoles[number]["id"]
