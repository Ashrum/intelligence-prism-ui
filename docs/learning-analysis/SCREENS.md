# 学情分析画面与验收登记

- 设计状态：设计正式版 v1.0
- 工程准入：未开始
- 版本：v1.0 · 2026-10-23 · Derived, Non-canonical
- 批准人：Ashrum（PO）
- 批准日期：2026-10-23

## v1.0 工作台粗验

依据 [06规格 §12.10](06-全周期验证协议与夹具矩阵.md)、[04规格 C01合同](04-Agent协同与Blueprint承载规范.md)及 Supervisor（Claude）2026-10-23 L6 粗验、L5b-B 主题矩阵、W284 复验登记。签发实现为 `b8191bb`；初验在 `e2a027a`，W284 [PR #219](https://github.com/Ashrum/ole-school-workbench/pull/219) 修复后复验。以下是既有结果摘录，P111 未重新操作浏览器。

规则 R = `learning-2026-10-14-v3`，从签发提交的 [learning-contract.ts](https://github.com/Ashrum/ole-school-workbench/blob/b8191bbfce592ca980fa93f79b09fb07a27a84fb/src/features/teacher/analysis/learning-contract.ts#L135) 常量 `learningRuleVersion` 读取。合成包名称为 `teaching-default` / `teaching-empty`；原记录未提供独立包修订号，不虚构版本。

主题矩阵 S = 独立页五入口五主题 × 1280、blueprint / dark × 390；L5b-B 遗漏的 paper 学生页由 L6 补验。Agent 矩阵 A = blueprint-night / dark × 1280，L6 补 blueprint 四画面（原记录未单列补验宽度）。五主题指 global 下 light / paper / dark 与 blueprint / blueprint-night。light / paper Agent、390 下 light / paper / blueprint-night 未测；1440 未登记本轮通过。外观偏好复用 `ole-agent-workspace-appearance`。

| 路由 | 实现提交 | 合成包／规则版本 | 主题／视口 | 操作 | 结果／证据 |
| --- | --- | --- | --- | --- | --- |
| /teacher/learning-analysis?view=overview | b8191bb（初验 e2a027a；W284 #219） | teaching-default / teaching-empty；R | S | 两班、空包、自定 09/01–09/30、截止排除、带范围问 Agent | 通过：1 班七类合计 45、100.0%，需要支持 1 + 近期回落 9 = 10；2 班合计 30，0.0 显示「差异小于当前显示精度」；空包「当前数据范围暂无有效作答」，不画伪零。W284 修复未纳入原因；[夜图](evidence/v1.0/night-overview-charts.jpg)、[文字200%修复](evidence/v1.0/w284-text200-overview-fixed.jpg)。不沿用旧40人示例 |
| /teacher/learning-analysis?view=students | b8191bb（L3 #209/#210） | teaching-default；R | S（含 L6 paper 补验） | 名单状态、预期差距、补回／保持率、学生详情 | 浏览器通过：名单与说明一致。G/H/C 阈值边界以 W273/W274 定向测试替代；2／3题版逐项浏览器操作未单列登记 |
| /teacher/learning-analysis?view=curriculum | b8191bb（W284 #219） | teaching-default；R | S | 无作答章节、知识点分布、缺值说明 | 通过：「—」与「当前范围没有有效作答」；W284 修复未判定类说明。G/H/C 阈值以测试替代；已教／局部各分支未单列操作证据 |
| /teacher/learning-analysis?view=mistakes | b8191bb | teaching-default；R | S；文字200%修复见图 | 无可比再考、人数分母、典型错答、精确作答与公式 | 通过：显示「—」及有效批阅不足3次／条件未核实或不可比原因；「出错学生 n / N 人」；「查看精确作答」可追溯、公式正常。13／14／15日及排序未单列浏览器证据；[文字200%修复](evidence/v1.0/w284-text200-mistakes-fixed.jpg) |
| /teacher/learning-analysis?view=reports；既有 task/result 深链 | b8191bb（W284 #219） | teaching-default；R | S；夜图快照／深链 | 生成 v1 → 更正发布 → 重开、打印、当前与旧深链 | 通过：快照保持梁亦辰73.7%、整体74.0%；打印独立弹窗、内容一致；v1/v2 深链均可达。W284 修复当前深链措辞及旧报告更新提示／生成新版本入口；[夜图快照](evidence/v1.0/night-report-snapshot.jpg)。下载文件未单列验收结果 |
| /teacher/agent/workspace | b8191bb（#213/#215/#217/#218） | teaching-default；R | A | 带范围 → 画面1 → 建议 → 采纳／暂不采纳 → 起草 → 入篮 → 组卷 → 返回 | 通过：「草稿，未保存」、精确题版入篮0→1、返回恢复同一对象与草稿；未保存时「编排草稿已建立，尚未保存练习版本」。保存成功／失败／未知据 W280 浏览器验收与定向测试（#217），L6 未逐项重跑；改后采纳未单列本轮浏览器证据 |
| /teacher/agent/workspace，同一对象 | b8191bb（#218） | teaching-default；R | A | 更正评分 → 发布 → 画面4 → 按更正后来源继续 | 通过：28/39→27/39、批阅已更正·结果v1→v2；未处理草稿阻断，确认继续不自动生成、保留草稿并生成「更正记录1」。撤权／切账号／迟到回调以 W277/W280/W282 定向测试替代；手改／取消／替换／自拟未逐项登记本轮浏览器结果，不以历史18→16截图代替 |
| 上述路由浮层／冻结详情／题篮 | b8191bb（W284 #219） | teaching-default；R | blueprint-night 深层页；等效320；整页200%为640宽；文字200%为1280宽 | Portal主题、范围／指标浮层、键盘焦点、Meter文本、净宽迟滞 | 通过：夜图浮层跟随主题；五入口与Agent等效320无横向溢出；[整页200%表格](evidence/v1.0/zoom200-640-mistakes-ok.jpg)可读；抽样25控件有2px焦点环，aria-valuetext与可见值一致。文字200% A1 经W284复验通过；1015/1040/1064以 workspace-width 测试替代。真实读屏朗读、嵌套隔离及手关后不重开未单列浏览器结果 |
| /teacher/agent/workspace，C01受控建议 | 签发 b8191bb（#215）；历史冒烟代码见下 | 同一合成包最小字段；合同 learning-c01-v2-20261022；计时 c01-timing-v1-20261022 | 服务端受控脚本，无浏览器主题／视口；不冒称页面证据 | qwen3.8-flash，重讲优先级；调优扩至错因推测；正常／无依据／超时 | 已执行，结果混合：timeout、displayable但建议全拦、insufficient；调用／usage／时延见下表。撤权等合成反例与真实调用分开，不宣称所有异常分支真实冒烟通过 |

### C01 真实冒烟登记（W278，2026-10-22）

来源为 Supervisor W278 冒烟记录；仅摘录已登记事实，不含凭据及原始返回。外发审阅件共73字段路径，全部合成：班级别名、学科、5个目标名、观察窗、5题作答／失分／待订正／待再考人数及5条最小典型错答、来源包／规则／投影版本与限制。未发送学生姓名学号、逐生分数、扫描图、未选题或完整对话。

| 轮次／代码 | 调用次数 | 分类与时延 | 用量／结果限制 |
| --- | --- | --- | --- |
| 第1次（ab87c4c 合并 d8db54e 后） | 1 | timeout，5,009 ms | 无返回模型名、无usage，账本requesting；是否计费未知，不记0 |
| 第2次（915142c） | 1 | timeout，30,009 ms | 无返回模型名、无usage；C01单独30秒，S1理解仍5秒 |
| 第3次（6a06135，enable_thinking:false） | 1 | displayable，19,851 ms，总19,858 ms；返回qwen3.8-flash | prompt873 / completion1,979 / total2,852，cached0；账本complete、budget_violation0；5/5不可采纳，INCOMPLETE_OR_MIXED_QUESTION_EVIDENCE |
| 调优 t01 / t03 | 2 | 均timeout，30 s | 两次usage缺失；t02被本地CONCURRENCY_LIMIT拦截，未发送，另计0次／0Token |
| 调优 m01 | 1 | 客户端等120 s、离线产品校验器裁决；displayable，31.2 s | 3,304 Token；5/5不可采纳，其中3条典型作答数字被误拦；不算30秒运行器内成功 |
| 调优 t04 | 1 | displayable，19.4 s | 3,550 Token；5/5拦，UNREFERENCED_NUMBER×4、跨题×1 |
| 调优 t05 | 1 | displayable，20.9 s | 3,440 Token；5/5拦，模糊量词／订正误读／推断句 |
| 调优 t06 | 1 | insufficient，1.8 s | 1,822 Token；模型以缺知识点映射返回空集合 |
| 调优 t07 | 1 | displayable，19.0 s | 3,289 Token；5/5拦，登记为语义已正确、人数句式白名单仍拦截 |

调优轮实际调用7次，已知15,405 Token，另2次中止用量未知；加前三次，共10次真实调用，已知18,257 Token，4次中止用量未知（由逐次记录求和，不是完整计费总量）。模型均请求 qwen3.8-flash，无自动重试或切模型。前三次单次输出限额2,048；调优轮限额20次、单次4,096、总100,000 Token是当轮授权上限，不是实际调用量，也不是正式服务额度。记录止于 t07，未登记 fix5 后新冒烟通过。

已知限制：模型曾夹带英文键、自算比例、把典型错答称为常见错误、误读pendingCorrection；校验曾误拦典型作答数字，后续句式白名单仍挡住建议。结构可解析不等于事实与教学质量通过；来源更正后用途授权阻断仍见 [LE2](RELEASE.md)。

### 证据索引与边界

以下图均从 Supervisor L6 证据原样复制，日期2026-10-23，未改图；不是历史隔离宿主图。初验为e2a027a，W284修复图对应签发b8191bb。图片像素不推定CSS视口，原记录没有写明的值标未登记。

| 文件 | 路由／内容 | 主题／视口 | 基线 |
| --- | --- | --- | --- |
| [night-overview-charts.jpg](evidence/v1.0/night-overview-charts.jpg) | overview 夜图图表 | blueprint-night；单图视口未登记（矩阵1280） | e2a027a |
| [night-report-snapshot.jpg](evidence/v1.0/night-report-snapshot.jpg) | reports 快照 | blueprint-night；单图视口未登记 | e2a027a |
| [zoom200-640-mistakes-ok.jpg](evidence/v1.0/zoom200-640-mistakes-ok.jpg) | mistakes 整页缩放200% | 主题未登记；等效640宽 | e2a027a |
| [w284-text200-overview-fixed.jpg](evidence/v1.0/w284-text200-overview-fixed.jpg) | overview 仅文字200%修复 | 主题未登记；1280宽场景，高度未登记 | b8191bb |
| [w284-text200-mistakes-fixed.jpg](evidence/v1.0/w284-text200-mistakes-fixed.jpg) | mistakes 仅文字200%修复 | 主题未登记；1280宽场景，高度未登记 | b8191bb |

LA08十组oracle：L6 登记 learning-precision-w274 / -ui-w274 / learning-chart-format-w275 等定向测试97/97（含宽度及L5-A/C/D），页面可见「0.0 差异小于当前显示精度」。数值边界通过不扩大为所有浏览器场景通过。真实服务／写入／HANDOFF／生产／教学试点、真实读屏及上述未测主题组合均未验；浏览器验收由Supervisor执行。

## v0.7-r2 历史隔离画面

以下为 v0.7 r2 发布附件，均为合成数据与隔离组件宿主；原浏览器记录只支持原版本范围。

四画面对应“查看证据 → 有依据的AI建议 → 教师决定 → 行动与练习草稿 → 来源更正后重新核对”。主稿§8.2—§8.3及规格04为实现依据，画面不能放宽权限、门禁或未接入能力。

## 01 独立页带范围进入

概览只说单次检测相对自身预期的差距及补回/保持；优先处理人数与学生进展须来自同一投影。当前首排入口文字以v1.0“带此范围问 Agent”为准，旧图文字只作历史。r2将知识点说明改为“集中在2个知识点”。

![概览 r2 浏览器实拍](agent-ui-v0.7/screens/01-overview-r2.png)

## 02 重讲问题的核查结果

题行按失分人数占比排序，AI建议逐条提供依据，教师可采纳、改后采纳或暂不采纳。题行不挂学生进展/掌握度。原r1截图仅保留历史证据效力。

![重讲结果 1440](agent-ui-v0.7/screens/02-analysis-1440.png)

[1280截图](agent-ui-v0.7/screens/02-analysis-1280.png) · [浅色1440](agent-ui-v0.7/screens/05-analysis-light-1440.png) · [改后采纳](agent-ui-v0.7/screens/07-advice-modified-1440.png)

## 03 行动与练习草稿

草稿真实显示未保存。练习进入全局题篮，原工作对象保留；仅准备意图，未接真实能力。原r1基本画面继续保留，新增建议变化状态见下图。

![行动草稿 1440](agent-ui-v0.7/screens/03-draft-1440.png)

[1280截图](agent-ui-v0.7/screens/03-draft-1280.png) · [r1的390恢复记录](agent-ui-v0.7/screens/06-draft-390.png)

教师手改后建议改变，系统保留文字、提示差异并提供显式替换。教师可以确认“教师自拟”，当前标记调整，原建议引用和编辑链不删除。

![建议变化与原文保护 r2](agent-ui-v0.7/screens/08-advice-change-r2.png)

## 04 来源更正后的核对

更正后名单和草稿不自动缩减，教师选择如何处理；失分比例始终为失分人数/作答人数。r2统一对照表标签。

![来源更正 r2 浏览器实拍](agent-ui-v0.7/screens/04-revision-r2.png)

## 复用与证据边界

宿主使用工作台既有的 AppBar、SpaceBar、AgentPromptBar、COSS控件及 BpFrameCard/BpSectionCard，未挂载业务 AgentWorkspacePage、Store、鉴权、正式题篮 Provider 或服务 owner。图中人名、答题与统计均为合成夹具，不含真实学生数据。

新增三图为 r2 本机 Chrome 1728×996实拍；1440/1280、浅色、390和改后采纳图为已复核的r1证据。r2未重复完成所有宽度/辅助技术验收。截图不能证明模型、HANDOFF、业务写入或生产准入。

可运行宿主保留在本机研究目录 `agent-ui-v0.7/`；本站发布可审核设计及截图，不把其模拟状态当作业务功能开放。完整环境和构建说明见历史研究记录，正式界面实现以主稿及规格为准。

[交互宿主源码参考](prototype-source/app.js)及[真实组件桥接](prototype-source/main.tsx)随发布保存，只作为可审核源码下载，不在站点执行。配置仍引用原本机工作台路径；不要把它当作已接入工作台的业务实现。
