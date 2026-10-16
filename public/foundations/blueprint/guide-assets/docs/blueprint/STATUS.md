# Blueprint 主题 · 状态

> 交接状态记录。每轮更新“当前”，旧“当前”连同日期与基线移入“历史”。正文路径均为仓库相对路径。

## 当前

- 轮次：BPW1 · 蓝图警告前景色对比度 · 2026-10-16；开工基线 `c5d236339d1d811df06982c753f3a29ecc786e51`，分支 `fix/blueprint-warning-contrast`；开工工作树干净。
- 授权与范围：按 Supervisor 委派 `task-BPW1.md`，仅将蓝图 `--warning-foreground` 从 `#A8620A` 调为 `#995909`；补充 `tests/blueprint-theme.test.mjs`，更新主题正文及既有 guide 生成物。核心三主题、`--warning`、其他令牌、组件源码、冻结 coss、依赖及冻结正式规范和其 public 副本均不改。
- 检查周期：本轮为当前周期 2/3，Builder 实施与全套工程检查完成，待 Supervisor 独立 Review / 浏览器验收，尚未计为已验收；上一轮已完成 1/3。按本轮任务要求执行全套工程检查，未据此重置周期；第 3 个完成轮仍须完整回归及独立综合审查。
- 选值：沿原琥珀 / 赭色方向等比例降低 sRGB 通道后取整，`#995909`；最差组合为 warning-foreground/accent，计算值 4.660886:1，白字/card 对该填充为 5.544764:1。保持警告与错误红 / 正文墨色的色相或亮度差异，真实视觉辨识交 Supervisor 验收。
- 本轮工程：按序运行 `node scripts/check-math-font.mjs`（固定字体与许可通过）、`node scripts/check-typography.mjs`（308 个 TSX 文件通过）、`node node_modules/vinext/dist/cli.js build`（成功）、`node --test tests/*.test.mjs`（2145 项 / 2145 通过 / 0 失败 / 0 跳过）、`node node_modules/typescript/bin/tsc --noEmit`（0 错误），退出码均为 0。另运行 `node scripts/sync-blueprint-guide.mjs` 及 `--check`（131 块 / 85 项资源），主题专项 9/9；内存变异确认恢复旧蓝图值会使表面 / Badge 对比度测试失败，三核心主题各自偏移均被契约检出。测试从实际 CSS 令牌计算五种表面、三种 8% Badge 合成底与两种反白标签；核心 warning-foreground 契约直接取自当前 main，light/paper 为 `#895509`，dark 为 `#F4CC86`。
- 偏差与审查：无组件新增或改造，本轮复用现有令牌、coss Badge 的 `bg-warning/8` 和既有主题测试；不引入外部实现。冻结规范仍保留旧值，按委派不修改；本次全量测试未因该已知差异失败，未放宽既有断言；冻结规范值与实现的同步仍须另行授权。Builder 自测不等同于 Supervisor Review 或 PO 批准；不提交、推送或发布。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行；本轮未调用浏览器、未启动 / 重启开发服务，无新增截图；真机、读屏器与实体打印未验。四主题 × 320 / 1280px 的检查路径见本轮外部报告 `BPW1-Report.md`。
- 最近完整工程回归：本轮 BPW1 为 2145/2145 通过；最近完整浏览器矩阵仍为下方通用组件第二批的历史证据。本次工程通过不替代浏览器矩阵或第 3 轮独立综合审查；此前 1949 项 / 1688 通过 / 261 既有失败仅保留为历史。

## 历史

### 蓝图编辑式排版与 Geist Mono 子集 · 2026-10-16（原当前，原样保留）

- 轮次：蓝图编辑式排版与 Geist Mono 子集 · 2026-10-16；开工基线 `9b5ac0c389abb5fb232b0356a920a60706d86e27`，Site v123，分支 `feat/blueprint-editorial-type`；开工工作树干净。
- 授权：用户批准编辑式章节 / 小节排版、有限 Geist Mono 本地子集及每 3 个已完成小轮做完整回归与独立综合审查。本轮只作用于现有蓝图展示，不扩展 Agent 业务正式规范的实施范围。
- 检查周期：本轮实施完成、定向检查通过，累计 1/3；下次普通小轮为 2/3，第 3 个完成轮收口时必须进行完整回归及独立综合审查。计数按已完成的授权小轮，不按提交 / 重试 / 同轮返工递增；高风险提前扩大检查时另记原因与计数处理。
- 排版决定：章节 20/30、中文小节 16/24、小节索引 / folio / 图注编号 12px，使用既有语义角色；章号保留默认 48×48 墨底块与 stat-display 24px / 500 字形。标题组间隔 12px，小节线 1px，章节沿用结构墨线。普通章节用 SECTION，真实图纸才用 SHEET，窄屏 folio 换行，中文不缩字。
- 字体实值：Geist Mono 官方 1.4.2，固定提交 `4d655731f83507f0258ce5541c297b6553d5d081`，OFL-1.1；本地 400 / 500 WOFF2 分别 10768 / 11048 字节，每份 204 码点、321 glyph。family 为 Geist Mono Blueprint，swap，回退既有 font-mono；仅用于章号 / 索引 / folio / 英文短标签，中文 UI 与 STIX 数学路径不变。两份资源及许可 SHA-256 已核对，完整实值见主题正文与 public/fonts/blueprint/manifest.json；Builder 的子集 --check 字节复现通过。
- API：既有封装增加 BlueprintSectionHeader 的显式 code / folio kind，Sheet 原 props 保持兼容，只有 Sheet 生成框线 / 标尺；BpMinor 增加可选 code / label / headingLevel，label 缺省回退 children，id / className 保留；BpFigCap 仍为段落。API 已按源码及本轮定向测试核对。
- 实现与文档：唯一 Builder 调整既有章节 Header / BpMinor / 字体；本轮原位更新 AGENTS、开发工作流、typography、component-contracts、本主题正文与状态。冻结 coss、核心主题、公共字号角色、品牌原色及业务布局保持原边界，不增目录条目或规划副本。
- 本轮工程：[专项记录](evidence/editorial-20261016/engineering.json) 为 TypeScript 0 错误、Typography 308 文件、组件 / API 10/10、字体资源检查及子集字节复现通过；其时间为结果汇总时间。按已批准 1/3 节奏，本轮未运行全量工程测试或上轮完整组件交互矩阵。
- 本轮浏览器：[browser.json](evidence/editorial-20261016/browser.json) 覆盖 1280px / 320px，6 个章节 Header、18 个分节标题，所有 folio 可见，尺寸和窄屏换行符合角色；Chrome 实际字体查询确认 Regular / Medium、中文系统字与 STIX 数学字形按用途命中。正常两字体 loaded，隔离上下文阻断两文件后为 error，320px 回退仍可读且无页面横溢；四主题普通 body / Input 与[改动前](evidence/editorial-20261016/before.json)属性相等，InputGroup 整组焦点保持。人工截图核对及精确边界见[定向检查](evidence/editorial-20261016/checks.md)。
- 偏差处理：首次字体 CSS 二层导入造成开发页 500，已改 theme 同级导入并重启唯一服务后恢复 200；最终证据来自修复后的页面。没有以缓存中的 0 字节资源计时冒充字体文件体积。
- 审查与发布：[独立轻量 Review](evidence/editorial-20261016/review.md) 结论为 PASS WITH NOTES；guide 同步校验与最终生产构建仍是发布门槛。生产构建在文档与 guide 冻结后执行，结果记入 PR / 最终部署记录，不为回填本文重复构建；不预写构建、提交或 Site 发布成功，第三轮综合审查不替代当轮门槛。
- 历史基线与限制：最近完整回归记录为通用组件第二批的 1949 项 / 1688 通过 / 261 既有失败，无新增失败，见下方历史及对应证据；该结果不转记为本轮通过。真机、读屏器、实体打印、原生缩放及所有语言 / 状态组合不得在未实测时宣称通过。

### 蓝图配色规则与通用组件第二批 · 2026-10-16（原当前，原样保留）

- 轮次：蓝图配色规则与通用组件第二批 · 2026-10-16；开工基线 `2865942bb755efaa516a0f6f4252cdf79b4b1969`，Site v121；任务分支 `feat/blueprint-common-batch-two`，开工工作树干净。
- 授权：用户于 2026-10-16 批准蓝图配色规则和第二批 12 类实施。范围为 InputGroup、Combobox、ToggleGroup、Progress；Menu、Popover、Tooltip、Toast；AlertDialog、Sheet、Skeleton、Empty。保留首批和原蓝图样板，Agent 业务页面与布局继续暂缓。
- 配色决定：延续纸墨与 `#1D5FBF` 交互蓝，保留成功 / 警告 / 错误的独立语义及前景背景配对；品牌原色 `#339FF2` / `#E0438F` / `#C2F25B` 与品牌标识保持不变。AI 来源需真实来源依据与可读标识，品牌渐变不表达正确性、进度或完成。
- 兼容澄清：既有教材封面及 DialogLayout 装饰复用 `--brand-ai-gradient`，变量名不赋予教材或对话框 AI 来源语义。仅原位澄清 `docs/foundation-tokens.md`、`docs/component-contracts.md` 与 `docs/blueprint-theme.md`，不改业务源码、公共令牌 / API、不全仓重命名，不扩展新渐变装饰范围。
- 实现边界：复用固定 coss 与 Prism，只在蓝图范围调整样例相关几何和语义配色使用，几何覆盖继续排除嵌套核心预览根、后代及伪元素；浮层核对真正 Portal 宿主。针对矩阵发现的派生值继承问题，仅在涉及 Blueprint 的真实预览边界重绑既有 `--radius-lg` / `--radius-md` / `--color-muted`，使核心预览恢复自身令牌，夹具补 `text-foreground`；不新增公共令牌或改变普通核心全局主题。冻结 coss、品牌资产、依赖、组件目录与轻量 Blueprint v0.4 保持原边界。
- 复用依据：已核对 12 类固定 coss 及 actions / overlays / feedback、本地 input / selection / dialog particles。另下载并阅读全文的官方 particles 共 14 项，来源 URL、依赖与文件散列见[复用记录](evidence/batch2-20261016/reuse-sources.json)，不发布上游全文。实际复用 coss、Prism Button / QuestionMath 与组合结构，Toast 沿用现有私有 manager 属性，Sheet 使用真实 MathML；不复制演示计时器、远程 avatar 或任务成功事实。历史 registry 缓存仍不存在，不声称穷举完整上游；此轮不新增 Agent 执行组件或公共 API。
- 第二批浏览器：[交互](evidence/batch2-20261016/interactions.json) 47/47；[矩阵](evidence/batch2-20261016/matrix.json) 223/223，包含四主题 × 320px / 768px / 1280px 共 12 组布局、11 个真实浮层情景、6 组双向局部主题比较，记录内对应属性全部相等。覆盖所展示的输入、选择、错误、禁用、键盘、焦点、通知、确认取消、Sheet 长内容与减少动态效果；不称全部状态已验。
- InputGroup 追加修复：[焦点实测](evidence/batch2-20261016/focus.json) 正常 / 错误 / 只读三类与独立清除按钮通过；旧会话 1280px 整组 439px、内部 386px / 411px，外层 2px 蓝色 outline / 2px offset，内层 outline / shadow 为 none，错误红边保留。[旧会话 320px 复验](evidence/batch2-20261016/routes.json) 整组 246.67px，焦点包住完整组合；旧尺寸不冒充干净环境结果。
- 干净浏览器复验：[fresh-focus.json](evidence/batch2-20261016/fresh-focus.json) 的 1280px / 320px 下，innerWidth、文档和 body 的 clientWidth / scrollWidth 均等于视口；html / body zoom 为 1、DPR 为 1、visualViewport.scale 为 1。整组分别为 446.5px / 246px，保持完整 2px 蓝色焦点线；仅既有 Tabs 局部横向滚动，无文档级横溢。320px 截图已替换为本次证据。
- 第一批与原样板回归：[首批交互](evidence/batch2-20261016/first-interactions.json) 31/31；[首批矩阵](evidence/batch2-20261016/first-matrix.json) 12 组布局与 8 个真实浮层，局部比较全部相等，CSS zoom 2 通过。[原按钮](evidence/batch2-20261016/first-hover.json) 四主题 × 320px / 1280px 共 8 情景通过，8 个原按钮均保留，蓝图主行动对比度 17.76:1。核心三主题 Progress [修改前后](evidence/batch2-20261016/core-comparison.json)完全一致。
- 正式路由：[第二批 12 页 × 320px / 1280px](evidence/batch2-20261016/routes.json) 共 24 次访问返回 200、真实样例存在且无页面横向溢出；具体交互以夹具记录为准，截图索引见[检查记录](evidence/batch2-20261016/checks.md)。
- 工程检查：数学字体、语义字号（308 个 owned TSX）、TypeScript 与最终生产构建通过，Blueprint 专项最终 39/39。全量首次 Windows 沙箱为 1923 / 1661 / 262，额外失败为 symlink EPERM；正常权限复跑为 1949 / 1688 / 261。随后 release 中间结果为 1949 / 1686 / 263，[新增两项](evidence/batch2-20261016/release-failure-delta.json)仅因文档生成物未同步。最终生成后重新构建并复跑为 1949 项 / 1688 通过 / 261 既有失败，两项生成物失败已消除，[最终失败描述集合](evidence/batch2-20261016/complete-failure-delta.json)与上一轮 hover 相同，new=[]、removed=[]；不声称全量通过。[命令、时间与退出码](evidence/batch2-20261016/engineering.json)已归档。
- 审查与当前进度：[独立 Review](evidence/batch2-20261016/review.md) 最终结论为 PASS WITH NOTES，正式放行；源码、浏览器与最终工程条件已满足。最终结果回填仅改说明与证据，规范 guide 和下载资源重新生成并检查 hash。发布提交 SHA、PR 与 Site 版本以实际合并和发布终态为准，不预写发布成功。
- 未验：真机、读屏器、实体打印、原生 200% 缩放、全站像素回归与未展示的状态组合；CSS zoom 2 不代替原生缩放。未知进度不补为 0，Toast / Empty / Skeleton 不制造业务事实；Sheet 真实 MathML 样例不等于全部公式与 Agent 业务场景已验收。第四主题保持候选状态。


### 主行动按钮悬停可读性修复 · 2026-10-15（原当前，原样保留）

- 轮次：主行动按钮悬停可读性修复 · 2026-10-15；基线main / 本地 / Site v120均为 `6cbbe50532495b7c1ca0b9d6b7bee9ed54e8b919`。
- 用户问题：悬停文字不清楚，以及原蓝图按钮是否被取消。原样例未删除，仅被新增基础组件下推；在顶部补两项导航入口。
- 实现：仅修正blueprint.css现有primary hover背景/文字成对令牌，demos/blueprint.tsx补锚点。原主/次/小/危险/禁用样例完整保留；不改coss、API、依赖或核心令牌。
- 浏览器：四主题×320/1280，primary默认/hover/hover加焦点/按下均可读；蓝图17.76:1，其他主题最低13.92:1。次要/危险hover、禁用与减少动态效果通过定向检查；入口实际跳转成功。见 [浏览器测量](evidence/hover-20261015/browser-results.json)。
- 工程检查：构建、类型、数学字体、307文件字号通过；Blueprint39/39；全量1949/1688通过/261既有失败，无新增或消失。见 [验收和独立审查](evidence/hover-20261015/checks.md)。
- 独立Review：PASS WITH NOTES，无阻断。规范原位更新并重新生成；PR合入后用同一main提交发布Site，最终SHA与版本以部署记录及会话终态为准。
- 限制：只验本组按钮及导航；全站布局、真机、读屏器和原生缩放不在本轮完成声明中。

### 通用基础组件 Blueprint 首批 · 2026-10-15（原当前，原样保留）

- 轮次：通用基础组件 Blueprint 首批 · 2026-10-15；开工基线 `55f25df36af5a8aaaa2374fed0427d9379b501e2`，Site v119。开工工作树干净。
- 授权：用户在本会话明确“同意。批准，开始实施”。首批限定 Button、Input、Textarea、Select、Checkbox、RadioGroup、Switch、Tabs、Card、Badge、Alert、Dialog 共 12 类现有通用组件；Agent 业务页面与布局暂缓。
- 实施范围：`app/(next)/next/blueprint.css` 的主题适配，`components/prism-next/blueprint-foundation-demo.tsx` 对照夹具及现有蓝图示例页接入，本文件和 `docs/blueprint-theme.md`、规范生成物及直接证据；`.gitattributes` 为本轮证据限定 LF。不新增组件目录、公共 API、依赖或业务流程；冻结 coss 与核心三主题保持原意，轻量 Blueprint v0.4 不扩入第四主题适配。
- 设计边界：沿用现有语义字号与主题令牌，区分结构线、次级分隔线、静态表面和真实操作；Radio 保留圆形。只读、禁用、加载、错误分别表达；选中态由真实属性驱动。墨底焦点保留分隔层，标尺保留上一轮 14px / 10px 及其限定例外。
- 复用核对：已读取固定 coss `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7` 的 12 类源码及 Prism Badge 适配；读取本地 `selection-particles.tsx`（p-select-6 / 18 / 7 / 21）、`dialog-particles.tsx`（p-dialog-5 / 4）、`input-particles.tsx`（p-input-group-22）和 forms / navigation / feedback 组合。历史 registry 与 p-tabs-1 缓存当前不存在，只复核 [v7 已归档检索摘要](evidence/v7/reuse.json) 和 [v8 记录](evidence/v8/inspection.md)，未联网刷新或复制新第三方代码。通用基础组件主题适配不涉及 Beautiful UI 的 Agent 执行组件新增。
- 交互边界：复用 coss / Base UI 的键盘、焦点、受控状态与 Portal；夹具只管理可逆输入、选中、开合状态，不复制模拟保存计时器或产生业务完成回执。
- 已实现修正：Input / Textarea 外层边框、单一焦点与错误色；Select 实际弹层表面；Checkbox indicator 方角与已选错误红色内描边；Switch 关闭状态；CardFrame 裁切；下划线 Tabs；Dialog 底部方角。320px 下本样例激活 Tab 的外侧焦点靠近裁切边缘，已限定在基础组件夹具内改为内侧 2px 蓝线加纸色隔离；[稳定采样](evidence/common-20261015/final-focus.json) 确认 active / focus-visible 均为 true、outline 2px、offset −3px、纸色 inset 4px，最终截图已目视复验。此记录替代路由快照中尚未结束的投影过渡值。
- 真实交互：[31 项检查](evidence/common-20261015/interactions.json) 全部通过，涵盖输入校验及错误清除、只读 / 禁用、Select 键盘 / Escape、Checkbox / RadioGroup / Switch、两种 Tabs、Dialog 初始焦点 / 校验聚焦 / 内 Select 关闭 / 焦点限制 / 关闭返回、本页卡片更新及静态状态文字。禁用 Tabs 可获焦点但不能激活，沿用实际 Base UI 行为；不写成所有禁用项均跳过焦点。没有以这 31 项宣称所有变体和状态组合通过。
- 四主题矩阵：[matrix.json](evidence/common-20261015/matrix.json) 中 light / paper / dark / blueprint × 320px / 768px / 1280px 共 12 组均展示 12 类样例，无页面横向溢出。Dialog 和内部 Select 挂在同一主题容器内；三个核心全局主题与全局蓝图内对应核心预览的 radius / background / color / border / shadow 逐项相等；全局 light 内显式蓝图的反向对照相等。结论限定这些浮层和属性，不外推到所有 Portal 宿主或全站像素。
- 正式路由：[routes.json](evidence/common-20261015/routes.json) 记录 12 类组件页及 InputGroup 回归页 × 320px / 1280px，共 26 次访问均为 200 且无页面横溢；InputGroup 内部无样式控件保持 border 0，并追加 Checkbox 错误内描边和 Dialog 底部方角测量。Dialog 开合行为以上述真实交互为据，不能仅从路由 HTML 推定已验。
- 打印与缩放：Select 打印媒介投影检查为 none；未做原生打印预览或实体输出。CSS `zoom: 2` 截图及测量无页面横溢，但 Ctrl++ 未改变 viewport / DPR，原生浏览器 200% 缩放仍未验证。
- 工程初跑：math-font 通过，typography 307 个 owned TSX 通过，生产构建与 TypeScript 通过。全量 1949 项 / 1686 通过 / 263 失败：其中 2 项为规范更新后尚未同步生成物；其余 261 项与标尺轮既有失败描述相同。Blueprint 初跑 39 项 / 37 通过 / 2 项同类生成物失败；同步后复跑：数学字体、307 文件字号、生产构建、TypeScript 均通过，Blueprint 39/39 通过；全量 1949 / 1688 通过 / 261 失败 / 0 skipped，与标尺基线失败描述集合完全一致，无新增或消失，详见 [检查记录](evidence/common-20261015/checks.md) 和 [失败集合对照](evidence/common-20261015/final-failure-delta.json)。不宣称全量通过。
- 文档与证据：范围、复用依据、当前实际样例和未验边界已原位更新；[起点测量](evidence/common-20261015/before.json) 及截图目录 `docs/blueprint/screens/common-20261015/` 已保存。规范 JSON 与下载资产已同步。[独立审查](evidence/common-20261015/review.md) PASS WITH NOTES，无阻断。按已授权流程合并 PR 后，以同一 main 提交构建并发布 Site；最终 SHA 与版本以部署记录和会话终态为准，不在自身源码中预填未来发布信息。
- 未验范围：真实 MathML 公式、系统剪贴板复制、长正文 Dialog、已选错误 Radio、全部变体 / 状态组合、原生 200% 缩放、真机、读屏器、完整对比度审计、实体打印、全站像素回归及 Agent 业务场景。历史 v9 与标尺轮结果不当作本轮验证，第四主题继续为候选。


### 外侧标尺密度微调 · 2026-10-15（原当前，原样保留）

- 轮次：外侧标尺密度微调 · 2026-10-15；基线 GitHub main / 本地 / Site v118 均为 a36acadade4068a21f5bc9a0336d9714a812450f。开工工作树干净。
- 授权：用户明确要求降低外侧标尺宽度、减小字号，并授权自行决定数据与实施；本轮仅以此允许装饰坐标的局部10px字号例外。
- 运行时范围：blueprint.css。蓝图标尺18→14px，数字12→10px / 行高1，内框及四边同步；rem随根字号缩放。正文、内容留白、核心主题、冻结coss与依赖保持不变。字号检查仅新增完整选择器、aria-hidden、文件路径和精确声明的单条例外，并由独立最小仓库执行测试证明其他局部字号与失去隔离的规则仍被拒绝。
- 真实浏览器：四主题 × 320/1280px；蓝图1280的标尺14/10px，320隐藏；核心三主题与双层核心预览保留18/12px；根字号放大25%后为17.5/12.5px，数字无裁切。见 [测量](evidence/ruler-20261015/browser-results.json) 与 docs/blueprint/screens/ruler-20261015/。
- 文档：原位更新蓝图规范、当前状态并重新生成站点正文及证据下载。检查结果见 [本轮验证](evidence/ruler-20261015/checks.md)。发布按任务PR合入main后将同一提交同步到Site；最终版本以部署记录和会话终态为准。
- 独立审查：PASS WITH NOTES，无阻断；[审查记录](evidence/ruler-20261015/review.md)。构建、类型、字号与39项蓝图测试通过；全量1949项中1688通过、261失败，失败集合与输入基线一致。
- 未验范围：真机、读屏器、实体打印及全站像素回归。本轮是已批准的装饰调整，不改变第四主题候选状态。

### 三方同步 · 2026-10-15（原当前，原样保留）

- 轮次：三方同步 · 2026-10-15。用户明确要求将 Site、GitHub 与本地同步。
- 输入基线：GitHub main 1f575ea；Site v117 / c59c0ca；本地第一批完善 74790e7。共同祖先为 5ba6277。
- 合并范围：保留 GitHub 第四主题与图表更新，导入 Site 轻量 Blueprint v0.4、MIT 许可和实验历史，同时保存本地第一批完善、规范全文与证据。
- 冲突处理：保留第四主题侧栏和规范页示例入口；生成的 JSON 与实验说明下载文件从合并后的源文档重新生成。两条蓝图实验不互相替换。
- 跨系统一致性：仅将规范直接引用文本及下载快照限定 LF，避免 Windows CRLF 改变来源 SHA-256；没有修改冻结 coss 或依赖。
- 同步流程：任务分支经 PR 合入 GitHub main，再由相同 Git 提交更新 Site 并发布，本地回到 main。发布结果以会话终态与 Site 部署记录为准。
- 本轮实际检查、结果和限制见 [同步验证](evidence/sync-20261015/checks.md)。历史 v9 结果保留，不作为本轮全量测试通过依据。
- 第四主题仍为候选；真机、读屏器、实体打印等未验范围继续保留。

### v9 · 来源提炼后第一批完善与站点规范入口 · 2026-10-15（原当前，原样保留）

- 轮次：v9 · 来源提炼后的第一批完善与站点规范阅读入口。
- 日期 / 基线：2026-10-15，GitHub main 1f575ea；工作分支 docs/blueprint-source-audit-20261015。用户在本会话明确批准执行，并要求将《Foundations · 第四主题「蓝图」》记录到智能曜彩站点。
- 本轮范围：现有样板的容器布局、标题层级、禁用态、墨底焦点分隔层、静态卡片与示例动作语义、长中文与公式阅读；规范原文生成站内页面、目录和直接证据下载。冻结 coss、依赖和核心三主题 Token 未改。
- 站点边界：以线上 v116 的 Site 源码为基线，仅添加规范页面及导航。Site 现有三主题和轻量 Blueprint v0.4 保留；GitHub 第四主题运行时修改仍在本地工作分支，不能从文档发布推断主题已经部署。
- GitHub 工作分支尚未提交或推送；Site 文档发布由独立 Site 源码流程保存。上线版本和地址以会话发布结果为准。

### 实现与浏览器验收

- 标题采用章节语义字号；两列与双框按内容容器宽度重排，320px 去除外层装饰，长标签可换行。
- 禁用按钮、工具和分段项不产生悬停/按压动作反馈；固定数据明确标注为样例，移除模拟业务推进，静态卡片不伪装可点击。
- 蓝图墨底主行动、选择项及面板链接采用 2px 白纸色分隔层与 2px 蓝色外框；真实键盘焦点稳定后计算值与截图一致。
- Chrome 桌面视口模拟：light/paper/dark/blueprint × 320×800、1280×960，页面 scrollWidth 均等于 viewport。并非真机或全站像素回归。
- Home/End 到首项「全部」和末项「异常」，焦点外框均留在滚动边界内；禁用「主行动不可用」按下前后的背景、文字、边框、投影和位移一致。
- Tabs 方向键只移动焦点，Enter 才激活；长公式自身 248px/327px 横滚；规范表格自身 280px/512px 横滚，页面仍为320px。
- 双层核心预览 DOM/CSS 夹具的字体、颜色、圆角和外框与单层对应预览一致；未据此声称 React Theme Context 或读屏器通过。
- 浏览器记录：[browser-results.json](evidence/v9/browser-results.json)；截图目录 docs/blueprint/screens/v9/。独立代码审查为 PASS WITH NOTES，无阻断问题；上述浏览器复验补齐其主要待验项。

### 验证与限制

| 检查 | 本轮结果 |
| --- | --- |
| 字体与语义字号 | math-font 通过；306 个 owned TSX 通过。Windows CRLF 导致的 attachment 例外匹配先恢复该文件 Git LF，内容 diff 为空 |
| Vinext build | 通过；见 [build.log](evidence/v9/build.log) |
| TypeScript --noEmit | 通过；见 [tsc.log](evidence/v9/tsc.log) |
| Blueprint 与规范页定向测试 | 37/37 通过；见 [实际运行记录](evidence/v9/targeted-blueprint-checks.json) 及 [测试日志](evidence/v9/targeted-blueprint-tests.log) |
| 全量测试 | 1947 项，1686 通过、261 失败；不得引用历史 2034/2034 作为本轮结果 |
| 失败调查 | Windows 路径过滤、CRLF 字节、ESM 子路径及虚拟文件匹配问题；代表性 HEAD 基线复现见 [分析](evidence/v9/windows-test-analysis.md)。未逐项解决261项失败 |
| 文档安全同步 | 来源hash、资源字节、路径边界与恶意协议检查通过；最终发布源需再运行 sync --check |

本轮完成第一批，整体仍为候选状态。后续按规范的阶段3—5继续检查密集数据、打印与真实教师场景。真机、触摸、读屏器、实体打印、全站像素回归及全部历史测试的Windows适配未完成；本轮不据此批准第四主题全站发布。

### v8 · 打印图案密度与可访问性工程检查 · 2026-10-14（原当前，原样保留）

- 轮次：v8 · 打印图案密度与可访问性工程检查；Builder 实现与自测完成；Supervisor 浏览器验收结论 `PASS WITH NOTES`。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `efe001ff6eaf3b228c41e5873fe22b9e3c4587ea`（含 BPv6 / BPv7）。授权依据：Supervisor `task-BPv8.md` 记录 PO 指示继续第 3 项“实体黑白打印时的图案密度、真机、读屏器验收”；本环境只做工程检查。
- 工作树：开工干净，沿用当前分支；未提交、推送、联网、创建 PR、启动服务或发布。其他 P 系列图表、coss、AGENTS、核心三主题 Token、依赖及既有测试均未改；[保护核对](evidence/v8/integrity.json)。
- 运行时范围：`app/(next)/next/blueprint.css`、`lib/prism-next/chart-palette.ts`；新增 `tests/blueprint-print-a11y.test.mjs`；本文与 `docs/blueprint/evidence/v8/`。[实际 diff](evidence/v8/scope.diff)。
- 原“当前”正文连同日期、基线、Supervisor 记录原样移入历史；开工快照见 [status-before.txt](evidence/v8/status-before.txt)。

### 修复与工程检查

- 打印仅作用于 blueprint 并排除嵌套核心预览根、后代及伪元素：清除 body / 预览根 / SidebarInset / 卡片缩略图网格和已知硬投影（含 ECharts SVG filter）；保留边框墨线与 TitleBlock 结构分隔线，数据纹理请求 exact 打印。
- 六系列保留实底、−45° / +45° 斜线（2px 线 / 4px 间隙）、2.4px 点径 / 8px 点阵、横 / 竖条纹（3px / 3px）。仅把图案白色 alpha 统一提高到 .8，图案/默认底色比值从部分不足 3:1 提高为 11.61、4.31、3.76、3.33、3.76:1。色相相近灰度用纹理方向和密度补充；不声称实体打印已能辨认。
- 蓝图焦点统一为既有 #1D5FBF、2px 外框、外偏移 2px；分段控件加 4px 留白避免外框紧贴滚动裁切边缘。核心三主题保持原样；浏览器复验仍须检查首末项及横向滚动。
- 四主题实际 React SSR 检查 Blueprint 具名 section、radio、步骤、数值替代文本、反馈角色，Tabs 关联面板及禁用态，热力图 details/table/零值/缺测。只替换 useTheme 值，未替换 EChart 或控件。三个正式路由由本轮构建 worker.fetch 返回 200；SSR 无真实主题切换或键盘证据。
- 蓝图正文 / 次要 / 链接在 #F6F6F3 上分别 16.40 / 7.25 / 5.64:1，在白卡片上 17.76 / 7.85 / 6.10:1；焦点分别 5.64 / 6.10:1，墨线亦 ≥3:1。四主题正文类令牌均 ≥4.5、焦点 ≥3；详见 [令牌计算](evidence/v8/contrast.json)。
- 完整线距、角度、点密度、灰度亮度差、离线 coss / particles 检索依据、SSR 解释与局限见 [工程检查](evidence/v8/inspection.md)；[同底灰六纹理 SVG](evidence/v8/six-textures-equal-grey.svg) 是 ECharts SSR 夹具，不是浏览器或打印截图。
- 偏差：没有设计 patch，按任务手动适配；不联网刷新 registry。没有修改共享表格语义、三核心主题或 P 系列实现。Builder 自测不等同于 Review / PO 批准。

### 本轮验证

按 §6.1 顺序，先构建后全量测试；README 对应运行目录变量位于 `.sites-runtime/`，保留进程 HOME。所有结果来自本轮代码，[命令与退出码](evidence/v8/checks.json)。

| 命令 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 字体与许可通过，退出 0；[日志](evidence/v8/math-font.log) |
| `node scripts/check-typography.mjs` | 304 个 owned TSX 通过，退出 0；[日志](evidence/v8/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；既有 chunk 大小、静态路由分类提示；[日志](evidence/v8/build.log) |
| `node --test tests/*.test.mjs` | 2034/2034，fail 0，skipped 0，退出 0；[日志](evidence/v8/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 条诊断，退出 0；[日志](evidence/v8/tsc.log) |
| `node --test tests/blueprint-print-a11y.test.mjs` | 11/11，fail 0，skipped 0，退出 0；[日志](evidence/v8/targeted-tests.log) |
| 浏览器证据 | 见下方「Supervisor 浏览器验收」 |

### Supervisor 浏览器验收（2026-10-14，5173，`/next/foundations/blueprint`）

- 打印模拟方法：把页面全部 `@media print` 规则（共 28 条）取出，作为无 media 条件的样式注入后再读取计算样式。这不是浏览器原生的打印预览。
- 通过（blueprint）：body 背景从 40px 网格渐变变为 none；bp-* 元素的非 none 投影从 2 个变为 0；`.bp-btn` 墨线仍为 1.5px。
- 通过（light，1280 iframe）：注入打印规则前后，前 3000 个元素的背景、投影、外框、边框计算值完全一致，核心主题打印输出不变。
- 未验：浏览器原生打印预览与灰度预览、六系列纹理的实际打印辨识、实体打印、真机、读屏器；焦点环裁切、Home / End 仅靠 Builder 的 SSR 检查。
- 本轮附带的屏幕变化：蓝图六系列纹理的白色 alpha 统一为 .8，影响蓝图屏幕显示，不只影响打印。
- 待 PO / 设计决定（来自 Builder 报告）：蓝色焦点环在墨底上对比度约 2.91:1，是否加分隔层；BpSizeBar 纯色填充是否另配图案。

### 交给 Supervisor 的浏览器验收清单

使用已运行服务，以下基址为 `http://localhost:5173`。light / paper / dark / blueprint × 320×800、1280×960；截图记录主题、视口、路由、日期与上述基线，存入 `docs/blueprint/screens/v8/`，本轮未预建空目录。

1. `/next/foundations/blueprint`：Tab 到按钮、图标工具、卡片、“替换本页”及链接；蓝图浅底上的焦点为 2px #1D5FBF，偏移 2px。检查墨底面板上的焦点可见性（见待定项）。`#actions` 方向键 / Home / End 移动“答卷状态”，跳过“已锁定”；末项“异常”说明为“当前：4 份未提交或扫描失败”，首末项外框不得被横向滚动容器裁掉。补验长中文和公式。
2. `/next/components/tabs`：键盘聚焦“内容”，→“材料信息”→“历史记录”，Enter / Space 激活；显示“当前为初始示例版本，尚无修订记录。”；禁用项不激活，焦点滚动可见，320px 仅标签行横滚。三核心主题原焦点与视觉保持不变。
3. `/next/components/evidence-matrix#compact-heatmap`：点第一格保留“运算求解 · 基础”“0”，第二行第三列显示“推理论证 · 综合”“缺测”；蓝图窄容器隐藏格内数值但保留提示和完整数据。Tab 展开“查看数据与选择项目”，进入“查看”按钮，核对按键意图及行名，不把内部 ID 当作已通过读屏体验。
4. **打印模拟（emulate print media）**：上述 3 页在 blueprint 应无 40px 页面网格、20px 缩略图网格及偏移硬投影；1.5px 墨线、数据图案、TitleBlock 内分隔线保留。检查背景图形开 / 关、灰度预览及 100% 缩放；核心三主题打印前后对照开工基线，不应受到本轮覆盖。
5. 同底灰六纹理夹具 [SVG](evidence/v8/six-textures-equal-grey.svg)：在浏览器打开，再对照实际 ECharts 六系列柱 / 面积（可用 v4 归档夹具临时挂载，需记录路由）；仅凭实底、斜线方向、点阵、横竖纹应可对应系列。小图例、窄柱、薄面积须另验，不以此文件代替当前真实图表集成验收。
6. 嵌套预览：全局 blueprint 内放 light / paper / dark 预览根，含按钮、卡片、伪元素；screen / print 各检查核心根与后代的背景、投影、焦点不被蓝图规则覆盖。反向核心主题内的显式 blueprint 预览也检查。此项只验证 CSS，既有 next-themes Context 不随 DOM 属性变更的图表限制保留。

### 未验证范围与待决定

- 浏览器验收：按分工由 Supervisor 执行。**真机、读屏器、实体打印未验**；本轮无浏览器截图，不能用 SSR / CSS 源码断言代替视觉或交互验收。
- 待 PO / 设计决定：固定蓝色焦点在墨底 #16181D 上仅约 2.91:1，深色表面是否采用分隔层；共享 DataRecordTable 内部 ID 操作名及选择状态的语义约定；若要覆盖 BpSizeBar 多个纯色填充，须另定纹理映射。未擅自扩展本轮实现。
- 六系列纹理结论只适用于既有 ECharts 填充图案；不覆盖 Recharts 无纹理图、无填充折线 / 散点、热力图连续色阶、调用方自定义色、透明面积及小图例的实体可读性。

### v7 · Tabs 320px 横向溢出 · 2026-10-14（原当前，原样保留）

- 轮次：v7 · Tabs 320px 横向溢出；Builder 实现与自测完成，Supervisor 浏览器验收结论 `PASS WITH NOTES`（见下方「Supervisor 浏览器验收」）。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `46303a46304955276af030c5059613096ef3be3f`（含 BPv6 `190f15d` 与 P64）。授权依据：`task-BPv7.md` 记录 PO 指示“继续做第 2 项 Tabs 溢出”。
- 工作树：开工干净，沿用当前分支，不提交、推送、建 PR、启动服务或发布。P64、固定 coss、AGENTS、核心三主题 Token、依赖和既有测试均未改；[保护核对](evidence/v7/integrity.json)。
- 范围：`components/prism-next/demos/navigation.tsx`、`components/prism-next/blueprint/blueprint.tsx`、内部布局 hook `components/prism-next/use-horizontal-choice-scroll.ts`、`app/(next)/next/blueprint.css`；新增 `tests/tabs-overflow.test.mjs`；本文、`docs/blueprint-theme.md` 与 `docs/blueprint/evidence/v7/`。[实际运行时 / 测试 diff](evidence/v7/scope.diff)。

### 根因、修复与边界

- 正式路由 `/next/components/tabs` 的第一组四个 coss Tab 使用 w-fit / shrink-0 / whitespace-nowrap，示例区没有滚动边界。Supervisor 修复前记录 light scrollWidth=339、末项“已锁定”right=337，历史 blueprint=342；这是标签行溢出，非面板内容。代码行号、[前](evidence/v7/tabs-before.html) / [后](evidence/v7/tabs-after.html) SSR 与完整定位见 [inspection.md](evidence/v7/inspection.md)。
- 两组 Tabs 只增加局部滚动包装，面板留在外侧，核心视觉与尺寸保留。内部 hook 在焦点、选中值、容器 / 标签尺寸变化时调整局部 scrollLeft，不移动页面或主动聚焦；方向键只聚焦、Enter / Space 激活仍由 coss / Base UI 控制。
- 两个 Agent 示例已有局部滚动包装，SSR 确认后保留原文件。bp-seg-tabs 原为换行，水平版本改为单行滚动；纵向布局及 radio 方向键选择契约保留。仅修改显式 bp-* 布局，不新增普通控件视觉覆盖、目录条目、Token、字号或依赖。
- 离线检索 coss 缓存 registry 的 tabs / p-tabs-1…15 描述，读取 p-tabs-1 源码；无已确认的现成滚动组合，沿用本地 Agent 示例外层滚动方式。未联网刷新，没有复制第三方代码；[检索摘要](evidence/v7/reuse.json)。
- Toast：源码和构建 CSS 为 fixed / right inset / 合法 calc 宽度，未确认它独立计入页面溢出；SSR 无法测量客户端 Portal。没有据假设覆盖 Toast，待 Supervisor 做临时隐藏前后 scrollWidth 对比。
- 偏差：无设计 patch，按任务手动适配；只读离线检索代替联网，浏览器按前置约定交 Supervisor。没有新增待 PO 决定项。Builder 自测不是 Review 或视觉验收结论。

### 本轮验证

按 §6.1 顺序，构建后全量测试；README 对应运行目录变量位于 `.sites-runtime/`，保留进程 HOME。以下为最终代码的本轮结果，[命令 / 退出码](evidence/v7/checks.json)。

| 命令 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 完整字体与许可通过，退出 0；[日志](evidence/v7/math-font.log) |
| `node scripts/check-typography.mjs` | 304 个 owned TSX 通过，退出 0；[日志](evidence/v7/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；保留 chunk 大小与静态路由分类提示；[日志](evidence/v7/build.log) |
| `node --test tests/*.test.mjs` | 2023/2023，fail 0，skipped 0，退出 0；[日志](evidence/v7/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 条诊断，退出 0；[日志](evidence/v7/tsc.log) |
| `node --test tests/tabs-overflow.test.mjs` | 7/7，fail 0，skipped 0，退出 0；[日志](evidence/v7/targeted-tests.log) |

新增测试覆盖真实组件 SSR、两个 Agent 示例现有结构、Blueprint 横纵语义、局部滚动计算、长标签开头及宽容器无操作，并用构建 worker.fetch 验证正式路由 HTTP 200；不是源码正则或 SSR 替代视觉验收。初始测试 harness 的 next/link ESM 后缀、glimm CJS 导入问题已按既有测试的 ESM alias 方式修正；无最终失败需要干净基线复现。未修改既有断言。

### Supervisor 浏览器验收（2026-10-14，5173，浏览器面板 Viewport 模拟 320×800）

- 通过：`/next/components/tabs` 在 blueprint / light / paper / dark 下 `documentElement.scrollWidth` 均为 320（修复前 light 为 339）；临时隐藏 `toast-viewport` 前后都是 320，Toast 不造成横向溢出。
- 通过（blueprint）：焦点在「内容」时按两次 → 移到「历史记录」，局部滚动容器 scrollLeft = 22.5，该项完整可见；按 Enter 后 aria-selected=true。
- 通过：`/next/foundations/blueprint`（blueprint、light）和 `/next/components/agent-components`（blueprint、dark）在 320 下 scrollWidth 都是 320，其余越界元素都在局部滚动容器内。
- 未验：1280 像素级回归（≥640px 默认视觉只有 SSR 对比）、触摸横滚、Home / End、禁用项「已锁定」、嵌套预览、真机与读屏器。没有截图存档。

### 交给 Supervisor 的浏览器验收清单

使用 Supervisor 已运行服务（以下以 `http://localhost:5173` 为例），四主题 light / paper / dark / blueprint × 320×800 / 1280×960；宽屏另对照 ≥640px 原视觉。

1. `/next/components/tabs`：320px 时 `document.documentElement.scrollWidth` 应为 **320**，1280px 时应为 1280。两组保持单行，只有标签行可横滚，面板自然换行。横滚看“已锁定”，禁用状态不变；无第二行控件。页面宽度是待验期望，不是 Builder 实测。
2. Tab 进入“内容”，ArrowRight 到“材料信息”再到“历史记录”：焦点标签自动进入可见区，未按 Enter / Space 前不切面板；Enter 显示“当前为初始示例版本，尚无修订记录。”；Space 切换同样生效。检查禁用“已锁定”不能激活、左右回移及 Home / End、焦点环、下划线指示器、触摸横滚。
3. `/next/foundations/blueprint#actions`：水平“答卷状态”单行局部滚动，方向键按 radio 原语义选择，跳过禁用项；End 到“异常”，说明显示“当前：4 份未提交或扫描失败”。纵向“页面主题”布局不变。选末项后 1280→320 收窄应滚动可见；加入长中文 / 公式标签，单项过长时可滚动阅读且字号不缩小。
4. `/next/components/agent-components#context-summary-review`：展开“从任务依据到执行结果”的全部示例，已有七项标签局部滚动；`/next/components/agent-components/artifact-preview`：呈现与说明标签键盘移动可见、hash 切换回归。全局 blueprint 下预览区分别设置 light / paper / dark、320px，检查嵌套主题及滚动边界；不把已有预览固定宽度的局部滚动记作页面溢出。
5. Toast：记录内外视口宽度、scrollX、toast-viewport rect 与 computed inset / right / width；临时隐藏后还原 Toast，并比较页面 scrollWidth，应都为 320。若隐藏前超宽、隐藏后恢复，记录独立缺陷交 Prism 层修复。附实际主题、尺寸、路由、日期与基线截图。

### 未验证范围

浏览器验收：按分工由 Supervisor 执行。四主题真实像素、焦点 / 键盘 / 触摸交互、Toast 实际滚动贡献、移动设备、读屏器及全站视觉未验；本轮没有截图。核心三主题 ≥640px 默认视觉保持的判断目前基于 diff / SSR，不能记为浏览器通过。


### v6-R1 · Supervisor 返工与复验 · 2026-10-14（原当前，原样保留）

- 轮次：v6-R1 · Supervisor REWORK 返工；Builder 实现与自测完成；Supervisor 修复后复验结论 `PASS WITH NOTES`（见下方「修复后复验」）。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `7c2783346081ed23fd70ebb9414f0e879745a60c` + 原 v5 文档与未提交 v6。按 `task-BPv6-R1.md` 执行；原 PO “仅蓝图主题（推荐）”授权范围保持不变。
- 工作树：沿用现有分支及未提交改动，不提交、推送、创建 PR、发布或启动服务。AGENTS、v4/v5 归档与截图、冻结 coss 字节未变；P63 已提交内容未改动。本轮增量见 [scope.diff](evidence/v6-r1/scope.diff)，保护检查见 [integrity.json](evidence/v6-r1/integrity.json)。
- 范围：`components/prism-next/charts/echart.tsx`、`advanced-charts.tsx`、`components/prism-next/demos/polar-charts.tsx`、`lib/prism-next/chart-item-tooltip.ts`、`chart-description.ts`、`heatmap-labels.ts`、`tsconfig.json`、`tests/heatmap-tooltip.test.mjs`、`tests/heatmap-narrow.test.mjs`，以及本文与 `docs/blueprint/evidence/v6-r1/`。
- 本轮没有继续修改 v6 的 P57/P62 测试适配；没有新增组件、依赖、视觉令牌、字号或 CSS。HeatmapChart 公开属性不变，内部 EChart 新增默认关闭的 `preserveItemTooltip` 开关。

### 修复与影响

- 失败 1：热力图点按时先记录 seriesIndex / 稳定 item ID，再发出原选择意图。setOption 完成后，若该 ID 仍在该系列中，重新定位 dataIndex 并 dispatchAction showTip；支持宿主重渲染、selectedId 边框更新及数据重排，不缓存旧数值。项目删除则不恢复；hideTip、移开、悬停另一项、点空白或图外均清除记录，图外/空白点按主动 hideTip。无新增计时器，不重挂载实例。
- 恢复仅由 HeatmapChart 显式开启，四主题一致。其余 EChart 调用方仍执行原 setOption，不恢复提示框、不派发额外显示/隐藏 action；新增监听对未开启的调用方不改变交互。图表实例和 document 监听随卸载清理。
- 失败 2：确认 EChart 原规则为 label 后无条件追加“。完整数值及缺测说明见下方数据表。”。现统一规范 label 尾部标点；热力图窄屏只添加“窄屏下格内数值已隐藏，点按格子查看数值”，数据表指引由包装层追加一次。其余 EChart 的说明内容不变，仅去除重复尾部标点；label 改变也会更新说明。
- 失败 3：compact 示例改成“核心主题保留格内数值；蓝图主题在窄容器下隐藏格内数值，可点按查看。零值与缺测均保留在提示框和数据表中。”，沿用 DemoSection 的语义字号。
- v5 归档修正：`tsconfig.json` 的 exclude 仅增加 `docs/**/evidence/**`，避免历史夹具被作为运行时代码编译；不改 `docs/blueprint/evidence/v4/fixture.tsx`，不关闭任何运行时代码类型检查。
- 离线复用：沿用现有 HeatmapChart / EChart 与 ECharts dispatchAction；复核 `docs/polar-charts.md`、`docs/learning-chart-properties.md` 的 coss / particles p-table-3/4 记录，基础控件组合不处理引擎更新生命周期。未新增第三方代码、未联网刷新 registry；通用图表修复不涉及 Beautiful UI Agent 组件。
- 偏差：直接按 Review 手动修复，没有设计 diff 可应用。未采用仅 memo option 的方案，因为实际 selectedId 改变仍须重绘。主题取值与嵌套 DOM 预览的 Context 限制沿用 v6，未扩大范围修复。

### 本轮验证

按 §6.1 顺序执行，先构建后全量测试；使用 `.sites-runtime/` 环境目录并保留进程 HOME。实际命令和退出码见 [checks.json](evidence/v6-r1/checks.json)。

| 命令 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 字体与许可通过，退出 0；[日志](evidence/v6-r1/math-font.log) |
| `node scripts/check-typography.mjs` | 303 个 owned TSX 通过，退出 0；[日志](evidence/v6-r1/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；保留 chunk 大小、路由静态分类提示；[日志](evidence/v6-r1/build.log) |
| `node --test tests/*.test.mjs` | 1992/1992，fail 0，skipped 0，退出 0；[日志](evidence/v6-r1/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 条诊断，退出 0；[日志](evidence/v6-r1/tsc.log) |

新增 12 项行为测试，用真实 EChart 组件与 effects、受控 hooks / 引擎事件验证恢复调用、重复点按、四主题、零值/缺测、数据重排/删除、选中样式更新、清除后不复活、默认关闭路径、卸载清理和描述拼接；补充既有 Heatmap SSR 接线断言。定向 `node --test tests/heatmap-tooltip.test.mjs tests/heatmap-narrow.test.mjs` 34/34；全量已包含这些测试。受控事件测试不等于真实浏览器点按证据。

### Supervisor 浏览器验收

以下原样转录 Supervisor 在修复前的结果（2026-10-14，5173，`/next/components/evidence-matrix`），不是本轮修复后的结果：

- 通过：蓝图 320 下两张热力图都是 hidden，格内无数字；dark / paper 320 下都是 shown；蓝图 1280 下宽 552px 的矩阵 shown、300px 的 compact 矩阵 hidden；容器宽度 380→450→380 时 hidden→shown→hidden，ECharts 实例未变，没有重新挂载；悬停时提示框显示「运算求解 · 基础」。
- **失败 1（阻塞）**：蓝图 320 下点按 compact 矩阵的格子，选择意图正常（status 显示「请求查看：row-0-column-0；等待调用方处理。」），但提示框不出现，或出现后立即消失；点同一格也一样。推测：onSelect → 宿主重渲染 → HeatmapChart 生成新 option → EChart setOption 时隐藏了提示框。触屏设备只能点按，因此不满足「点按格子能显示提示框」。
- **失败 2**：窄屏读屏描述出现双句号：「……点按格子或查看下方数据表。。完整数值及缺测说明见下方数据表。」原因是 EChart 包装层会在描述后追加句子。修正后不能出现重复标点，也不能重复「数据表」的指引；请先确认 EChart 追加的具体规则。
- **失败 3**：`components/prism-next/demos/polar-charts.tsx` 的 compact 演示文案仍写「保留格内数值」，与蓝图窄容器下的行为不符。改成按主题如实描述的中性文案，例如核心主题保留、蓝图窄容器隐藏并可点按查看，用语义字号，不新增组件。


本轮已实现上述三项修复。

#### 修复后复验（Supervisor，2026-10-14，同一路由，浏览器面板 Viewport 模拟 320×800）

- 通过：蓝图主题 compact 矩阵窄屏说明为「能力与题目层级。窄屏下格内数值已隐藏，点按格子查看数值。完整数值及缺测说明见下方数据表。」，没有双句号。
- 通过：蓝图主题点按第一格后约 1.2 秒，提示框仍显示「运算求解 · 基础」「0」，status 为「请求查看：row-0-column-0；等待调用方处理。」；点按第二行第三列，显示「推理论证 · 综合」「缺测」；点图外空白处后，提示框消失。
- 通过：dark 主题 320 下 compact 矩阵为 shown；点按第一格后，提示框保持显示「运算求解 · 基础」。compact 文案已改为按主题说明。
- 未复验：light / paper 下的点按；1280 下的点按；其他 EChart 图表的悬停回归（只有测试覆盖）；数据重排或删除；键盘操作数据表；长中文与公式。本轮没有截图存档，`docs/blueprint/screens/v6/` 待补。
- Supervisor 结论：`PASS WITH NOTES`。

### 交给 Supervisor 的浏览器验收清单

- URL：`http://localhost:5173/next/components/evidence-matrix` 及 `#compact-heatmap`；用已运行服务。四主题 light / paper / dark / blueprint × 320×800、1280×960 均检查悬停和点按；触屏模拟中不要以悬停代替点按。
- compact 第一格：点按后保持“运算求解 · 基础”与“0”；status 为“请求查看：row-0-column-0；等待调用方处理。”；重复点同一格仍显示。点第二行第三列显示“推理论证 · 综合”与“缺测”。点击别格更新对应行列和值；点图外/空白或移开后隐藏，之后宿主更新不能恢复已取消的提示。
- 回归普通热力图及 compact 3×3 / 5×3，补验调用方同步更新 selectedId、数据重排/删除；仍有效 ID 跟随当前数值，失效 ID 不恢复。其他 EChart 图表保留原悬停、选中和更新行为。
- 容器 380→450→380：blueprint hidden→shown→hidden，核心主题始终 shown，实例不变。1280 下普通容器 552px 为 shown、compact 300px 在 blueprint 为 hidden；320 下两张 blueprint 均 hidden，核心三主题均 shown。
- 窄屏说明应为“能力与题目层级。窄屏下格内数值已隐藏，点按格子查看数值。完整数值及缺测说明见下方数据表。”，无双句号、数据表指引仅一次；宽容器与核心主题无窄屏说明。compact 文案按主题如实说明。
- 覆盖三核心主题回归、长中文/公式、键盘展开数据表与选择；嵌套 DOM 主题仍按现有 provider 取值，不能记作新增局部图表主题隔离。

### 未验证范围

浏览器验收：按分工由 Supervisor 执行。真实移动设备、读屏器、实体打印和全组件视觉未验；本轮未生成截图。Builder 自测不等同于 Supervisor Review 或 PO 批准，无新增产品决定待 PO。


### v6 · 320px 热力图方案 B · 2026-10-14（原当前，原样保留）

- 轮次：v6 · 320px 热力图方案 B，仅蓝图主题；Builder 实现与自测完成，待 Supervisor 独立 Review。
- 批准依据：Product Owner 2026-10-14 在 Claude Code 会话中原话：“仅蓝图主题（推荐）”；Supervisor `task-BPv6.md` 记录方案 B：容器宽度小于 400px 隐藏数字，核心三主题仍显示；四主题均显式使用 `triggerOn:"mousemove|click"`。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `7c2783346081ed23fd70ebb9414f0e879745a60c`。未切分支、提交、推送、合并或发布；未联网刷新远端。
- 工作树：开始时已有 `AGENTS.md` 修改与未跟踪 `docs/blueprint/`，P63 已在 HEAD，无额外未提交运行时改动。原 v5 文件除本文更新外保持不动，AGENTS 散列与开工快照一致；本轮增量见 [scope.diff](evidence/v6/scope.diff)。
- 运行时范围：`lib/prism-next/heatmap-labels.ts`、`components/prism-next/charts/advanced-charts.tsx`。无 coss、CSS、Token、局部字号、依赖、目录或公开组件 API 改动。
- 测试范围：新增 `tests/heatmap-narrow.test.mjs`；另精确适配 `tests/p57-charts.test.mjs` / `tests/p62-charts.test.mjs` 的历史快照期望，只加入 shown 标记与提示框触发值，原快照文件及其余比较不变。
- 文档证据范围：本文及 `docs/blueprint/evidence/v6/`；旧“当前”的日期、基线、验证段移至历史。按任务要求删除两条过时的未批准/待决定表述，完整输入原文另存 [status-before.txt](evidence/v6/status-before.txt)。

### 实现、取舍与偏差

- `git apply --check` 与 `git apply` 均退出 0；采用设计补丁后按任务收窄为 blueprint，未用 `--3way`。主题取现有 `useTheme().theme`，与 `chartShapeColors` / `chartSequentialDefault` 一致。
- 只有 blueprint + 可见数据披露 + 已知宽度 <400px 隐藏格内标签；`hidden` 披露和未知宽度保留标签。ResizeObserver 直接使用 contentRect.width，避免 399.5px 被舍入到 400px；observer 缺失时沿用未知宽度。
- 宽度只更新 state / option 与可访问描述，无 width key 或条件 EChart 替换；EChart 原有空依赖初始化 effect 保持不动。外层标记 shown/hidden，只有隐藏时追加“窄屏下格内数值已隐藏，点按格子或查看下方数据表。”。
- 核心主题行为变化：热力图显式设为悬停/点按触发；本地 ECharts 6.1 默认其实还含 mousewheel，本轮显式排除滚轮。其 TooltipView 使用字符串包含判断，支持该组合，但类型联合遗漏这一组合，因此仅对 triggerOn 做局部类型兼容，不修改引擎或依赖。
- 嵌套预览限制：仅设置 `[data-agent-preview][data-prism-theme]` 不会改变 next-themes Context。全局 blueprint 内的 light/paper/dark DOM 预览仍按 blueprint 判断标签，且图表配色也取全局 blueprint；反向同理。未新增 DOM 探测或修复既有主题机制，真实浏览器复验交 Supervisor。
- 复用依据（离线）：读取固定 coss Table、本地 particles `table-particle.tsx`（p-table-3/4）及 `docs/polar-charts.md` / `docs/learning-chart-properties.md` 的历史记录。表格组合承接数值披露，不提供热力图标注，沿用 HeatmapChart / EChart / ChartDataDisclosure；通用图表不适用 Beautiful UI Agent 组件。未刷新远端 registry、未复制第三方代码。

### 本轮验证（上述 HEAD + 原 v5 + v6 工作树）

运行环境沿用 README 本地验证目录变量（`.sites-runtime/` 下 XDG / TMP / Wrangler / npm），保持进程原 HOME；未启动服务。实际命令、退出码见 [checks.json](evidence/v6/checks.json)。

| 命令 / 检查 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 完整字体与许可校验通过，退出 0；[日志](evidence/v6/math-font.log) |
| `node scripts/check-typography.mjs` | 303 个 owned TSX 文件通过，退出 0；[日志](evidence/v6/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；有 chunk 大小与路由静态分类提示；[日志](evidence/v6/build.log) |
| `node --test tests/*.test.mjs`（构建后） | 1980/1980，fail 0，skipped 0，退出 0；[日志](evidence/v6/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 退出 2，4 条既有归档夹具错误，本轮运行时代码 0 条；[日志](evidence/v6/tsc.log) |
| `node --test tests/heatmap-narrow.test.mjs tests/p57-charts.test.mjs tests/p62-charts.test.mjs tests/blueprint-*.test.mjs` | 121/121，fail 0，skipped 0；含新增 22 项纯函数 / SSR / 少量接线检查；[日志](evidence/v6/targeted-tests.log) |
| 干净基线核对 | `git archive HEAD` 导出到临时验证快照（无 .git、无新分支/工作树），共享既有 node_modules；`tsc --noEmit --incremental false` 干净 HEAD 退出 0；加入原 v5 文档后退出 2，同样 4 条诊断且与当前日志逐字节一致；[记录](evidence/v6/baseline-checks.json)、[干净 HEAD](evidence/v6/tsc-head-clean.log)、[HEAD 加 v5](evidence/v6/tsc-head-plus-v5.log) |
| 首轮与修正 | 首轮 1974/1980，6 项 P62 旧快照不符；tsc 5 条（本轮 triggerOn 类型 1 + 既有夹具 4），已修正本轮原因。初始日志保留为 `initial-*`，不记作当前结果 |
| 浏览器证据 | 待 Supervisor 验收 |

### 交给 Supervisor 的浏览器验收清单

- URL：`http://localhost:5173/next/components/evidence-matrix`（以 Supervisor 已运行服务端口为准）。四主题分别覆盖 1280×960 / 320×800：普通矩阵在实际容器 ≥400px 时均有数字，320px 下仅 blueprint 隐藏；核心三主题数字、颜色、布局保持现状。
- 同一路由 `#compact-heatmap`：来源 `demos/polar-charts.tsx`，300px compact 矩阵在 blueprint 无数字，在核心主题有数字；1280 / 320 均检查，切换 3×3 / 5×3 后仍正确，零值和缺测在数据表与提示框保留。
- 四主题悬停与点按单元格：提示框显示完整行/列/值或“缺测”，点击选择仍发既有 ID 意图；展开“查看数据与选择项目”，键盘进入表格操作并核对长中文/公式标签可读性。
- 容器 420→380→420 拖动（不是只看视口数字）：blueprint 标签 shown→hidden→shown；核心主题一直 shown。检查 ECharts 实例身份不变、无 dispose/init，数据/选择不丢；宽度改变不能当作已完成浏览器验收。
- blueprint 窄容器的 role=img / 可访问描述才出现窄屏提示；宽容器、核心主题、`dataDisclosure="hidden"` 均不出现。后两种调用模式及未知宽度需要 Supervisor 临时夹具。
- 嵌套 DOM 主题夹具复验：外层全局 blueprint、内层三核心主题，在 320px 图表仍取 provider 的 blueprint 标签策略及配色；记录此既有限制，勿将 CSS 隔离误记为图表 Context 隔离。

### 未验范围与待办

- 浏览器验收：按分工由 Supervisor 执行。真实移动设备、读屏器、黑白打印、全组件视觉未验；不生成或预填 v6 截图。
- 原 v5 `docs/blueprint/evidence/v4/fixture.tsx` 被 tsconfig 的 `**/*.tsx` 纳入，产生 4 条类型错误；不改历史夹具或放宽全局检查，交 Supervisor 单独处理。
- compact 演示现有描述“保留格内数值”没有主题限定，本轮未扩大范围修改演示文案；请 Supervisor 记录后续文案修正。
- Builder 自测不等同于 Supervisor Review / PO 批准；本轮不预填 Review 结论，无新增产品选择待 PO 决定。


### v5 · 交接规则与证据归档 · 2026-10-14（原当前）

> 原验证与基线保留；两条旧待批准表述已按 v6 任务移除，完整原文见上方快照。

- 轮次：v5 交接规则与证据归档，已由 Claude Code（Supervisor）应用到本地工作树。
- 批准依据：Product Owner 2026-10-14 原话——经 Codex 转交：“批准 v5 修订版，由 Claude Code 应用，完成后验证并更新 STATUS.md。”；Product Owner 随后在 Claude Code 会话中直接确认：“批准应用 Blueprint v5 修订版到 intelligence-prism-ui”。批准对象是审核修订包 `Blueprint-v5-reviewed-20261014.zip`（SHA-256 `72016e6b…83044`）；修订包与原始草案的完整散列分别记于 [docs/blueprint/evidence/v5/codex-verification-20261014.json](evidence/v5/codex-verification-20261014.json)。原始草案的散列不作为修订包标识。
- 应用日期：2026-10-14。
- 实际分支 / HEAD：`feat/learning-charts` · `6ddecd27eb76f7e3694855df4ef42f904d03ead6`（未切换分支）。改动为该分支上的未提交改动：`AGENTS.md`（§5 两处说明、新增 §10）与新增 `docs/blueprint/`；与同分支的图表提交（P58–P62）无文件交集。本轮未提交、未推送、未合并、未发布。
- 应用前基线：`AGENTS.md` SHA-256 `0a12c47b…ace86`，与 `review-baseline.json` 一致；应用后 `edff5266…5f7eb`，与包内 `AGENTS.proposed.md` 逐字节相同。§3 的 2026-10-13 GPT Site 实验线特例保持不变；`.sites-runtime/` 原历史证据保留未动。
- Review 与复核：批准补丁由 Claude Code（Supervisor）应用并核对；Codex 随后独立核对规则、改动范围、54 个 coss 文件字节、截图散列、链接及本轮测试日志，结果均符合本次文档交接范围。详见 [复核记录](evidence/v5/codex-verification-20261014.json)。Codex 本次只补充此状态与复核记录，未修改生效规则或运行时。

### 本轮验证（2026-10-14，上述 HEAD + 本轮未提交改动）

| 检查 | 结果 |
| --- | --- |
| `git apply --check` / `git apply` | 均退出 0，无冲突，未使用 `--3way` |
| 改动范围 | `git status` 仅 `AGENTS.md` 与 `docs/blueprint/`；`components/coss/**` 与 HEAD 相同；无运行时代码、样式、依赖、测试或组件目录改动 |
| `docs/blueprint/` 与修订包 | `diff -r` 完全一致（本行所在 STATUS、新增测试日志与 Codex 复核记录除外） |
| 18 张历史截图 | 文件头均为 JPEG（`FFD8FF`）；与 `screens/v4/manifest.json` 记录的 SHA-256 18/18 一致；与 `.sites-runtime/` 原文件 18/18 字节相同 |
| 相对链接 | `AGENTS.md` 与 `docs/blueprint/**/*.md` 的仓库相对链接全部可解析 |
| `node --test tests/blueprint-theme.test.mjs tests/blueprint-components.test.mjs tests/blueprint-charts.test.mjs` | 18/18 通过，fail 0，退出码 0。日志：[evidence/v5/apply-tests-20261014.log](evidence/v5/apply-tests-20261014.log) |
| 全量测试、构建、类型、字号检查 | 本轮未运行（纯规则 / 文档归档，按 §10.2 不沿用旧结果） |
| 浏览器、打印、读屏器 | 本轮未运行；`screens/v4/` 是 2026-10-13 历史截图，不是当前视图 |

### 继续保留的限制与待决定

- 实体黑白打印、真实移动设备、读屏器与全组件视觉验收未做。
- 目录数量断言中的重复 105 常量待日后以独立有效的目录完整性断言收敛（§10.2），本轮未改测试。


### v5 · 修订候选技术核对 · 2026-10-14（应用前）

- 轮次：v5 交接规则技术核对，待 Product Owner 确认后由 Claude Code 应用。
- 核对日期：2026-10-14。
- 观察基线：`feat/learning-charts` · `6ddecd27eb76f7e3694855df4ef42f904d03ead6`；该快照的工作树干净；审核期间并行图表工作已形成 P62 提交。本轮未 fetch，未判定远端同步状态。
- 规则授权：待 Product Owner 明确确认；不预填授权日期。
- 应用状态：候选补丁已整理，尚未应用到生效的 `AGENTS.md`。应用时更新此行，并记录批准依据、应用提交及独立 Review 结果。
- 范围：§5 两处说明、§10、本文与证据归档；无运行时代码、依赖或组件目录改动。

#### 当时验证

| 检查 | 结果与范围 |
| --- | --- |
| `node --test tests/blueprint-theme.test.mjs tests/blueprint-components.test.mjs tests/blueprint-charts.test.mjs` | 18/18 通过，退出码 0；在 `2abc127` 与当时未提交图表改动的工作树上执行；之后观察到 P62 提交，不代表新 HEAD 全量或候选规则已验收 |
| v4 旧目录失败核对 | 5 处断言当前源码已为 105；不再将旧的 `105 !== 103` 写成当前失败；未据此推定全量通过 |
| 当前全量、构建、类型与字号检查 | 本次规则审核未重跑；历史结果见下方 |
| 当前浏览器与打印检查 | 本次未重跑；迁移的图片是 2026-10-13 证据，不是当前视图 |

本轮测试摘要：[docs/blueprint/evidence/v5/review-checks.json](evidence/v5/review-checks.json)。

#### 当时偏差、限制与待办

- 原包的 `feat/blueprint-theme · 未提交` 不符合当前基线。v4 相关文件已在 `a86d6fa` 中进入提交历史；本次审核期间另有图表工作形成 P62 提交，不归入本补丁。
- v4 的 1761/1766 属于 2026-10-13 并行改动期间的历史结果；保留记录，不覆盖成当前通过或失败。
- `bp-*` 显式组件的跨主题中性回退，与蓝图对既有组件的隔离覆盖分别约束；核心三主题的已有令牌值与默认行为继续保持。
- 目录数量断言仍有重复的 105 常量；未来以独立有效的目录完整性断言收敛，不在本轮修改测试或降低契约要求。
- 320px 默认热力图文字拥挤仍是待复验限制；本轮没有决定隐藏格内数字，也未改运行时。

#### 当时待 Product Owner 决定

- 是否批准本候选 §5 / §10 的有限例外与交接约定；由 Claude Code 应用并记录批准依据。
- 320px 热力图的交互与布局方案尚未选定；`<400px 隐藏格内数字` 仅为原包提案，不列为已批准实施项。


### v4 · 图表配色 · 2026-10-13

历史来源：[docs/blueprint-theme.md](../blueprint-theme.md) 的 v4 接入记录及此次复制的原始日志；不是当前提交的重新验收。v4 文件后来已进入提交 `a86d6fa`，不能再概括为“未提交”。

**v4 范围**：`lib/prism-next/chart-palette.ts`、`components/prism-next/charts/chart-theme.ts`、`components/prism-next/charts/echart.tsx`、`components/prism-next/charts/advanced-charts.tsx`、`lib/prism-next/chart-options.ts`、`tests/blueprint-charts.test.mjs`，以及手动适配的 `lib/prism-next/config.ts`、`app/(next)/next/theme.css`、`app/(next)/next/blueprint.css`。范围 diff：[docs/blueprint/evidence/v4/v4-scope.diff](evidence/v4/v4-scope.diff)。

| 当时检查 | 历史结果 |
| --- | --- |
| 首次相关测试 / 全量 | 29/29、1743/1743 |
| 收尾新增图表测试 | 6/6 |
| 混合工作树最后全量 | 1761/1766；目录扩展到 105 后，5 处仍断言 103 |
| 数学字体、字号、构建、TypeScript | 当时记录为通过；不作为当前复验结论 |

原全量日志：[初次 1743/1743](evidence/v4/tests.log)、[混合工作树 1761/1766](evidence/v4/final-tests.log)。

**已记录的浏览器观察**：四主题 1280px 的六系列柱形/面积夹具和正式趋势页；蓝图箱线选中态、热力图、散点、比较及提示框；320px 局部抽查。箱线验证的是墨线、填充和蓝色选中态，不能记成已验多系列图案。柱形/面积有图案；Recharts 趋势/比较、ECharts 无填充折线没有对应填充图案；分组散点使用调用方点形。

**继续保留的限制**：320px 默认热力图文字拥挤；实体黑白打印、真实移动设备、读屏器及全组件视觉验收未做。v4 之外的既有 Tabs 窄屏问题与并行 compact 热力图范围，仍以历史文档为准。

**实现偏差**：ECharts 6.1 富文本提示框忽略配置的 1.5px 边框，v4 已加隔离的 SVG 描边适配；选中箱线和提示框均留有历史截图。

截图索引：[docs/blueprint/screens/v4/README.md](screens/v4/README.md)；18 张图片字节保持不变，扩展名由误标 `.png` 修为实际的 `.jpg`。原临时文件保留，未移动或删除。夹具源文件与浏览器记录一并归档到 `docs/blueprint/evidence/v4/`；夹具入口已移除，图片不能当作当前线上路由的截图。
