# P79 实现与复用记录 · 2026-10-16

基线：`feat/blueprint-nav-folio` / `8270cced893de48b202a772b6db0c42c13988dc0`，开工工作树干净。委派为 P79；P77 / P78 未合并，遵照前置约定不提交、推送、联网、安装依赖、启动服务或浏览器。

## 复用核对与取舍

1. 先核对本地 `components/prism-next/blueprint/blueprint.tsx` 中 BlueprintSheet、BlueprintSectionHeader、BpPaneHead、BpCard、BpTool、BpCodebox。Sheet 是整张图纸；PaneHead 仅头部；BpCard 是缩略导航卡（交互时会抬升、阴影），均不能原样作为本轮独立对象 / 分节卡。沿用它们的语义字号、令牌、useId 标题关联和 BpTool 图标操作。代码区域直接组合 BpCodebox，测试实际 SSR 保留唯一 pre。
2. 核对冻结 `components/coss/card.tsx` 的 Card / CardFrame / Header / Action。其默认圆角、阴影、分区间距与本轮直角、无阴影、墨色标题栏、字母序列不一致；不以局部重绘 coss 解决，按 PO 明确新增的 bp-* 呈现封装实现，coss 字节不变。
3. particles 离线检索：本地 `components/prism-next/demos/{input,selection,dialog,date}-particles.tsx` 未检出 Card / p-card；历史 `docs/blueprint/evidence/batch2-20261016/reuse-sources.json` 是 input-group、combobox、toggle-group 等已有组合检索记录，非本轮完整 registry。未联网刷新 `https://coss.com/ui/particles` / `https://coss.com/ui/r/registry.json`，不声称穷举上游或接入最新代码。既有 Prism 组合足以完成；未复制第三方代码或使用 Beautiful UI。
4. 示例复用 `continuousPreviewPages` 的原件图片与缺图记录、BpTool、QuestionMath；示例有实际 A/B 两个试卷分节。状态从当前夹具事实构造，不写 live、耗时、保存成功等推定状态。选择题说明是本地披露，不改变任务状态。

## 实现边界

- 新增 BpFrameCard / BpSectionCard 类型与封装；外框 1.5px、直角、无阴影，header 中语义 heading，默认 h3 / 可选 h2–h6，自动 aria-labelledby 可由宿主覆盖。
- Section 字母并入标题；未传 / 空白不生成字母，未传 status 不生成状态区。状态方块 aria-hidden，文字可读。元信息与操作槽均可省略。
- CSS 只给新增 bp-* 类赋值，不增加主题条件覆盖或 descendant 全局重绘，也无伪元素；使用最近预览根的令牌，因此五主题 / 25 个嵌套主题组合保持中性回退。没有主题令牌、字号或依赖改动。
- 状态方块填充使用已有语义色，其对反相头部的色块填充对比在部分主题不足 3:1；保留 1px primary-foreground 边界，方块边界对头部 ≥3:1，文字 ≥4.5:1。所有 tone 均保留可读事实，颜色不作为唯一信号。数值是工程计算，不是浏览器测量。
- 新测试实际编译 React、SSR，检查 h2–h6、唯一标签引用、五 tone、具名 action、缺省槽、代码块组合、示例事实；解析实际 CSS / theme.css，验证语义令牌、25 种嵌套组合、普通组件零增量、换行约束与 13 项回退变异。换行测试不模拟像素布局，不声称 320 视觉通过。
- `docs/blueprint-theme.md` 是 guide 的源文档；通过现有生成器同步 `lib/prism-next/blueprint-guide.json` 与关联 public 下载副本，未手改生成物。

## Workspace 后续适用位置（只读核对，未修改）

以下路径均相对 `ole-school-workbench`。接入须另由 Supervisor 委派，保留原业务 Store / 权限 / 预览行为：

- 先同步组件 `src/components/prism-next/blueprint/blueprint.tsx` 与样式 `src/theme/blueprint.css`，仅新增对应封装/样式，不覆盖 Workspace 既有适配。
- 原件对照：`src/features/teacher/scan/P04Canvas.tsx` 的 `originalContent` 及 embedded WorkspaceComparison 调用点，可用 FrameCard 包住原件内容。`src/features/teacher/agent-workspace/WorkspaceComparison.tsx` 负责原件 / 结果 Tabs、宽度切换、焦点与滚动恢复；卡片接入不替换这些行为。
- 文件 / 外部来源预览：`src/features/teacher/agent-workspace-page/modules/materials/views.tsx` 的 renderPreview / renderSourceContent 组合点，FrameCard 展示资源名与已有事实。`ResourcePreviewContent.tsx` 当前只报告已展示内容，保留其生命周期；不要为了卡片改业务回执。`modules/files/objects.tsx` 是输入材料管理，不能整块当文件预览随意套卡。
- 成果内大题分节：`src/features/teacher/shared/PaperVersionPreview.tsx` 的分页 / mixed 页面与 `src/features/teacher/shared/PaperPreviewHeadings.tsx` 的真实 section / group 结构是适配候选；SectionCard 应同时包住该节内容，不能仅把标题回调替换成一个空卡。Agent 成果入口 `src/features/teacher/agent-workspace-page/FormalPaperView.tsx` 可核对对应成果内容组合，不包逐条对话消息。字母仅映射真实 section 顺序，文件版本 / 题数来自宿主。

## 工程返修记录

首轮五项中字体、排版、构建、2224 项测试通过；TypeScript 报 2 条 `page.dimensions` 可能 undefined。示例改为可选访问 width / height（不补造尺寸），随后重跑五项全部通过。首轮日志使用 initial-* 留存，当前 engineering.json 仅记录修正后的运行。

## 未验证范围

浏览器验收：按分工由 Supervisor 执行。真实服务、Workspace 接入、移动真机、读屏器、实体打印未验。无本轮浏览器截图。工程结果与命令见 engineering.json；视觉与键盘路径见 browser-checklist.md。Builder 自测不等同 Supervisor Review 或 PO 批准。
