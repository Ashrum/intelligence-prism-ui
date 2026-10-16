# P73 · CI-11 Portal 组件侧核查

日期：2026-10-16。基线 `5644554aa6920fdbffdcbd1fdac617c20af1cc2e` 加本轮 diff。只读核查，不是浏览器挂载或 Workspace 接入验收。

固定 coss Menu / Popover / Select / Dialog / Tooltip 的 Popup 均提供 `portalProps` 并原样转发给 Base UI Portal。11 项 R1 测试中的第 10 项用五个真实 Popup 函数检查 container 引用、主题及预览属性，第 11 项检查 PromptBar 的根引用与裁切边界；删除每个转发的内存变异均被检出。Combobox 同样支持 `portalProps`（`components/coss/combobox.tsx:158–205`），本轮仅源码核查，未将其列入五类函数探针的已测结果。

本地固定 Base UI 1.8.0 的 MenuPortal / SelectPortal / PopoverPortal 注释和实现明确默认挂到 body；现有组件中的局部 DOM 主题不会跨 Portal 自然继承。**原语能承载边界，不等于全部 Agent 调用已传递边界。** PromptBar / Voice 的既有就地容器支持局部预览；下表其余调用应在 R2 / 对应页面接入时补接宿主主题容器或隔离主题根，并复核焦点返回、定位与裁切。不得将整个 body 改成蓝图而影响其他教师页面，也不能只给触发器加主题属性。

## 实际 Agent 内部调用

| 源文件与行号 | Popup | 当前容器 / 后续责任 |
| --- | --- | --- |
| `components/prism-next/agent-artifact-output.tsx:114` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-capture-scan.tsx:191` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-collection-basket.tsx:263` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-collection-basket.tsx:300` | MenuPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-collection-basket.tsx:328` | DialogPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-constraint-builder.tsx:142` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-distribution-matrix.tsx:112` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-material-pack.tsx:266` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-object-picker.tsx:174` | ComboboxPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-parameter-config.tsx:136` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-path-priority.tsx:161` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-path-priority.tsx:175` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-plan-builder.tsx:199` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-prompt-bar.tsx:86` | PopoverPopup | 已传 root / portalContainer；PromptBar 使用输入表面外层根 |
| `components/prism-next/agent-prompt-bar.tsx:125` | MenuPopup | 已传 root / portalContainer；PromptBar 使用输入表面外层根 |
| `components/prism-next/agent-prompt-bar.tsx:136` | MenuPopup | 已传 root / portalContainer；PromptBar 使用输入表面外层根 |
| `components/prism-next/agent-structure-arranger.tsx:78` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-structure-arranger.tsx:191` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-suggestion-set.tsx:150` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-template-picker.tsx:123` | SelectPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-visual-parts.tsx:81` | PopoverPopup | 未传；默认 body，R2 按实际调用位置传递主题边界 |
| `components/prism-next/agent-voice.tsx:72` | PopoverPopup | 已传 root / portalContainer；PromptBar 使用输入表面外层根 |

扫描覆盖 `components/prism-next/agent*.tsx` 的直接 Popup 调用；这是本轮组件侧调用清单，不宣称覆盖所有业务插槽中的自定义浮层。上述默认 body 的调用多处位于封装内部，R2 不能只从组件外给一个无效 prop：应核对具体导入和封装是否透传；如宿主无法接入，再按 CI-11 将可复现的具体封装缺口交回 CMP，避免预先改造全库。

## 示例与宿主边界

`demos/agent-patterns.tsx`、`agent-record-views.tsx`、`agent-semantic-group.tsx` 的 Dialog，`agent-scope-builder.tsx` 的日历 Popover，`agent-capture-scan.tsx` 的 AlertDialog，以及集合示例的宿主自定义 Menu 属于示例 / 宿主组合。未据它们新增组件运行时或业务 Store。Tooltip 在本轮 Agent 组件直接调用扫描中未出现；仍验证了共享 TooltipPopup 容器能力。

`blueprint-foundation-demo.tsx`、`blueprint-second-batch-demo.tsx` 已有 Select / Dialog / Menu / Popover / Tooltip / Combobox 等显式 portalRoot 夹具，供 Supervisor 对比共享原语。PromptBar 的来源 / 命令 Popover、添加 Menu、模型 Menu 与语音说明需要重点检查局部主题与全局主题相反时的真实浮层。

## 处置

本轮未发现共享 coss 原语无法承载主题边界的缺口，故未修改冻结 coss、未新增主题 Provider / Portal 封装、未给其他 42 项组件批量加 prop。宿主传递按 P73 / CI-11 留给 Workspace R2；以上未绑定调用是交接项，不是本轮已修复或已通过的主题结果。
