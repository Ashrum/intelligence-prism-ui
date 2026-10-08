# TextbookDirectory 内嵌大纲目录

PO 2026-10-08 选定 A。仍使用 `tree` 目录项和 `/next/components/tree`；不新增教材组件条目。公共入口 `components/prism-next/textbook-directory.tsx` 导出组件、`TextbookDirectoryProps`、`TextbookDefinition`、`TextbookSubject`、`DirectorySelections`、`DirectoryAllOption`、`DirectoryCounts` 和 `firstLeafSelection(data): string[]`。

旧 split 与未使用新属性的 embedded 保持逐字节输出。`layout="embedded"` 配合 `allOption / counts / subjects / currentNodes` 任一新属性或 `multiSelect="dialog"` 启用大纲树。新形态标题默认 select（旧形态 locate）；建议明确传 `titleAction="select" multiSelect="dialog" allOption={{}}`。

| 新属性 | 契约 |
| --- | --- |
| `allOption?: {label?,ariaLabel?}` | 独立首项，默认“全部”；空叶数组为全部，单选再点幂等，清空仅当前 scope。可访问名称默认区分课程/知识点 |
| `counts?: Readonly<Record<string,number>>` | 按目录 nodeId；整本题数放该目录 rootId，保留0、缺省不显示；多选底部仅当归并条目均有宿主题数时求和，缺数不推算 |
| `currentNodes? / onCurrentNodesChange?` | `Record<scope,string>` 与 React state updater，配对使用；scope 为 `${book.id}:${kind}`。选择叶集相同也保留精确父节点身份；只在 ID 有效且完整叶集匹配时呈现。全部或改变多选后清身份，未改多选确认保留 |
| `subjects?` | `{name,teaching?,editions:{title,recent?}[]}[]`；任教/最近优先及标记来自宿主，不记录使用次数；缺省保持教材次序 |
| `bookId? / onBookChange?` | 可选受控当前教材；未传 bookId 为局部导航，确认切换后回调；无效 ID 只显示首本回退，不自动发变更 |
| `kind? / onKindChange?` | 新形态可选受控 course/knowledge；未传沿用本地页签和已有 presentation context |
| `TextbookDefinition.volumeDescription?` | 册次可选年级/学期说明 |

`multiSelect="dialog"`：外部树单选呈现，多项受控选择标出归并范围；“多选”草稿对话框只编辑打开时当前教材的当前目录种类，标题为“选择多个章节”或“选择多个知识点”，无种类页签、教材信息、搜索框。取消/Esc 不提交，确认仅更新该 scope，其他目录、教材及其精确节点身份不动。`always` 保留复选框，`toggle` 显式切换复选框；关闭多选时多于一组只清当前 scope。`titleAction="locate"` 在单选呈现时只定位，复选多选状态仍通过勾选改范围。多教材且无 onTextbookSwitch 时使用“选择教材”三段对话框；宿主回调优先，单教材无回调隐藏切换。

P42 两个对话框继续复用 DialogLayout：

- 教材：约760px、最高85dvh，主体按学科→版本→册次纵向排列，无搜索。多学科学科栏使用标准 ToggleGroup，任教在前、有“我的任教”小标记及组间分隔，溢出横向滚动；只有一个学科时隐藏。切换学科落到宿主最近使用版本（没有则首个），更新册次候选，不自动选册或确认。
- 版本：小号 ToggleGroup 换行，最近优先并有带可访问名称的小圆点；按实际行位置测量，超过三行才出现“展开全部”。测量副本 inert/aria-hidden 且不撑大滚动区域；折叠项不在可交互组中。选中项超出三行时保持展开，防止隐藏选择。
- 册次：复用头部56×74放大书封面，学科名在封面，当前册角标“当前”；整卡使用 coss Toggle 选中底色与焦点环，完整教材名、年级/学期和当前身份进入可访问名称。桌面4–6列、窄屏2–3列；>12册时网格局部滚动。一般规模随内容定高，不设置分段滚动盒；窄屏、低视口或展开大量版本时正文可滚动，以保证所有选项可达。
- 头部只保留“选择教材”与“当前：<全称>”。未变化显示“尚未改变”并禁用确认；切换学科/版本尚未选册时显示“请选择册次”；已选不同册显示“确认后切换到 <教材全称>”。
- 多选：约820px、80dvh，桌面左右3:2、窄屏上下3:2，头尾固定、两栏分别滚动。左侧“可选”与全选/清空，沿用大纲行；部分选中的父节点在题数右侧显示“已选 x/y”（所含叶节点数）。右侧 muted 面板按第一级祖先分组，可移除归并条目，整章只列“整章”（知识领域为“整个领域”）。空态“在左侧勾选后，这里列出已选内容”。底部“已选 n 项”，归并条目题数完整才追加“共 m 题”，不重复累计父子节点、不把未知当零；确认按钮“确认（n）”。常驻操作说明只保留 sr-only。

单行章编号、题数列、单引导线、最多24px缩进、第4/5层次要文字；完整名称保留 aria-label/title。全部不进入父子勾选且搜索无结果时仍显示；全部↓/→进入树、树首项↑/Home返回，标题 Enter/Space 与箭头展开分离；DialogLayout 负责焦点与关闭。对话框只说明选择，不承诺已查询题目。

默认第一课和记忆属于宿主。调用 `firstLeafSelection(courseData)` 初始化课程，知识点可设 `[]`；按教材+kind 保存 selections 与 currentNodes，先恢复再写入，外部删除节点时由宿主选择回退策略。组件本身不访问存储、不自动选择。组件页演示宿主使用 sessionStorage，包含坏 JSON/过期 ID/存储拒绝回退与清除本示例记忆；2–5级、单/多教材、题数开关、240/280/320px 与长中文公式。

复用检索：既有 TextbookDirectory / Tree / DialogLayout，coss Button/InputGroup/Tabs/ToggleGroup/Separator/RadioGroup；本地 particles p-dialog-5、p-input-group-22、p-select-6/7/18。P42 采用 ToggleGroup 与既有封面/大纲组合，未采用搜索输入和下拉选择；无新增公共组件。沙箱不联网，未刷新上游；无 coss/依赖/令牌改动。浏览器验收按分工由 Supervisor 执行。
