# 第二批通用组件与配色规则 · 独立 Review

日期：2026-10-16（Asia/Taipei）。分支：`feat/blueprint-common-batch-two`；开工基线：`2865942bb755efaa516a0f6f4252cdf79b4b1969` / Site v121。

最终结论：**PASS WITH NOTES，正式放行。** 源码及浏览器验收通过，最终工程核验已满足下述已知失败基线要求；本轮无剩余实现或验收阻断。

## 审查方式与范围

Reviewer 独立读取运行时 diff、新夹具、相关固定 coss 结构、主题定义及本轮证据 JSON，未修改运行时代码、启动服务或代替 Builder 自评。另目视抽查 320px InputGroup 焦点和蓝图内深色 Combobox 截图；其余浏览器操作及完整视觉检查由主代理执行。结论仅覆盖本轮 12 类通用组件、相应预览与明确列出的回归范围。

- `blueprint.css` 的新增几何、语义颜色、焦点、伪元素、减少动态效果和打印规则保持 Blueprint 作用域及核心主题预览排除条件。
- Combobox 规则检查真正绘制边框的外层 `span`；Toast 检查真实 `data-position` 根，而非仅验证透明壳或不存在的 slot。
- 每个第二批夹具实例创建独立 Toast manager，所有浮层使用该实例的 Portal 宿主；不会向全站 manager 发送样例通知。
- InputGroup 使用整组外框焦点，内部输入不重复绘制焦点；错误红边、禁用与只读语义保留。危险菜单和按钮保留语义颜色，伪元素未重新引入软阴影或核心主题污染。
- Progress 的未知值保持 `null`，不显示虚构百分比；Toast、Skeleton、Empty 明确标注固定或可逆样例，没有计时器或真实业务完成声明。
- 冻结 coss、核心主题定义、依赖和组件目录无修改。文档原位澄清品牌装饰与 AI 来源边界；公共令牌名称、数值及品牌原色不变。

## 审查发现及收口

1. **Tooltip 描述语义已修复。** 固定 BaseUI 版本没有自动补充本例的 tooltip role 和描述关联。夹具通过公开 props 设置稳定 popup ID、`role="tooltip"`，并仅在打开时设置触发器 `aria-describedby`。未修改 coss；键盘打开、描述解析和 Escape 已纳入交互证据。
2. **局部主题派生别名已修复。** 初次六组比较暴露伪元素圆角和 Skeleton 背景继承外层已计算别名。现仅在涉及 Blueprint 的真实预览边界重算 `--radius-lg`、`--radius-md`、`--color-muted`。核心预览参与此规则是恢复自身令牌；其余几何覆盖仍排除核心预览，普通核心主题全局不匹配该桥接。
3. **预览宿主补齐前景色契约。** 夹具根使用与正式 `AgentPreviewFrame` 一致的 `text-foreground`，避免无独立前景类的内容继承外层颜色。未向 QA 脚本注入补丁变量，也未删除伪元素或背景比较项。

## 已核对证据

| 范围 | 独立核对结果 |
| --- | --- |
| 第二批矩阵 | [matrix.json](matrix.json)：223/223，12 组布局、11 个浮层情景、6 组双向局部主题比较全部一致 |
| 第二批交互与焦点 | [interactions.json](interactions.json)：47/47；[focus.json](focus.json)：全部通过，包括错误红边、整组焦点与清除按钮独立焦点 |
| 首批回归 | [first-interactions.json](first-interactions.json)：31/31；[first-matrix.json](first-matrix.json)：12 组布局、8 个浮层记录，局部主题比较全部相等 |
| 原蓝图按钮 | [first-hover.json](first-hover.json)：四主题 × 两宽度共 8 情景，原 8 个按钮保留；默认、hover、键盘焦点、按下、禁用和减少动态效果检查通过 |
| 组件页与核心主题 | [routes.json](routes.json)：24 次组件路由访问；[core-comparison.json](core-comparison.json)：三个核心主题 Progress 修改前后完全相等 |
| 干净浏览器环境复验 | [fresh-focus.json](fresh-focus.json)：全新 `batch2final` 会话，1280px / 320px 下文档与 body 的 client / scroll 宽度均等于视口，zoom / DPR / visual viewport scale 均为 1；整组焦点宽度分别为 446.5px / 246px |

320px 焦点截图曾出现底部滚动条，因此未仅凭旧矩阵的视口宽度比较判定通过。Reviewer 已核对全新会话记录并重新目视替换后的 [320px 焦点截图](../../screens/batch2-20261016/blueprint-320-input-group-focus.png)：文档无横向溢出，剩余四处滚动均为既有局部 Tabs 区；完整蓝色焦点框和错误红边可见。该项已收口，旧浏览器环境不作为最终窄屏证据。

## 最终工程核验与发布放行

Reviewer 已核对 [工程命令记录](engineering.json)、[最终失败集合对照](complete-failure-delta.json) 与 [验收记录](checks.md)。运行时代码最后修订后的 build、TypeScript、数学字体与语义字号检查通过；最终 Blueprint 专项 39/39 通过，包含 6 项 guide 检查。

最终全量为 **1949 项 / 1688 通过 / 261 既有失败**；与上轮基线比较 `new=[]`、`removed=[]`。中间一次 263 项失败中的两项 guide 内容及资产 hash 过期已在重新生成后消除，见 [中间对照](release-failure-delta.json) 与最终对照；未豁免新增失败，也未宣称全量测试全部通过。

本报告及源文档的最后结果回填仅涉及证据与说明。文档代理应在本报告定稿后最后一次重新生成 guide / 下载资源，再运行 6 项 guide 内容与 hash 检查后冻结；不使用回填前的生成物交付。如随后修改运行时代码，应重新执行受影响的验证。

用户本会话已明确授权持续完善及 GitHub / 本地 / Site 同步。独立 Review 现已正式放行，**允许 push、创建 PR、merge，并以同一个合并后的 main 提交发布 Site**，无需为这些已授权动作追加确认。不得将本报告解释为允许带着新增失败发布，或允许扩大到业务布局、冻结 coss、核心色值等范围。发布 SHA、PR 与 Site 版本由实际执行结果回填，本报告不预写这些动作已完成。

## 限制

全量测试并未全部通过，261 个既有失败仍需如实保留。真机、读屏器、实体打印、原生浏览器 200% 缩放及未展示的状态组合未验；CSS zoom 2 不能替代原生缩放。页面无溢出、有限交互、静态截图或源码检查均不代表全站、全部可访问性或全部变体通过。
