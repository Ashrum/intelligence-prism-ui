"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/coss/tabs"
import { QuestionMath } from "../question-content"
import { useHorizontalChoiceScroll } from "../use-horizontal-choice-scroll"
import { BlueprintFoundationDemo } from "../blueprint-foundation-demo"
import { BlueprintSecondBatchDemo } from "../blueprint-second-batch-demo"
import { BlueprintSheet, BpAnnotatedText, BpAnnotationList, BpButton, BpCallout, BpCard, BpCardNote, BpCodebox, BpError, BpFacts, BpFigCap, BpMetric, BpMetricLegend, BpMinor, BpPaneHead, BpSegTabs, BpSizeBar, BpSteps, BpTitleBlock, BpToast, BpTool } from "../blueprint/blueprint"

const tabs = [{ value: "all", label: "全部" }, { value: "todo", label: "待批阅" }, { value: "review", label: "待复核" }, { value: "locked", label: "已锁定", disabled: true }, { value: "done", label: "已完成" }, { value: "issue", label: "异常" }]
const tabNotes: Record<string, string> = { all: "42 份答卷", todo: "9 份等待 AI 批阅", review: "7 份需要教师确认", done: "22 份已出分", issue: "4 份未提交或扫描失败" }
const views = [{ value: "blueprint", label: "blueprint", description: "工程图纸，适合结构与流程" }, { value: "paper", label: "paper", description: "暖纸，适合长中文题干与公式推导的连续阅读" }, { value: "light", label: "light", description: "浅色，日常工作" }]
const steps = [{ id: "upload", label: "上传答卷" }, { id: "ai", label: "AI 批阅" }, { id: "review", label: "教师复核" }]
const cards = [{ name: "flow", description: "查看本页的固定步骤快照。", href: "#actions" }, { name: "timeline", description: "查看本页的数据排版示例。", href: "#data" }, { name: "limits", description: "静态卡片：展示得分与及格线的关系。", href: undefined }]
const Thumb = ({ label }: { label: string }) => <span className="absolute inset-3.5 grid place-items-center border border-dashed border-border font-mono text-ui-meta text-muted-foreground">{label}</span>

export function BlueprintComponentsDemo() {
  const [tab, setTab] = useState("all")
  const [view, setView] = useState("blueprint")
  const [reading, setReading] = useState("question")
  const readingScroll = useHorizontalChoiceScroll(reading)
  const [actionPreview, setActionPreview] = useState("点击按钮查看样式反馈；此页不执行批阅或发布。")
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }
  return <div className="bp-demo space-y-8">
    <nav aria-label="蓝图示例导航" className="flex flex-wrap gap-x-5 gap-y-2 text-ui-hint">
      <a href="#common-components">常用基础组件</a>
      <a href="#common-components-two">第二批常用组件</a>
      <a href="#actions">蓝图按钮与标签页</a>
    </nav>
    <BlueprintFoundationDemo />
    <BlueprintSecondBatchDemo />
    <p className="border-l-2 border-(--line) pl-4 text-ui-hint text-muted-foreground">样式与状态样板 · 下方班级、答卷、评分与步骤均为固定示例数据。页面内选择只切换预览内容。</p>
    <BlueprintSheet id="actions" letter="A" sheetNo="01 / 04" title="按钮与标签页" description="页面级行动用蓝图按钮；表单与工具操作继续使用 coss Button。">
      <div className="bp-demo-columns">
        <div className="min-w-0">
          <BpMinor>BP-01 Button</BpMinor>
          <div className="flex flex-wrap items-center gap-3.5"><BpButton variant="primary" onClick={() => setActionPreview("正在预览主行动：墨底与偏移阴影。")}>预览主行动 →</BpButton><BpButton onClick={() => setActionPreview("正在预览次要行动：边框与纸面。")}>预览次要行动</BpButton></div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5"><BpButton size="sm" onClick={() => setActionPreview("正在预览小尺寸按钮。")}>小尺寸样式</BpButton><BpButton size="sm" variant="danger" onClick={() => setActionPreview("正在预览危险操作样式；未执行任何操作。")}>危险操作样式</BpButton></div>
          <p className="mt-3 text-ui-hint text-muted-foreground" role="status">{actionPreview}</p>
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <p id="bp-disabled-note" className="text-ui-hint text-muted-foreground">禁用状态示例：所需材料尚未提供。悬停与按下不会产生可操作反馈。</p>
            <div className="flex flex-wrap items-center gap-3"><BpButton variant="primary" disabled aria-describedby="bp-disabled-note">主行动不可用</BpButton><BpButton disabled aria-describedby="bp-disabled-note">次要行动不可用</BpButton><BpButton size="sm" variant="danger" disabled aria-describedby="bp-disabled-note">危险操作不可用</BpButton></div>
            <BpButton size="sm" disabled aria-busy="true">处理中 · 固定状态样例</BpButton>
          </div>
          <BpMinor className="mt-6">BP-01.1 Tool</BpMinor>
          <div className="flex flex-wrap items-center gap-2"><BpTool onClick={() => setActionPreview("工具说明：工具按钮用于紧凑的页面级操作。")}>工具说明</BpTool><BpTool count="v1.14.0" onClick={() => setActionPreview("组件库版本标签的静态样例：v1.14.0。")}>版本样例</BpTool><BpTool iconOnly aria-label="查看工具说明" onClick={() => setActionPreview("图标按钮必须提供可访问名称；可用 Tab 聚焦后按 Enter 激活。")}><Info className="size-4" aria-hidden="true" /></BpTool><BpTool disabled aria-describedby="bp-disabled-note">不可用</BpTool><BpTool aria-live="polite" onClick={copyLink}>{copyState === "copied" ? "已复制链接" : copyState === "failed" ? "复制失败，重试" : "复制链接"}</BpTool></div>
        </div>
        <div className="min-w-0">
          <BpMinor>BP-02 Segmented</BpMinor>
          <BpSegTabs label="答卷状态预览" items={tabs} value={tab} onValueChange={setTab} />
          <p className="mt-2.5 text-ui-hint text-muted-foreground" aria-live="polite">示例快照：{tabNotes[tab]}</p>
          <div className="mt-4 max-w-72"><BpSegTabs label="纵向选择样式预览" orientation="vertical" items={views} value={view} onValueChange={setView} /></div>
          <p className="mt-2.5 text-ui-hint text-muted-foreground">此选择仅演示纵向状态；整站主题由顶部设置切换。</p>
          <BpMinor className="mt-6">BP-02.1 Stepper</BpMinor>
          <BpSteps steps={steps} current={1} label="固定步骤样例" status="示例快照 · 18 / 42" />
          <p className="mt-2.5 text-ui-hint text-muted-foreground">步骤位置来自固定快照，不通过点击推进任务。</p>
        </div>
      </div>
    </BlueprintSheet>

    <BlueprintSheet id="cards" letter="B" sheetNo="02 / 04" title="卡片与线条" description="前两张卡片可跳转到本页章节；静态卡片保持纸面。结构线、分隔线与虚线各有层级。">
      <BpMinor>BP-03 Card</BpMinor>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
        {cards.map(card => <li key={card.name} className="min-w-0"><BpCard name={card.name} description={card.description} thumb={<Thumb label={`${card.name} 缩略`} />} href={card.href} /></li>)}
        <li><BpCardNote><p>虚线卡用于说明与空位，不可点击。</p></BpCardNote></li>
      </ul>
      <div className="bp-demo-columns mt-9">
        <div className="min-w-0">
          <BpMinor>BP-04 Pane</BpMinor>
          <BpPaneHead title="答题卡 · 第 3 页" action={<a href="#reading" className="text-ui-meta underline underline-offset-3">查看阅读样例</a>} />
          <div className="relative h-30 border-(length:--line-width) border-(--line) bg-background"><Thumb label="扫描页预览" /></div>
          <BpFigCap label="FIG. 1">面板头使用墨底白字，与下方内容共用一条墨线。</BpFigCap>
        </div>
        <div className="min-w-0">
          <BpMinor>BP-05 Title Block</BpMinor>
          <BpTitleBlock items={[{ id: "paper", label: "试卷", value: "八年级数学期中" }, { id: "class", label: "班级", value: "初二（3）班" }, { id: "full", label: "满分", value: "120" }, { id: "due", label: "截止", value: "10 月 18 日 17:00" }]} />
        </div>
      </div>
    </BlueprintSheet>

    <BlueprintSheet id="data" letter="C" sheetNo="03 / 04" title="进度与数据" description="实色、墨色与斜线纹区分系列，不依赖颜色深浅；数值始终以文字写出。">
      <div className="bp-demo-columns">
        <div className="min-w-0">
          <BpMinor>BP-06 Size Bar</BpMinor>
          <BpSizeBar rows={[{ id: "all", label: "全班", unit: "人", segments: [{ id: "done", label: "已批阅", value: 22, fill: "ink" }, { id: "review", label: "待复核", value: 7, fill: "hatch" }, { id: "ai", label: "AI 处理中", value: 9, fill: "accent" }, { id: "missing", label: "未提交", value: 4, fill: "quiet" }] }]} />
          <BpFacts className="mt-5" items={[{ id: "rate", value: "68%", label: "全班平均得分率" }, { id: "time", value: "3.2 min", label: "每份答卷平均复核时长" }, { id: "diff", value: "5", label: "AI 与教师评分不一致的题" }, { id: "unsaved", value: "0", label: "未保存的修改" }]} />
        </div>
        <div className="min-w-0">
          <BpMinor>BP-07 Metric</BpMinor>
          <BpMetricLegend baseline="上次测验" current="本次测验" />
          <div className="border-t-(length:--line-width) border-t-(--line)">
            <BpMetric name="平均分" max={120} baseline={{ label: "上次", value: 71.4 }} current={{ label: "本次", value: 78.9 }} gain="+7.5" gainUnit="分" />
            <BpMetric name="及格率" max={100} baseline={{ label: "上次", value: 76, display: "76%" }} current={{ label: "本次", value: 88, display: "88%" }} gain="+12" gainUnit="个百分点" />
            <BpMetric name="批阅用时" max={100} baseline={{ label: "上次", value: 96, display: "96 min" }} current={{ label: "本次", value: 31, display: "31 min" }} gain="3.1×" gainUnit="更快" />
          </div>
        </div>
      </div>
    </BlueprintSheet>

    <BlueprintSheet id="feedback" letter="D" sheetNo="04 / 04" title="反馈与文本" description="提示、错误与批注都指向具体位置，并给出可照做的修改。">
      <div className="bp-demo-columns">
        <div className="min-w-0 space-y-5">
          <BpMinor>BP-08 Callout · Error</BpMinor>
          <BpCallout title="为什么 AI 分数与教师分数不同" action={<a className="prism-link text-ui-action underline underline-offset-3" href="#rubric">查看评分点 →</a>}>示例记录：第 7 题的评分点 2 要求写出单位。AI 判定为漏写，教师改判为可接受。</BpCallout>
          <BpError location="第 12 行 · 选项" message="选择题缺少选项 D。单选题需要 4 个选项，每个以字母开头。" example="A. 3　B. 4　C. 5　D. 6" />
          <BpToast>成功状态样例 · 第 7 题评分已保存</BpToast>
        </div>
        <div className="min-w-0 space-y-5">
          <BpMinor>BP-09 Annotation</BpMinor>
          <div>
            <BpAnnotatedText parts={["因为直角三角形两条直角边分别是 3 和 4，", { text: "所以斜边是 7", n: 1 }, "，", { text: "答案应该是对的", n: 2, tone: "warn" }, "。"]} />
            <BpAnnotationList className="mt-3" items={[{ n: 1, rule: "计算", message: "两直角边直接相加。", suggestion: "斜边 = √(3² + 4²) = 5" }, { n: 2, tone: "warn", rule: "表述", message: "结论缺少依据。", suggestion: "写出所用定理：勾股定理" }]} />
          </div>
          <BpMinor id="rubric">BP-10 Codebox</BpMinor>
          <BpCodebox file="rubric.md" meta="第 7 题 · 评分点">{"## 第 7 题 {score=6}\n- 写出勾股定理  +2\n- 代入并求得 5  +3\n- 带单位作答    +1"}</BpCodebox>
        </div>
      </div>
      <section id="reading" className="mt-9 border-t border-border pt-7" aria-labelledby="bp-reading-heading">
        <BpMinor id="bp-reading-heading">BP-11 长中文与公式阅读</BpMinor>
        <Tabs value={reading} onValueChange={value => setReading(String(value))} className="min-w-0">
          <div {...readingScroll} className="min-w-0 max-w-full overflow-x-auto px-1 py-1">
            <TabsList aria-label="长内容阅读样例">
              <TabsTab value="question">题干与条件说明</TabsTab><TabsTab value="explanation">完整公式推导与教学提示</TabsTab><TabsTab value="locked" disabled>未提供的参考材料</TabsTab>
            </TabsList>
          </div>
          <TabsPanel value="question" className="max-w-186 space-y-4 py-5 text-read-body">
            <p>某校准备在矩形场地内划出一块教学实践区域，面积记为 A。请先完整阅读题目中的长度条件、单位和取值范围，再建立一元二次方程；不能只凭图形比例或某个中间结果判断最终答案。</p>
            <QuestionMath block label="一元二次方程的一般形式，a 不等于零"><mi>a</mi><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mi>b</mi><mi>x</mi><mo>+</mo><mi>c</mi><mo>=</mo><mn>0</mn><mo>，</mo><mi>a</mi><mo>≠</mo><mn>0</mn></QuestionMath>
            <p className="text-ui-hint text-muted-foreground">正文保持阅读字号；章节图框只出现在外层。长公式可在自身区域横向滚动。</p>
          </TabsPanel>
          <TabsPanel value="explanation" className="max-w-186 space-y-4 py-5 text-read-body">
            <p>先用判别式判断实数根的情况，再将两个结果代回原题的取值范围。负数根即使满足方程，也未必符合长度条件。</p>
            <QuestionMath block label="求根公式：x 一、二等于负 b 加减根号 b 平方减四 a c，整体除以二 a；判别式必须大于等于零"><msub><mi>x</mi><mrow><mn>1</mn><mo>,</mo><mn>2</mn></mrow></msub><mo>=</mo><mfrac><mrow><mo>−</mo><mi>b</mi><mo>±</mo><msqrt><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac><mo>，</mo><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi><mo>≥</mo><mn>0</mn></QuestionMath>
            <p>教学提示：要求学生分别说明列式依据、判别式计算、根的筛选和单位，避免把“计算正确”直接等同于“情境解释完整”。</p>
          </TabsPanel>
        </Tabs>
      </section>
    </BlueprintSheet>
  </div>
}
