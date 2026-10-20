# BPM1d · 失败归因与重跑交接

日期：2026-10-19。候选基线 `c2dd2239b97963e12f7cf7cb3924328958e68a68`，分支 `docs/blueprint-matrix-closeout-2`，开工干净。只修改本 evidence 目录和 STATUS；没有修改产品源码、CSS、工程测试、依赖或冻结组件。下述归因区分 Supervisor 已核实与 Builder 源码分析；修正后尚未运行浏览器。

## 原始结果与归档

BPM1c Supervisor 实跑：interactions **1376 pass / 64 fail / 60 error**；per-round **821 pass / 57 fail / 57 error / 85 pending-visual / 15 observed**。当前四组结果和四组截图索引字节保持不变；完整 JSON、来源清单及 SHA-256 已存入 [归档](bpm1c-supervisor-run.json.gz)。旧结果内部基线字段仍是 `1930941`，不能当作 c2dd223/P87 通过。`--plan` 写独立 plan 与 manual-review-plan，不修改历史实测或历史目检索引。

## 逐类结论

| 问题 / 旧失败数量 | 结论与源码依据 | 本轮处理与保留门槛 |
| --- | --- | --- |
| Dialog / Alert trap：interactions 28 fail；P74 scoped-controls 15 fail | **探针问题**，Supervisor 已核实 Base UI focus guard 异步回焦。旧 trap 每次 Tab 后立即读焦点。 | 每次真实 Tab / Shift+Tab 后排除 guard，非 guard 焦点连续两帧不变再判 containment；5 秒上限。永久 guard、稳定落在 popup 外都不能通过；合成检查覆盖三种路径。 |
| P75 coarse 5 fail，另 question-details / question-spacing 共 12 fail | **探针问题**。`question-details.tsx:26` 使用 pointer-coarse:min-h-11；`blueprint.css:90–93` 的 32px 仅限两蓝图 fine。`lib/coss/segmented-control.ts:10` 核心默认 h-8.5 / sm:h-7.5，即 34 / 30px。 | coarse 独立 hasTouch context，在每次测量前记录并要求 coarse=true，三次测量完成后才截图，避免截图夹杂上下文恢复。逐项保留 pointer、阈值和高度；所有 coarse ≥44，蓝图 fine ≥32，核心细指针按冻结尺寸验证。截图后的状态不参与 coarse 判定。 |
| Skeleton reduce 9 fail | **探针问题**，Supervisor 已核实 `theme.css:403` 全局 .01ms / 1，与蓝图 none 的差异。 | 核心接受 animation none 或所有动画时长 ≤.01ms 且 iteration=1；蓝图仍须 none。多动画列表逐项检查，持续循环不通过。 |
| local-submenu 15 error | **探针问题**，Supervisor 已手验两次 Esc；旧 measured.text 是“选择材料材料示例子菜单”，证明旧 last() 在子菜单真正出现前命中父菜单。 | 先轮询可见 role=menu 数量=2，再以“长中文讲评材料示例”定位真正子菜单；15 秒轮询第一次 Esc 后菜单数=1且焦点回子触发器，第二次=0且回原触发器。父菜单保留断言不变。 |
| Toast 三通知 / 关闭指定项 / close-all 45 error | **探针问题**。`components/coss/toast.tsx:73–98` viewport 本身无高度、children absolute；hover viewport 的 visible/actionability 不成立。样例 timeout=0。 | hover 实际可见第一条 toast，等待动画稳定后再操作；仍检查 3 条、局部容器、指定条关闭后其余两条存在，以及 close-all 后清空。不强制 click、不改计时器。 |
| Sheet 边界 / 内部滚动 15 fail | **探针问题**。旧 right=352 相对 viewport320恰好多32px，对应 `sheet.tsx` 入场 translate-x-8；`SheetPanel` 实际由 ScrollArea 包裹，旧探针对内容 div 写 scrollTop。 | 等待有限动画与 rect 稳定，保存 popup 宽/边界/高度，改读真正 scroll-area-viewport。左右边界及文档不溢出、长内容确实滚动的断言全部保留；若稳定后仍失败，作为新的疑似缺陷复核。 |
| Switch 12 fail | **探针问题**。`components/coss/switch.tsx:17` 有 200ms background-color transition；旧断言切换状态后立即采颜色。 | 每次 on/off/on 等待过渡稳定；aria-checked、on/off颜色不同、蓝图 ≥3 对比度全部保留。 |
| P76 site-sidebar 20 error | **探针问题**。`sidebar.tsx:92` 调用 max-md；`hooks/coss/use-media-query.ts:10` md=800；`sidebar.tsx:213–216` 移动 Popup 覆盖 slot 为 sidebar。 | 320/768 走真实 `(max-width:799px)` 分支，定位 `[data-slot=sidebar][data-mobile=true]`；1280 仍查 desktop state / Control+b。移动 trap、Esc 和回焦保留。 |
| P76 ShellNavFixture 5 error（768），320 原分支可能空过 | **无法自动判定**。历史 `shell-nav-20261016/fixture.tsx:29–35` SpaceBar 在 Provider 外，仅 setOpen，不接 openMobile；不能代表真实移动宿主。 | 按800断点修正桌面探针。320/768 记录夹具能力缺口并保持 pending-visual、pass=null，不算 drawer通过；独立加入移动宿主目检义务。1280 的56px轨道/40px按钮断言保留。 |
| P85/P85b/P85c object-expand 20 fail | **探针问题**。`agent-structure-arranger.tsx:143,329` 将未知事实聚合为“未知：保存状态、关键变化、分组数、题数、总分。”；旧探针匹配未单独显示的 saveLabels。 | 精确匹配当前聚合文案；展开 workspace、返回 inline、恢复原内容的断言不变，不伪造已保存。 |
| 首批 CSS zoom2 / print 5 fail（320） | **疑似缺陷（仅 CSS 投影）**。旧探针把320 CSS视口再 zoom2，与原生浏览器缩放混为一项；固定内边距/图纸布局在等效更窄空间可能溢出，但旧记录未保存geometry，源码不足以定位溢出节点。 | 保留原无溢出断言；在断言前记录 client/scroll、zoom、viewport、DPR和前40个越界元素，截图后 finally 恢复。另加原生200%缩放目检；不改成 observed/pass，不推断为已确认产品缺陷。 |
| P73 两变体/白图发送框 17 error；第二批按钮 15 error | **探针问题（源码分析，待重跑验证）**。错误都在共用 keyboard helper；它假设 `.focus → Tab → Shift+Tab` 必回原目标。原生按钮、复合控件、页面边界并不保证逆向遍历；button-states 的 mouseup 还会触发实际 click（菜单/分页/动态内容）。 | 用临时前置焦点哨兵建立真实 Tab 入口，实际按 Tab 后必须 activeElement=目标且 :focus-visible；finally 移除哨兵。仅采 pressed 时在 mouseup 前移出控件，防止附带点击。仍验证真实焦点与原视觉断言，未改 tabindex / disabled / 样式。全页自然 Tab 顺序与视觉裁切留在原目检，不用定点入焦代替。 |

上述分组完整覆盖两组所有 fail / error，额外修正核心题卡 30px 适用范围，不以降低蓝图或触控门槛求通过。没有新增已确认产品缺陷或产品修复。

## P87 清单与覆盖

从 [P87 原当前快照](bpm1d-before-status.txt) 的“交接”和“未验证范围”拆出 **4 可自动化 / 1 需目检 / 2 不适用或已有覆盖**：

- entry-pointer：细指针四边同步与离开清除。
- entry-selection：三行 hover / Tab 对应节点框、标签、实际图纸坐标；链接 #entry-index 和两个按钮的内容。
- entry-layout：68px最小行高、窄屏动作另行、无行分割边框、横向可达。视觉布局仍目检。
- entry-motion：no-preference → reduce → no-preference → reduce；动画停止、节点/标签/坐标静态高亮保留。
- visual-entry：上述交互截图的真实呈现，尤其反白、线框、标签、换行、可读性与静态强调。常规5代表组合之外增加 light/320，以满足原交接 blueprint/light ×320/1280。
- P87隔离单独进入 isolation：5外层 ×5内层 ×320/768/1280，共75行；覆盖整图纸以及入口/节点/标签自身作为嵌套根、后代及伪元素。使用渲染副本作CSS对照，不冒充React Context或Workspace接入。
- Workspace、真实服务、真机、读屏器和实体打印不适用于本自动化，不核销原义务。

布局矩阵中原 `/next/foundations/blueprint` 已有5主题×3宽度，重跑会含新增图纸 E，不另造路由。全计划18轮来源、158义务：**63可自动化 / 21需目检 / 74不适用或覆盖**。interactions1500；per-round **945自动 +106目检 +60附加=1111**；matrix1290（645布局+645阅读）；isolation150。计划总计4051行，均不是新实测通过数。

## 交给 Supervisor 的浏览器验收清单

现有服务由 Supervisor 核实为当前工作树。运行前保留本轮归档；`--replace` 会更新相应组JSON与同名本机截图。本轮需重跑 **全部四组**：前两组修探针；matrix/isolation因P87新增内容及隔离覆盖更新。

```sh
node docs/blueprint/evidence/matrix-closeout-20261019/measure.mjs --run --group=interactions --replace
node docs/blueprint/evidence/matrix-closeout-20261019/measure.mjs --run --group=per-round --replace
node docs/blueprint/evidence/matrix-closeout-20261019/measure.mjs --run --group=matrix --replace
node docs/blueprint/evidence/matrix-closeout-20261019/measure.mjs --run --group=isolation --replace
node docs/blueprint/evidence/matrix-closeout-20261019/validate.mjs
```

自动项覆盖 light/paper/dark/blueprint/blueprint-night ×320/768/1280，viewport高度900。目检任务见 [本轮独立计划](manual-review-plan.md)，实跑后 [目检索引](manual-review.md) 更新实际截图。重点操作：

- `http://localhost:5173/next/components/menu`：局部主题菜单→子菜单；Esc依次回子菜单触发项、原触发器；父菜单第一次仍开。
- `http://localhost:5173/next/foundations/blueprint#common-components`：Dialog正反向Tab绕回、Switch切换前后稳定颜色、发送及按钮自然Tab顺序和焦点外框。
- 同页 `#common-components-two`：三条Toast展开、指定关闭/全部关闭；长Sheet稳定边界与内容滚动；reduce Skeleton。320下CSS zoom失败继续保留；用真实浏览器200%缩放复核，区分公式局部滚动和页面越界。
- `http://localhost:5173/next/components/question`：coarse=true下展开题卡，切换三个Tab，每次高度≥44；核心宽屏fine按30px基线，两蓝图fine≥32。
- `http://localhost:5173/next`：320/768 mobile drawer、1280 desktop collapse/Control+b；夹具SpaceBar移动接线另核，不从本站结果外推。
- `http://localhost:5173/next/components/agent-components/prompt-bar`：Rounded/Pill、载入草稿、关闭/恢复模型入口、来源/命令、Shift+Enter；自然Tab到发送，白图单2px outline+2px offset。
- `http://localhost:5173/next/foundations/blueprint#sheet-object-cards`：展开编排应明确显示上述未知事实，不应自动变成已保存；返回原位置。
- 同页 `#entry-annotations`：按P87清单，blueprint/light至少320及1280；补night代表组合、768几何以及嵌套核心岛。动态reduce停止装饰但静态定位仍在。

## 离线验证与未验证范围

本轮 `validate.mjs` **20/20** 静态检查通过，包含 **14** 条子命令全部退出0、**12/12**合成检查、fixture定向类型 **0诊断**；核对24份固定来源与2631条现有截图索引。实际命令、退出码、证据校验与fixture定向类型检查见 [validation.json](validation.json)，实际差异见 [bpm1d-scripts.diff](bpm1d-scripts.diff)。旧BPW1测试来源在P87中发生CSS解析器变更，已保留1930941原文件快照及原hash，避免把历史清单的行号错误绑定到新版源码。历史 prepare/classify 生成器现在明确拒绝覆盖BPM1d，复用已审清单执行 `measure.mjs --plan`。

浏览器验收：按分工由 Supervisor 执行。Builder无浏览器运行、截图、生产构建或全量工程测试；只做证据脚本语法、合成时序/策略检查与离线交接校验。未提交、推送、PR、联网、安装依赖、启动服务、发布或同步站点。旧周期3/3仍待累计浏览器矩阵和独立综合审查，不新增已完成轮、不重置、不宣布收口；Builder不自我批准。
