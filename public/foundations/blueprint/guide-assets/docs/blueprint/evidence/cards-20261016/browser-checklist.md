# 交给 Supervisor 的浏览器验收清单 · P79

本轮 Builder 未调用浏览器或启动 / 重启服务。以下均为待验，不是已通过。

- URL：`http://localhost:5173/next/foundations/blueprint#object-section-cards`，以 Supervisor 当前服务端口为准；基线 `8270cce` + P79 工作树。
- 矩阵：light / paper / dark / blueprint / blueprint-night × 1280×900、320×800，共 10 个页面状态。分别确认外框直角无阴影、Frame 标题栏反相、Section 1.5px 结构线和 A/B 方块、正文留白与公式阅读。记录实际日期、宽高、主题、路径、基线及截图。新截图建议 `docs/blueprint/screens/cards-20261016/<主题>-<宽度>-<内容>.png`，本轮未预建空截图目录。
- Frame 初态：`作答原件 · 完整扫描纸`，`第 1 / 2 份作答`，实际扫描夹具图；上一份禁用。Tab 到“查看下一份原件”，Enter / Space 后显示 `作答原件 · 裁切作答未提供`、`第 2 / 2 份作答 · 未提供原图`、`此份作答未提供原图，无法预览。`；下一份禁用，上一份可回到原件图。未提供原图不写成加载失败。
- Section：A 选择题 / 第 1 题 · 共 1 题，B 填空题 / 第 2 题 · 共 1 题；A/B 顺序对应实际两个分节。Tab 到“查看选择题作答说明”，Enter / Space 展开“每题只有一个正确选项，请在答题卡中填写。”，aria-expanded 跟随，再次激活收起。焦点可见、未裁切、阅读与 Tab 顺序自然。
- 320：标题、状态、meta 和操作槽按可用宽度换行；长中文 / 连续英文文件名替换夹具时能完整读到，不能只以无溢出判定布局合格；字母保持正方形，公式不挤成不可读。1280 检查标题左、状态 / meta 与操作右的层次。
- 状态：五 tone 均需配真实事实文字；图标仅装饰。工程数值已记录色块填充与边界两者对比，部分填充不足 3:1 依靠高对比细边界与文本，浏览器须复核小方块可辨及状态文字可读。
- 扩展夹具复核：分别省略 status / letter / meta / action，不留空槽；用现有 BpCodebox 放入 SectionCard，仍是原代码块滚动行为，无重复 SHEET 标尺。对于无真实顺序的分节不传 letter。
- 嵌套隔离：在蓝图和夜图页面内放 `data-agent-preview` 核心 light / paper / dark 预览，同时检查显式选用卡片的中性回退及普通 coss Card/Button 不受影响；反向在核心主题放蓝图 / 夜图预览。检查根、后代及既有伪元素；本轮新类无伪元素。
- Workspace 未来接入与所需文件见 inspection.md 的只读映射；本轮未修改 Workspace，不用本页通过代替 `/teacher/agent/workspace` 的接入验收。
