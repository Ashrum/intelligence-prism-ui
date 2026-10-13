"use client"

import { useState } from "react"
import { Moon } from "lucide-react"
import { BlueprintSheet, BpAnnotatedText, BpAnnotationList, BpButton, BpCallout, BpCard, BpCardNote, BpCodebox, BpError, BpFacts, BpFigCap, BpMetric, BpMetricLegend, BpMinor, BpPaneHead, BpSegTabs, BpSizeBar, BpSteps, BpTitleBlock, BpToast, BpTool } from "../blueprint/blueprint"

const tabs = [{ value: "all", label: "全部" }, { value: "todo", label: "待批阅" }, { value: "review", label: "待复核" }, { value: "locked", label: "已锁定", disabled: true }, { value: "done", label: "已完成" }, { value: "issue", label: "异常" }]
const tabNotes: Record<string, string> = { all: "42 份答卷", todo: "9 份等待 AI 批阅", review: "7 份需要教师确认", done: "22 份已出分", issue: "4 份未提交或扫描失败" }
const views = [{ value: "blueprint", label: "blueprint", description: "工程图纸，适合结构与流程" }, { value: "paper", label: "paper", description: "暖纸，适合长文阅读" }, { value: "light", label: "light", description: "浅色，日常工作" }]
const steps = [{ id: "upload", label: "上传答卷" }, { id: "ai", label: "AI 批阅" }, { id: "review", label: "教师复核" }]
const cards = [{ name: "flow", description: "解题思路、批阅流程与判断分支。" }, { name: "timeline", description: "学期安排、单元进度与考试节点。" }, { name: "limits", description: "得分与及格线、用时与限时对比。" }]
const Thumb = ({ label }: { label: string }) => <span className="absolute inset-3.5 grid place-items-center border border-dashed border-border font-mono text-ui-meta text-muted-foreground">{label}</span>

export function BlueprintComponentsDemo() {
  const [tab, setTab] = useState("all")
  const [view, setView] = useState("blueprint")
  const [step, setStep] = useState(1)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }
  return <div className="space-y-8">
    <BlueprintSheet id="actions" letter="A" sheetNo="01 / 04" title="按钮与标签页" description="页面级行动用蓝图按钮；表单与工具操作继续使用 coss Button。">
      <div className="grid gap-x-12 gap-y-9 lg:grid-cols-2">
        <div className="min-w-0">
          <BpMinor>BP-01 Button</BpMinor>
          <div className="flex flex-wrap items-center gap-3.5"><BpButton variant="primary">开始批阅 →</BpButton><BpButton>查看试卷</BpButton></div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5"><BpButton size="sm">复制题目</BpButton><BpButton size="sm" variant="danger">撤回发布</BpButton></div>
          <BpMinor className="mt-6">Tool</BpMinor>
          <div className="flex flex-wrap items-center gap-2"><BpTool>中文</BpTool><BpTool count="v1.14.0">组件库</BpTool><BpTool iconOnly aria-label="切换明暗"><Moon className="size-4" aria-hidden="true" /></BpTool><BpTool aria-live="polite" onClick={copyLink}>{copyState === "copied" ? "已复制链接" : copyState === "failed" ? "复制失败，重试" : "复制链接"}</BpTool></div>
        </div>
        <div className="min-w-0">
          <BpMinor>BP-02 Segmented</BpMinor>
          <BpSegTabs label="答卷状态" items={tabs} value={tab} onValueChange={setTab} />
          <p className="mt-2.5 text-ui-hint text-muted-foreground" aria-live="polite">当前：{tabNotes[tab]}</p>
          <div className="mt-4 max-w-60"><BpSegTabs label="页面主题" orientation="vertical" items={views} value={view} onValueChange={setView} /></div>
          <BpMinor className="mt-6">Stepper</BpMinor>
          <BpSteps steps={steps} current={step} status={step === 1 ? "AI 批阅中 · 18 / 42" : undefined}><BpButton size="sm" onClick={() => setStep(s => (s + 1) % steps.length)}>下一步</BpButton></BpSteps>
        </div>
      </div>
    </BlueprintSheet>

    <BlueprintSheet id="cards" letter="B" sheetNo="02 / 04" title="卡片与线条" description="可点击的卡片悬停时向左上抬起 2px；线条分三级，虚线只用于分组。">
      <BpMinor>BP-03 Card</BpMinor>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {cards.map(card => <li key={card.name} className="min-w-0"><BpCard name={card.name} description={card.description} thumb={<Thumb label={`${card.name} 缩略`} />} onSelect={() => undefined} /></li>)}
        <li><BpCardNote><p>虚线卡用于说明与空位，不可点击。</p></BpCardNote></li>
      </ul>
      <div className="mt-9 grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <div className="min-w-0">
          <BpMinor>BP-04 Pane</BpMinor>
          <BpPaneHead title="答题卡 · 第 3 页" action={<button type="button" className="text-ui-meta underline underline-offset-3">替换本页</button>} />
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
      <div className="grid gap-x-12 gap-y-9 lg:grid-cols-2">
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
      <div className="grid gap-x-12 gap-y-9 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <BpMinor>BP-08 Callout · Error</BpMinor>
          <BpCallout title="为什么 AI 分数与教师分数不同" action={<a className="prism-link text-ui-action underline underline-offset-3" href="#feedback">查看评分点 →</a>}>第 7 题的评分点 2 要求写出单位。AI 判定为漏写，教师改判为可接受。差异已记录，不影响最终成绩。</BpCallout>
          <BpError location="第 12 行 · 选项" message="选择题缺少选项 D。单选题需要 4 个选项，每个以字母开头。" example="A. 3　B. 4　C. 5　D. 6" />
          <BpToast>已保存 · 第 7 题评分</BpToast>
        </div>
        <div className="min-w-0 space-y-5">
          <BpMinor>BP-09 Annotation</BpMinor>
          <div>
            <BpAnnotatedText parts={["因为直角三角形两条直角边分别是 3 和 4，", { text: "所以斜边是 7", n: 1 }, "，", { text: "答案应该是对的", n: 2, tone: "warn" }, "。"]} />
            <BpAnnotationList className="mt-3" items={[{ n: 1, rule: "计算", message: "两直角边直接相加。", suggestion: "斜边 = √(3² + 4²) = 5" }, { n: 2, tone: "warn", rule: "表述", message: "结论缺少依据。", suggestion: "写出所用定理：勾股定理" }]} />
          </div>
          <BpMinor>BP-10 Codebox</BpMinor>
          <BpCodebox file="rubric.md" meta="第 7 题 · 评分点">{"## 第 7 题 {score=6}\n- 写出勾股定理  +2\n- 代入并求得 5  +3\n- 带单位作答    +1"}</BpCodebox>
        </div>
      </div>
    </BlueprintSheet>
  </div>
}
