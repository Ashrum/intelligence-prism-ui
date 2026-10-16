# 交给 Supervisor 的浏览器验收清单 · P77

日期 2026-10-16，基线与分支见 [baseline.json](baseline.json)。Builder 未打开浏览器、未启动或重启服务；没有本轮截图。以下均为待执行验收，SSR / CSS 探针不能替代。

## 组件库 URL 与操作

使用 Supervisor 已有开发服务，路由：

1. `/next/use-cases/workspace-app-bar`：预览切到 blueprint / blueprint-night，1280×900 桌面。当前一级项应为 36px 高直角 primary 实块，文字与图标 primary-foreground，无底部下划线；hover 仍是实块。非当前项 hover 为 accent 直角底。Tab 聚焦当前 / 非当前项：只有 2px ring 外环（offset 2px），环落在 card 上，不被首末端横向滚动容器裁切。滚动到首末项分别验；点击 / Enter 保持原有导航意图行为。
2. 同路由 320×800：沿用原 compact 空间菜单断点，不能要求窄屏显示桌面一级链接。检查菜单展开 / 关闭、选中与焦点返回，SpaceBar 与侧栏当前项仍是 accent + 左墨线轻选中；展开 / 折叠 Sidebar 保持旧行为。侧栏对照可沿用 P76 `docs/blueprint/evidence/shell-nav-20261016/fixture.tsx`（未注册路由，需 Supervisor 自行挂载并记录实际 URL）。
3. `/next/foundations/blueprint#artifact-folio`，1280×900 与 320×800：第一处“函数单元练习 PDF（示例）”显示 REV 02；标题说明版本 v2，folio 在可访问树隐藏、标题和版本说明仍可读。第二处“完整扫描纸”显示 SHEET 01 / 02，按“下一份作答”后“裁切作答未提供”与 SHEET 02 / 02 同步，上一份恢复，首末按钮正确禁用。纸张夹具没有图像时也不得编造版本或成功状态。
4. 同页“本页样式预览”不出现空 folio 或残留前缀；“常用基础组件”仍显示 SECTION 01 / 02。原 sheetNo 样例 SHEET 01 / 04 等继续显示。标题右侧 folio 沿用等宽次级色，320px 长中文标题能自然换行，右对齐且不挤压 / 缩小正文。页内原公式与长中文段落保持完整。
5. 五主题逐一检查：light / paper / dark / blueprint / blueprint-night，1280×900 与 320×800。核心三主题普通 AppBar 视觉 / hover / 焦点与基线一致。蓝图外层嵌套核心主题预览的根、后代、伪元素不得收到蓝图墨块 / 直角 / ring 增量；夜图同验。缺失字体时索引回退到既有 monospace，不缺字或遮挡标题。

## API / 宿主组合补验

标题区未另有等价定位信息时，省略 folioAriaHidden，读屏应保留 SHEET / SECTION / REV；传 true 只能隐藏 folio，不能隐藏 title。通过临时评审夹具复核 sheetNo + folio 时后者优先（含空值），无序列 / 已保存版本则不显示。Workspace 的序列 / 版本优先级和未保存草稿判断属于后续接线，不由静态组件页伪造。

实际执行后按主题、视口宽高、URL、操作、观察到的文案 / 状态记录截图和结果。真实 Workspace 接线位置见 [inspection.md](inspection.md)。
