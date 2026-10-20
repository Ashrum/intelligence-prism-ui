# BPM1e · 剩余四类探针修正

2026-10-19；基线 `c2dd2239b97963e12f7cf7cb3924328958e68a68`；分支 `docs/blueprint-matrix-closeout-2`。开工已有 BPM1d 修改和 Supervisor 重跑证据，不是干净工作树。本轮只改本目录证据脚本、说明与 `STATUS.md`；产品源码、CSS、工程测试、依赖、冻结 coss 均未修改。本轮无浏览器执行、服务管理、提交、推送或发布；不作 Builder 自我批准。

## 已有实测与保留策略

| 组 | BPM1d Supervisor 重跑结果（BPM1e 未重跑） |
| --- | --- |
| matrix | 645 pass；645 pending-visual |
| isolation | 132 pass；18 error |
| interactions | 1500 pass / 1500 |
| per-round | 955 pass；15 observed；116 pending-visual；20 error；5 fail |

四组结果及四组截图索引保持原字节。[BPM1d 归档](bpm1d-supervisor-run.json.gz) 保存 14 份文件的完整 UTF-8 文本与 SHA-256（含结果/索引、来源目录、当时脚本和 validation）。原失败仍在 [isolation.json](isolation.json) 与 [per-round.json](per-round.json)，未改写为修正后通过。开工状态见 [快照](bpm1e-before-status.txt)。本轮增量见 [bpm1e-scripts.diff](bpm1e-scripts.diff)；[scope.diff](scope.diff) 是 STATUS 相对 HEAD 的累计差异。

## 四类结论

### 1. P87 嵌套隔离：诊断缺失已修正，另有源码支持的疑似缺陷

18 error 均是外层 light/paper/dark、内层 blueprint/blueprint-night、宽度 320/768/1280。旧探针只比较 `color / backgroundColor / borderTop / borderBottom / outline / boxShadow / fontSize / fontWeight`，**没有 transform / opacity**；不能仅凭锁框和 halo 动画解释旧失败。旧结果未保存不同属性的值，无法还原实测的具体颜色。

源码依据：`app/(next)/next/blueprint.css` P87 段 482–524 行：

- 484 行 `.bp-target-lock` 和 490 行 `.bp-diagram-callout` 默认使用 `color:var(--foreground)`。
- 514 行主题强调规则是主题祖先 + 后代组合：`:is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"]) :is(.bp-target-lock,.bp-diagram-callout,.bp-entry-row[data-emphasis] .bp-entry-row-action):not(...)`，设为 `color:var(--link)`。
- 当这两个组件**自身就是** `[data-agent-preview][data-prism-theme="blueprint"]` 根、外层为核心主题时，根没有匹配的蓝图祖先；而同主题外层对照有此祖先。整张 sheet 中的后代与 entry-row 的 action 后代不具备同样的根匹配缺口。此推理与现有“sheet/entry-row 相等，lock/callout 不等”的分布一致，但尚不是动画稳定后的实测结论。

修正后的 `entry-isolation`：先设置 reduced-motion；克隆前后均等待有限动画 finished，若有无限动画则暂停并置于同一个 `currentTime=0`，等待 ready；超时仍失败。**不排除任何比较属性**，扩大为 25 个属性，含四边边框、圆角、字体、阴影、fill/stroke、transform/opacity 和根/全部后代/`::before`/`::after`。每条差异保存节点路径、class、伪元素、属性名、expected/actual、两侧主题强调选择器是否匹配、foreground/link token；记录 P87 来源路径、行号和完整选择器。断言前先写 `row.measured`，稳定后仍不等则明确标为“疑似缺陷”并 fail，交 Supervisor 复核，不改 CSS 或放宽颜色等断言。

### 2. P74 选项超时：探针问题

原错误栈指向 `scoped-controls` 中 `picker.fill('高二')` 后的全页 `getByRole('option').first()`。实际是 [AgentObjectPicker](../../../../components/prism-next/agent-object-picker.tsx) 的搜索候选，**不是材料 Select**。[P74 夹具](../../../../components/prism-next/demos/portal-scope.tsx) 保留 query/selected 状态；循环只切换外层主题，重复 fill 同一个字符串不保证重新打开 Combobox。候选为“高二三班”“高二四班 · 长中文教学主题与跨课次讲评材料”，真实打开按钮为“查看班级候选”；选项仍使用 option 角色。

修正：每个外层循环先移除旧选择，搜索“高二”；若 `aria-expanded` 不是 true，使用真实候选按钮打开；在**可见 combobox-popup 内**等待并核对两条候选，再 ArrowDown/Enter 选择，核对“已选 1 项”和具体班级。保留材料 Select 的 ArrowDown/End/Enter，增加其真实 select-popup 内选项等待。Dialog 首焦、Tab/Shift+Tab trap、内层 Select Esc 和 Dialog Esc 回焦仍严格检查。逐外层记录选中值、打开前 query/expanded、候选和选中摘要，便于后续失败定位。

### 3. P87 320px 标尺追踪：探针适用范围问题

`app/(next)/next/blueprint.css` 375–377 行在 max-width:760px 下隐藏标尺，388–390 行还有内容容器宽度规则。320px 下不等待四个反白标记。改为鼠标进入图纸时检查四条标尺全部 `display:none`、无布局矩形、无可见反白；离开后还须无 `data-active` 残留。本项记录 `trackingApplicable:false`，通过只表示隐藏/清理契约通过。当前矩阵的 768/1280 仍执行原坐标与离开清除断言；entry-selection / entry-motion 保持原状态测试，视觉解释仍须结合隐藏规则。

### 4. 首批 320px + CSS zoom 2：超出原验收范围的观察

原始 [checks.md 第 24 行](../common-20261015/checks.md) 明确写“CSS zoom: 2 at 1280px”；[原始 matrix.json](../common-20261015/matrix.json) 的 `magnification` 记录 `innerWidth:1280, zoom:"2", scrollWidth:1265`；第二批回归的 [first-matrix.json](../batch2-20261016/first-matrix.json) 同样为 1280。普通布局包含 320/768/1280 不等于在这些宽度都验证过 zoom 2。

现有 5 个失败均为 320 + zoom2，实测 client=320 / scroll=640，越界元素已有 header、主题选择器、prism-content、图纸等；这些旧记录和诊断原样保留。按本次委派，仅在未来重跑时将 **320 的 CSS zoom 投影**记为 `observed / pass:null`，保留 geometry、offenders、原证据路径与 1280 范围说明。768/1280 仍保留无溢出门槛；print 的断言先执行，不因 320 观察分类而略过。CSS zoom 与原生 200% 缩放不等价，原生缩放列入下方目检。

## 离线验证

- `node --check`：11 个证据脚本退出 0，含本轮 `round-probes.mjs`、`bpm1e-audit.mjs`。
- `offline-audit.mjs`：原 12/12 合成时序/焦点/策略检查通过。
- `bpm1e-audit.mjs`：6/6 合成检查通过；直接调用本轮探针，覆盖有限动画等待、无限动画统一时间、伪元素属性故障能失败并保留值、320 观察保留溢出、768/1280 溢出仍失败、320 print 回归仍失败、标尺隐藏与无残留、标尺可见/残留故障仍失败。使用模拟 DOM/时钟接口，不是浏览器执行。开发中修正了合成 harness 的 VM 跨 realm 数组序列化，使其模拟 Playwright 返回 JSON 的行为；未为此改变探针断言。
- fixture 定向 TypeScript：0 诊断；不是全仓类型检查结论。
- `measure.mjs --plan`：只生成独立计划，四组结果及索引共 8 文件 SHA-256 不变；计划 4051 行。
- `validate.mjs`：22/22 静态检查，16 条子命令退出 0；包括原始 zoom 范围、P87 选择器行号、归档散列和历史段落完整性。最终数字与命令见 [validation.json](validation.json)。
- 本轮不需要产品构建或全量工程测试；未运行、未沿用旧通过数。

## 交给 Supervisor 的浏览器验收清单

使用 Supervisor 已核对工作树/分支的现有服务，只需重跑 **isolation、per-round**。matrix 和 interactions 当前实测不受本轮探针修改影响，不要求重复；历史目检义务仍在。

```sh
node docs/blueprint/evidence/matrix-closeout-20261019/measure.mjs --run --group=isolation --replace
node docs/blueprint/evidence/matrix-closeout-20261019/measure.mjs --run --group=per-round --replace
node docs/blueprint/evidence/matrix-closeout-20261019/validate.mjs
```

`--replace` 覆盖相应组 JSON 和同名截图。本轮 BPM1d JSON/索引已归档；如需保留旧截图像素，应在重跑前复制到有版本的本机证据目录，归档不内嵌 PNG。本轮 Builder 未生成或修改截图。

| URL（现有默认服务） | 操作路径与应看到的状态 | 主题、宽度 |
| --- | --- | --- |
| `http://localhost:5173/next/foundations/blueprint#entry-annotations` | 重跑 isolation，重点查看 lock/callout 自身为预览根的 `differences`；reduce 后如仍有颜色/边框/字体/伪元素差异，以两侧值和 P87 选择器为依据登记疑似缺陷；不将无动画等同隔离通过 | 外/内层各 light、paper、dark、blueprint、blueprint-night；320/768/1280，重点核心外层 × 蓝图/夜图内层的 18 组合 |
| `http://localhost:5173/next/components/menu#portal-scope` | 每个外层：Select ArrowDown/End/Enter 显示“长中文课堂练习与讲评材料”；搜索“高二”，打开“查看班级候选”，两条班级候选，键盘选择后“已选 1 项”；打开“局部对话框”，首焦“材料标题”，Tab/Shift+Tab 不逃出；嵌套 Select 一次 Esc 回内触发器，再 Esc 回“局部对话框” | 局部五主题 × 外层 light/paper/dark；320/768/1280 |
| `http://localhost:5173/next/foundations/blueprint#entry-annotations` | 320：鼠标进入/离开后标尺不可见，无可见反白，离开无 active 残留。768/1280：坐标标记与离开清除；另检查入口 hover/Tab、节点框/标签、reduce 静态高亮与内容换行。注意内容容器规则也可能隐藏标尺，不把 DOM active 当作视觉可见证据 | 五主题 ×320/768/1280；重点 blueprint/light 的320/1280，补夜图 |
| `http://localhost:5173/next/foundations/blueprint#common-components` | 保留 CSS zoom2 的真实 geometry；320 显示观察而非通过，1280 对照原验收，768 仍严格断言。用浏览器菜单进行原生 200% 缩放，记录缩放前后 CSS viewport/DPR/visualViewport、正文重排、长中文/公式滚动、浮层及焦点；不要用 CSS zoom 替代。print media 无投影也不等于打印预览通过 | 五主题；CSS 320/768/1280；原生至少桌面1280与代表窄窗320，记录缩放后的实际可用宽度 |

## 未验证范围

浏览器验收：按分工由 Supervisor 执行。修改后的实际 DOM 交互、稳定后 P87 两侧属性值、主题/视觉/键盘、原生 200% 缩放与打印预览待 Supervisor；真实服务、Workspace、真机触控、读屏器和实体打印未验。本轮属于同轮探针返工，旧周期 3/3 累计浏览器矩阵与独立综合审查仍待收口；P87 未验收，不新增完成轮、不重置周期、不宣布收口。
