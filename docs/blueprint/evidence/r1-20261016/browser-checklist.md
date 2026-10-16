# P73 · 交给 Supervisor 的浏览器验收清单

日期：2026-10-16。基线：`5644554aa6920fdbffdcbd1fdac617c20af1cc2e`，`feat/agent-blueprint-r1` 加本轮工作树 diff。**下列为待执行清单，没有 Builder 浏览器结果或截图。** 使用 Supervisor 已确认的唯一开发服务；URL 以下以 `http://localhost:5173` 为例，实际端口由 Supervisor 记录。

统一矩阵：`light / paper / dark / blueprint / blueprint-night` × `1280×720 / 320×720`。主题选择区与局部「预览主题」分别切换，不能只改全局而留下 light 的局部预览。核心主题对照开工基线；夜图只新增本轮圆角适配，§5.4 的焦点修复只作用于白图。

| URL / 区域 | 操作路径 | 应看到的内容或状态 |
| --- | --- | --- |
| `http://localhost:5173/next/components/agent-components/prompt-bar` | 「预览主题」选每个主题，宽度自适应 / 320 px，Rounded / Pill 都检查；「载入草稿」→「模型入口：显示」切为隐藏 | 默认显示「本机规则」模型入口；隐藏时模型触发器、菜单及其选项均不在 DOM，Tab 不进入隐藏入口；草稿及来源 / 附件 / 语音按钮保留。再显示恢复关闭状态，不自动弹出模型菜单。 |
| 同页 | 打开模型菜单后由夹具关闭可用性；随后「打开来源示例」和「打开命令示例」；↑↓ / Enter / Escape；中文 IME / Shift+Enter | 模型消失后可继续打开来源或命令列表，不被过期展开状态挡住。来源选择只记录对应意图；IME 选字不发送，Shift+Enter 换行。隐藏模型不产生 select-model 意图。 |
| 同页 | 加入附件、长中文与公式草稿；依次 Tab 到发送、范围、材料、语音按钮及模型触发器 | 白图浅底上的墨色发送按钮为 **2px 蓝色单 outline，offset 2px**；没有 coss shadow ring 叠加。边缘、窄屏换行后和附件移除按钮不被裁切；输入框本身的整组焦点保持。原有墨色按钮本身不是改用白色外框的理由。 |
| 同页 | 外层 light / dark、内层 blueprint / blueprint-night，打开「添加附件与来源」、模型、`@` / `/`、未接入听写 / 语音的说明；反向外层蓝图、内层 light / paper / dark | PromptBar 五类浮层与局部预览同主题；Popup 位于输入表面外的根容器，不受 `overflow-hidden` 裁切。Escape 正常关闭并回到预期入口。局部核心预览根及后代（含伪元素）无蓝图圆角、边框或焦点泄漏。 |
| `http://localhost:5173/next/components/agent-components/agent-message` | 切五种「预览主题」，自适应 / 320px；查看长中文、MathML、代码、附件；Tab 到「查看材料说明」并激活 | 两种蓝图用户气泡和附件直角，核心主题保持原圆角。白图墨色消息内部链接为白色单 outline（2px、offset 2px），不压文字、不断开可读内容；蓝色不得低对比地落在墨底。激活只跳转页内材料说明，不提交任务。夜图焦点不宣称已按白图规范改造。 |
| `http://localhost:5173/next/components/agent-components/existing-agent-inputs` 中「追问、依据与修改对照」的 QuestionCard 示例 | 各主题进入「这次需要整理哪些内容？」；选择单选项并填写「补充要求」 | 默认提示「补充一个信息」，不再出现固定「需要你确认」。选择后显示「已选择：…，尚未执行任务。」；单选与补充输入保留，没有触发确认 / 保存 / 执行。 |
| `http://localhost:5173/next/components/agent-components/execution-confirmation` | ready 态 Tab 到主动作，再切 submitting / received / blocked / unknown / recorded；检查 card / inline 与 320px | 白图 ready 主动作处于浅底，使用蓝色单外框；无双环、裁切、文字遮挡。只有 ready 暴露确认；unknown 仅查询原请求，其他状态沿用既有语义。禁用理由可读。 |
| `http://localhost:5173/next/foundations/blueprint` 和 `http://localhost:5173/next/foundations` | 在实际 Select / Menu / Popover / Dialog / Tooltip 夹具中打开浮层；五主题、双向嵌套预览、1280 / 320；Dialog Escape 返回 | 核查已有共享原语的容器传递能力与既有蓝图浮层行为，无本轮全库改写。对未绑定容器的 Agent 内置浮层，按 [Portal 审计](portal-audit.md) 记录正文 / body 主题不同时的实际结果，不能将这部分误记为通过。 |

记录每项实际 URL、视口宽高、全局 / 局部主题、操作、焦点样式实值及截图。新截图按 `docs/blueprint/screens/r1-20261016/<主题>-<宽度>-<内容>.png` 保存，核对实际编码后再写索引。无截图不得预写证据存在。

本轮不验证真实服务、Workspace 业务接入、真机、读屏器或实体打印。上一周期累计浏览器矩阵尚未收口，本清单不重置该周期。
