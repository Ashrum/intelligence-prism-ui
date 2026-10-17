# P84 · 交给 Supervisor 的浏览器验收清单

日期：2026-10-18。候选基线 `433969ab29679669c78fde816dfec96c4db31cfb`；当前分支 `feat/agent-r9-extract`。本文件是待执行清单，不是通过记录；没有本轮浏览器截图。浏览器验收：按分工由 Supervisor 执行。

## 覆盖矩阵

使用当前工作树对应的 5173 服务。五主题 `light / paper / dark / blueprint / blueprint-night` × 1280×900 和 320×900；另在桌面中把内容容器收窄至 320，检查容器适配。实际记录主题、宽高、路由、操作、看到的文案与结果。SSR、CSS 解析和无溢出不替代视觉验收。

## 新接口与交互

1. `http://localhost:5173/next/foundations/blueprint#workspace-contracts`：通过本页“Agent 工作区稳定交互”链接定位；材料记录九个状态逐一选择。默认文件名“九年级（2）班周测原卷.pdf”，版本 V12；有请求时显示“原请求：周测材料上传”。展开文件详情，正文和可访问名中不应出现 material-12 / material_v12 / upload-request-12，内部 data 属性不属于可见文案。
2. 同处：本机 PDF/PNG/JPG、20 MB、4 个与服务上传类型／单文件大小／文件数量／页数上限分开，后四项均“尚未核验”。“页数与安全检查尚未核验”应常驻。选择文件仅产生选择反馈，不宣称上传；上传失败的重试因能力未接入保持禁用并有原因。
3. 同处：在 selected / received / uploading / uploaded 等可移除记录点击“移除此引用”，应看到“不会取消上传或删除原件”及意图反馈，记录不会自动变已移除；unknown 只显示“查询原请求”，点击后仍待回执；removed 无变更动作。键盘及 Tab 可访问原生选择、详情、动作与说明，禁用原因有关联。
4. 同处：切换确认六态，短标签为待确认／提交中／已接收／已记录／暂不可确认／待核对；仅 ready 可提交，unknown 只查询。ready / blocked 的正向影响带“将会”；其他四态无此前缀。开启“只读记录”后全部无“将会”，标题为“本次确认范围”，ready 的提交能力由示例宿主阻断；关闭恢复对应当前记录。
5. 同处：试题篮常驻“题目版本 V2 · 入篮版本未锁定”，版本行不被题干两行裁切；公式仍是 MathML，点击题目显示全文，关闭返回触发器。检查长中文、公式与窄容器视觉层级，不只检查 scrollWidth。
6. `http://localhost:5173/next/foundations/blueprint#artifact-folio`：成果标题的“更多”菜单可由键盘打开，“版本说明”显示当前 REV 的依据，Esc 可关闭并恢复焦点。菜单位于 heading 外，标题可访问名不含“更多”；有版本的文件显示 REV，有真实序列的作答切换显示 SHEET，无事实的标题不造 folio。1280 与 320 下标题、folio、菜单自然换行，不遮挡或互相挤压。

## 旧调用与主题隔离

- `http://localhost:5173/next/components/agent-components`：定位“文件输入”“执行确认”“集合篮”既有示例，复核 inline / workspace、default / compact，文件空队列、失败／未知、只读历史、批量动作和分组等原路径。旧调用未传新字段，DOM 快照保持原样，旧技术回退与 future 文案属于兼容输出；不要据此认为本轮的新推荐接口未生效。
- `http://localhost:5173/next/foundations/blueprint` 与 `http://localhost:5173/next/components/menu`：使用已有预览主题选择器交叉验证外层 blueprint / blueprint-night、嵌套 light / paper / dark，以及反向核心外层／蓝图内层。覆盖嵌套根节点、后代、伪元素及菜单 Portal；普通按钮不被新插槽样式重绘。
- 对新增标题操作检查正常／hover／focus-visible／disabled，以及系统减少动态效果初始开启和运行中切换。旧 BpTitleBlock 四项事实在 ≤480px 内容容器维持 2×2，>480px 维持一行。

## 下一轮 Workspace 接线复验

按 workspace-sync.json 的四个 blob 同步、更新既有来源 manifest 后，在 Workspace 的 R9/W207 任务中验证 MaterialFileRow 替换、inline 常驻策略事实、去掉重复移除／版本段落、只读资格、标题菜单、状态／读取／版本回执和返回焦点。任务条 A–D、停止三阶段与 E 部分成果、用量 §9.3.4 各分支、依据摘要和材料九态的阶段审计仍是宿主责任，本轮 Prism 文档和工程测试不表示这些流程重新完成浏览器验收。

未验证范围：浏览器验收：按分工由 Supervisor 执行；Workspace 实际同步与业务接线、真实上传／模型／计量／额度服务、真机触屏、读屏器、实体打印均未验。
