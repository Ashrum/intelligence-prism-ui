# P83 实现与复用

- 来源基线：bb85dd96270a421db5fa5626a1dda17c97e1e8e7，分支 feat/agent-mark-glyph，开工工作树干净。
- 检索命中现有 AgentMark 的 Drive / Orbit / Dots、agent-conversation.css 的点阵关键帧与 reduced-motion 媒体规则；现有 Prism 已满足图形与动效来源，不引入 coss particles 或第三方代码。无联网检索。
- glyph 固定 16px 不收缩行首槽、内部 13px 九宫格；独立呈现分支仅含具名 img 和 aria-hidden 点阵，不产生文字、耗时或 live region。
- Effect 以 size 为依赖，并在 glyph 时提前返回，切换尺寸会清理先前 interval。保留 inline/loading 原呈现与行为。
- 运行态沿用 foreground，保持身份状态位的语义，不借用链接颜色。等待与错误沿用 warning/destructive 前景色，不新增令牌。
- 只对 glyph 新增两蓝图圆角归零规则，排除嵌套非蓝图预览根和后代。核心三主题 Dots 仍圆形，Drive/Orbit 保持原形状。
- CSS reduce 媒体规则直接覆盖动画与 opacity，覆盖首次加载和偏好运行中变化；不新增 JS 订阅或计时器。实际系统切换、视觉与 accessibility tree 交 Supervisor。
- 必要示例扩展：既有 AgentMark 组件页共享 MarkSamples 增加 3 变体 × 6 状态的 glyph 静态事实夹具，不新增路由或目录条目，startedAt=0 用于核验无耗时。
- 新增专项 5 项，含 72 组 inline/loading SSR 基线逐字比较、Effect 探针与 9 项内存回退变异（角色、名称、live region、动画状态、计时 guard、尺寸依赖、点阵尺寸、reduce、蓝图圆角）。探针与 CSS 源级断言不等同浏览器验收。
