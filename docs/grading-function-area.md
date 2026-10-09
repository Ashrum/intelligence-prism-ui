# 批阅功能栏八种状态 · P18

参照入口：`/next/reviews/grading-function-area`。源码：`components/prism-next/demos/grading-function-area.tsx`；八态分别使用 380 × 844px 容器，在 light / paper / dark 三主题下共 24 栏。此页是组件组合参照与回归夹具，不新增组件目录条目，不实现 Workspace 的保存、导航、统计或批阅服务。

## 来源与复用依据

按顺序完整读取 Builder preamble、仓库 AGENTS、`prism/task-P18.md`；以 Supervisor `ws/w39-design/gen.mjs` 的八态画布为任务来源，并核对 `W39-Report.md` 的七处提案、`w39-checks/review.md` 和 `editor-notes.md`。既有 QuestionInspector / ScoreReview / ErrorCauseReview / StudentPaperReport 文档与 demo、两份冻结设计文档和框架入口作为基准。

本轮复读固定 coss Frame / FrameHeader / FrameFooter、Collapsible / Trigger / Panel、Alert、Button、ScrollArea；基础控件保持标准尺寸。particles 的 `p-frame-1`、`p-collapsible-1`、`p-toolbar-1`、`p-meter-3/4`、`p-number-field-1/10` 和 Beautiful UI Approval Card / Recommendation Card 取舍沿用上述组件文档的离线记录：前者可支持布局/折叠/量值，后者不包含题目分数、错因草稿和整卷统计契约。现有组件加可选属性已经足够承接本轮结构；不复制第三方代码，不新增视觉令牌，也不声称本轮联网重新检索。

## Workspace 可直接采用的属性组合

查看态公共属性如下；`footer` 使 `bodyOnly` 也包含唯一正文滚动区与固定动作区。宿主外层须有确定高度、`min-h-0` 和 `overflow-hidden`，不要再套第二个正文 ScrollArea。题号/状态/整卷入口/上下一题留在宿主固定头部。

```tsx
<QuestionInspector
  bodyOnly density="compact"
  showEvidence={false} showConfidence={false}
  showKnowledge={false} showComparison={false}
  title={questionLabel} status={status}
  navigation={navigation} onStep={onStep} onWrong={onWrong} actions={[]}
  score={currentScore} points={currentPoints}
  evidence={null} knowledge={[]} comparison={[]}
  scoreSource={source} afterScore={previousScore}
  afterPoints={<>{causeReview}{readOnlyDetails}</>}
  footer={viewActions}
/>
```

其中分数、点分、来源与状态均直接映射宿主事实。错因采用 `ErrorCauseReview density="compact" editLabel="修改错因" hideEditAction editing={editing} draft={draft}`，由 `footer` 中的“修改错因”动作准备独立草稿并进入受控编辑。保存仍由 `onSave` 向宿主发意图；隐藏内部入口后，宿主负责外置入口的焦点返回。

| 画布状态 | 属性与内容组合 |
| --- | --- |
| ① AI 已批完 · 有失分 | 上述 QuestionInspector；当前 6/10 与 3/3、2/4、1/3 点分；`scoreSource` 为 AI 批阅；`afterPoints` 放只读错因和三个默认折叠详情；footer 为修改评分 / 修改错因 / 重新 AI 批阅。 |
| ② AI 已批完 · 全对 | 同查看态；当前 3/3、来源 AI；无 ErrorCauseReview；afterPoints 放学生 B / 标准 B 对照与标准解析、修改记录；footer 仅修改评分 / 重新 AI 批阅。 |
| ③ 待你确认 | `ScoreReview mode="confirm" density="compact" showIdentity={false} showConfidence={false} showBasis={false} instruction={false}`；AI 建议 6 分、原因与只读点分；`onSave` 是采纳意图、失败使用 `onRetry`，`onEdit` 进入④；`actionLabels.save="采纳 6 分 · 下一题"`。不传 `onAcceptAi`，只有一个采纳动作。 |
| ④ 改分中 | `ScoreReview mode="edit"`，同 compact / 隐藏重复身份与说明；受控 points / reason / selectedReasonId / unanswered；`scoreContext="原 6 分"`；`requireReasonSelection`；`onCancel` 取消当前评分草稿，`onSave` 保存意图；保存文案由宿主草稿得分构造。 |
| ⑤ 待你批阅 | 宿主常显原 coss Alert 说明扫描模糊；`ScoreReview mode="manual"`，初始 points 的 score 为 null；`showReason={false}`，`saveDisabledReason="请给全评分点。"`，完整给分后移除该原因；提供未作答意图；`actionLabels.save="保存 · 下一题"`；无 AI 建议、接受动作或取消。 |
| ⑥ 你已修改 | QuestionInspector 当前分 8/10、当前点分 3/3、4/4、1/3；`scoreSource=<Badge>你已修改</Badge>`；`afterScore="原 AI 批阅 6 分 · 作答步骤正确，AI 漏判"`；错因为表达不规范。原 AI 分、教师理由和修改记录是独立外部事实。 |
| ⑦ 暂停 / 等待重新批阅 | 原 coss Alert 两个独立外部状态参照：暂停时只发“核对解析”，等待时没有重新批阅动作；不挂 ScoreReview 或错因编辑；单一 ScrollArea 含标准解析与保留的旧结果修改记录。两张提示同时出现在此参照栏，不表示宿主同时处于两状态。 |
| ⑧ 没选题 · 整卷报告 | `StudentPaperReport density="compact"`；外供 78/100、已批 20、待处理 2、四档计数和归因量值；`onFirstPending` 仅定位意图。宿主单一 ScrollArea 包含报告，外部固定 footer 放 AI 分析说明及重新 AI 批阅整卷动作。 |

③④⑤的折叠共用：`sectionsPlacement="bottom"`、`sectionsDefaultOpen={{answer:false,standardAnswer:false,history:false}}`、`sectionLabels={{answer:"学生作答文字",standardAnswer:"标准答案与解析",history:"修改记录"}}`。按已知资料提供 answer / standardAnswer / history。compact 的唯一 `data-score-review-body` 正文滚动，动作行在其外；宿主使用 `min-h-0 flex-1` 提供可用高度。

## 事实、草稿与回执

此页允许①②⑥“修改评分”和③“改分”进入本地④草稿，取消恢复查看/确认；“修改错因”打开独立受控草稿。评分和错因保存、采纳、重新批阅、待办定位及题目导航仅显示“已请求……等待宿主处理；当前事实保持不变”。不生成 saving / saved / failed，不追加历史，不把保存点击转换成⑥，不自动推进。⑥是独立的已保存事实夹具。

示例宿主在评分模式实际变化后，通过渲染完成的 effect 聚焦带名称的功能栏 region；首次挂载和仅修改草稿时不移焦。错因取消后，待外置“修改错因”按钮重新启用，再由 effect 把焦点交还该入口。ErrorCauseReview 仍负责进入编辑时的分类焦点。探针只验证移交时机与目标，真实浏览器/读屏器表现仍需验收。

真实接入仍由 Workspace 控制两个草稿、权限/版本/并发门禁、幂等 operation ID、服务请求、回执、失败保稿、成功才推进、离开保护与焦点移交。组件页不复制这些业务能力。未作答优先显示 0 分但不清空逐点草稿，未知人工点分不按 0 处理。

## 与画布仍有的差异

- ②保留 QuestionInspector 固定“评分点”标题与“未提供”空态；本轮公开 API 没有 `showPoints`，不能使用 CSS 或 DOM 裁剪隐藏。作答对照仍按画布放在其后。
- QuestionInspector 保留原得分量表、评分判断徽标和评分点列表样式；画布的自画描边行、字号/字重与按钮尺寸没有复制。所有内容使用既有语义字号、coss / Prism 视觉与控件尺寸。
- ⑤仍保留 ScoreReview 固定的“学生作答文字”折叠入口，展开明确显示 OCR 未提供；本轮没有 `showAnswer`。常显失败原因在原 coss Alert 中，不能藏进折叠正文。
- StudentPaperReport 保留既有学生、状态、统计范围、失分总量与来源说明，待办按钮仍名为“定位第一道待办题”；不裁剪内部块或改写原组件来拟合画布。参考值为当前已提供范围，18 分失分明细与 78/100 当前总分均直接来自夹具，不互相反推。
- 查看态详情折叠为宿主 coss 组合，保存前后历史只读呈现；未新增独立 ScoreReviewHistory API。只有 ScoreReview 自身负责③④⑤评分历史。

以上是明确保留的范围差异，不是浏览器验收结论；实际尺寸、换行、滚动与动作是否始终可见仍由 Supervisor 检查。

## 交给 Supervisor 的浏览器验收清单

URL：`/next/reviews/grading-function-area`。light / paper / dark × 固定 380×844 容器；另在 320px 窄视口检查缩窄后的操作可达与长中文/公式。三主题初始画面应各有①–⑧，组件尺寸和语义字号一致。

1. ①②⑥核对得分来源同排、⑥原 AI 分下一行、当前点分和错因；无 AI 依据/置信度/知识点/班级对比。修改评分→输入草稿→取消，回到原事实；保存只有请求提示。
2. ③仅 AI 建议/原因/只读点评分与底部改分/采纳；采纳后仍在③且没有假回执。改分进入④，取消回③；④选其他但空理由不能保存，给理由可请求保存，未作答切换保留点评分。
3. ⑤初始三点未知、保存禁用且解释常显；给全评分点后可请求保存，仍不生成服务回执。核对未出现 AI 建议/接受/恢复/取消。
4. ①⑥外置“修改错因”打开受控编辑，其他分类必填说明，保存保稿、取消复原；检查键盘与宿主外置入口焦点返回。评分草稿与错因草稿不相互覆盖。
5. 展开标准解析、学生作答和修改记录，用 Tab/Enter/Space 操作，检查长中文、公式与折叠状态；滚动展开后的正文，①–⑥的主动作仍在各自固定底部，页内没有嵌套正文滚动区。
6. ⑦只允许核对解析，等待提示不提供评分/错因编辑；⑧待办定位和整卷重新批阅仅记录请求，20/2 与分数保持不变，整卷 footer 不随正文滚动。

自动化：`tests/grading-function-area.test.mjs` 覆盖 24 栏/主题/尺寸、八态显示与隐藏结构、手工未知点分、独立草稿与意图边界、渲染后焦点移交策略、构建路由。最终数字与冻结页 `<main>` 对比统一见 P18 总报告。

未验证范围：浏览器验收：按分工由 Supervisor 执行。真实 AI / OCR / 服务端保存、Workspace 接入、实际屏幕尺寸与滚动、真实键盘焦点、移动真机和读屏器未验证。

P19：⑧ 整卷报告使用 `pendingEmphasis="strong"`，warning 色调待办区置于报告标题之前，数量加重，标准主按钮带右箭头；仍仅记录定位请求。
