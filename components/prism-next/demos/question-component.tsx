"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/coss/button"
import { ToolbarButton } from "@/components/coss/toolbar"
import { DemoSection } from "../demo-parts"
import { QuestionPrint, createPrintPreferences } from "../question-print"
import { QuestionCard, QuestionReference, QuestionSummaryRow } from "../question-card"
import { AgentSampleTag } from "../agent-visual-parts"
import { QuestionExampleCard, useQuestionPreview } from "./agent-question-presentation"
import { questionPresentationSample } from "../fixtures/question-presentation-samples"
import { QuestionArchiveSummary, QuestionDetails,type QuestionDetailTab } from "../question-details"
import { QuestionMath } from "../question-content"
import { QuestionSelect } from "../question-controls"
import { QuestionResponse,type ResponseValue } from "../question-response"
import { QuestionReviewExample } from "./question-review"
import { QuestionActions } from "../question-actions"
import { questionSamples } from "@/components/prism-next/fixtures/question-samples"
import { judgmentQuestion,compositeQuestion } from "@/components/prism-next/fixtures/question-composite-samples"
import { questionMetadata } from "../fixtures/question-metadata"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { initialReviewScores,reviewAttempts } from "@/lib/prism-next/fixtures/review"
import type { DirectorySelections } from "../textbook-directory"
const samples=[...questionSamples,judgmentQuestion,compositeQuestion]
export function QuestionComponentDemo(){const [id,setId]=useState(samples[0].id);return <DemoSection title="独立题目卡片" description="题目数据、详情、作答与操作分别传入。同一组件用于选题、编排、作答和复核。"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><QuestionSelect label="题型样本" value={id} onChange={setId} items={samples.map(q=>({value:q.id,label:`${q.kind} · ${q.title}`}))}/><Button variant="outline" render={<Link href="/next/examples/questions"/>}>题库与组卷应用示例</Button></div><QuestionLevelExamples/><QuestionCatalogDemo/><QuestionHoldDemo/><QuestionDetailsLayoutDemo/><QuestionSpecimen key={id} id={id}/><PrintMetadataDemo id={id}/><details className="mt-6 text-ui-body"><summary className="cursor-pointer text-muted-foreground">使用接口</summary><pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 text-ui-hint">{'<QuestionCard question={question} />\n<QuestionCard question={question} checked={selected}\n  onCheckedChange={setSelected} actions={actions}\n  details={details} detailsOpen={open}\n  onDetailsOpenChange={setOpen} />'}</pre></details></DemoSection>}
function PrintMetadataDemo({id}:{id:string}) {
 const question=samples.find(q=>q.id===id)!
 const [showIds,setShowIds]=useState(true),[preferences,setPreferences]=useState(createPrintPreferences),[settingsOpen,setSettingsOpen]=useState(false)
 return <section id="print-metadata" className="mt-8 space-y-4"><h3 className="text-block-title">打印题目标识</h3><Button variant="outline" aria-pressed={showIds} onClick={()=>setShowIds(v=>!v)}>题号与版本行：{showIds?'显示':'隐藏'}</Button><QuestionPrint entries={[{id:question.id,points:question.points}]} questions={[question]} versions={{[question.id]:'1.0'}} title="打印元数据示例" minutes={30} blocked={false} showQuestionIds={showIds} preferences={preferences} onPreferencesChange={setPreferences} settingsOpen={settingsOpen} onSettingsChange={setSettingsOpen}/></section>
}
function QuestionSpecimen({id}:{id:string}){const question=samples.find(q=>q.id===id)!;const [mode,setMode]=useState("select"),[checked,setChecked]=useState(false),[favorite,setFavorite]=useState(false),[open,setOpen]=useState(false),[tab,setTab]=useState<QuestionDetailTab>("answer"),[links,setLinks]=useState<DirectorySelections>({}),[response,setResponse]=useState<Record<string,ResponseValue>>({}),[notice,setNotice]=useState("")
return <div className="space-y-6"><QuestionCard question={question} header={<AgentSampleTag />}/><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-ui-action">可组合的内容与操作</p><QuestionSelect label="题卡组合" value={mode} onChange={value=>{setMode(value);setOpen(false);setNotice("")}} items={[{value:"select",label:"选择"},{value:"compose",label:"编排"},{value:"answer",label:"作答"},{value:"review",label:"复核"}]}/></div>{mode==="review"?<QuestionReviewExample key={id} question={question} attempts={question.id===compositeQuestion.id?reviewAttempts:{"1":"示例作答，待人工复核。"}} initialScores={question.id===compositeQuestion.id?initialReviewScores:{score:0}} learner="示例学生" onConfirm={()=>setNotice("示例确认已发出，等待记录。")} onRecord={()=>setNotice("已载入当前实例的示例复核记录。")}/>:<><QuestionCard question={question} header={<AgentSampleTag />} number={1} checked={checked} onCheckedChange={mode==="select"?setChecked:undefined} showPoints={mode!=="answer"} displayPoints={mode==="compose"?8:undefined} detailsOpen={open} onDetailsOpenChange={setOpen} details={mode!=="answer"?<QuestionDetails question={question} metadata={questionMetadata[id]} textbooks={textbooks} links={links} onLinksChange={setLinks} tab={tab} onTabChange={setTab} tabs={mode==="compose"?["teaching","archive"]:["answer","teaching","archive"]}/>:undefined} secondaryActions={mode==="select"?<QuestionActions title={question.title} favorite={favorite} onFavorite={()=>setFavorite(!favorite)}/>:undefined} actions={mode==="select"?<ToolbarButton render={<Button size="sm"/>} onClick={()=>setNotice("外部容器收到加入请求。")}>加入试题篮</ToolbarButton>:mode==="compose"?<ToolbarButton render={<Button size="sm" variant="outline"/>} onClick={()=>setNotice("外部容器收到替换请求。")}>替换</ToolbarButton>:undefined}/>{mode==="answer"&&<div className="space-y-5 rounded-xl border p-5">{(question.parts??[{...question,id:"1"}]).map(part=><QuestionResponse key={part.id} question={part} value={response[part.id]??""} onChange={value=>setResponse({...response,[part.id]:value})} label={question.parts?`第 ${part.id} 问作答`:"我的作答"}/>)}<Button onClick={()=>setNotice("外部容器已收到作答，未进行自动评分。")}>提交作答</Button></div>}</>}<p role="status" className="min-h-5 text-ui-hint text-muted-foreground">{notice||`勾选：${checked?"已选":"未选"} · 收藏：${favorite?"已收藏":"未收藏"}`}</p></div>}


/** One level at a time; the host owns the separate single-question reader. */
export function QuestionLevelExamples() {
  const [level, setLevel] = useState("L1")
  const [width, setWidth] = useState("full")
  const [checked, setChecked] = useState(false)
  const question = questionPresentationSample
  const preview = useQuestionPreview([question])
  return <section id="question-levels" className="mb-8 min-w-0 space-y-4">
    <h3 className="text-block-title">四个题目呈现层级</h3>
    <p className="text-ui-hint">示例 · 长中文、块级公式、多选与多小问。L1 按完整题干块节选，不从公式中间截断；单题详情由右栏承载。</p>
    <div className="flex flex-wrap gap-3">
      <QuestionSelect label="呈现层级" value={level} onChange={setLevel} items={[{ value: "L0", label: "L0 引用" }, { value: "L1", label: "L1 摘要行" }, { value: "L2", label: "L2 题目卡" }, { value: "L3", label: "L3 阅读" }]} />
      <QuestionSelect label="容器宽度" value={width} onChange={setWidth} items={[{ value: "full", label: "跟随容器" }, ...[1280, 900, 390, 320].map(value => ({ value: String(value), label: `${value}px` }))]} />
    </div>
    <div className="min-w-0" style={{ maxWidth: width === "full" ? "100%" : `${width}px` }}>
      {level === "L0" && <QuestionReference question={question} number={1} onOpen={trigger => preview.openQuestion(question, 1, trigger)} />}
      {level === "L1" && <QuestionSummaryRow question={question} number={1} headingLevel={4} checked={checked} onCheckedChange={setChecked} header={<AgentSampleTag />}
        onOpen={trigger => preview.openQuestion(question, 1, trigger)} />}
      {level === "L2" && <QuestionExampleCard question={question} number={1} />}
      {level === "L3" && <QuestionCard question={question} number={1} headingLevel={4} reading />}
    </div>{preview.panel}
  </section>
}

function QuestionCatalogDemo() {
  const [selected, setSelected] = useState<string[]>(["single"])
  const questions = [
    { key: "single", question: { ...questionSamples.find(question => question.response === "single")!, difficulty: "基础" }, index: 1 },
    { key: "long", question: { ...questionSamples.find(question => question.response === "long")!, difficulty: "提升" }, index: 12 },
  ]
  return <section className="my-8 space-y-4" aria-label="catalog 题卡示例">
    <h3 className="text-block-title">题库题卡 · catalog</h3>
    <p className="text-ui-hint text-muted-foreground">示例选择只保存在本页；勾选只改变边框。</p>
    {questions.map(({ key, question, index }) => <QuestionCatalogExample key={key} question={question} index={index} checked={selected.includes(key)}
      onCheckedChange={checked => setSelected(previous => checked ? [...previous, key] : previous.filter(value => value !== key))} />)}
  </section>
}

function QuestionCatalogExample({ question, index, checked, onCheckedChange }: {
  question: typeof samples[number]; index: number; checked: boolean; onCheckedChange: (checked: boolean) => void
}) {
  const [tab, setTab] = useState<QuestionDetailTab>("answer")
  const [links, setLinks] = useState<DirectorySelections>({})
  const [favorite, setFavorite] = useState(false)
  const metadata = questionMetadata[question.id]
  return <QuestionCard appearance="catalog" index={index} question={question} checked={checked} onCheckedChange={onCheckedChange}
    meta={metadata.knowledge.join("、")} status={<AgentSampleTag />}
    details={<QuestionDetails question={question} metadata={metadata} links={links} onLinksChange={setLinks} tab={tab} onTabChange={setTab} />}
    actions={<QuestionActions title={question.title} collapse favorite={favorite} onFavorite={() => setFavorite(value => !value)} />} />
}


export function QuestionHoldDemo() {
  const [appearance, setAppearance] = useState<"default" | "catalog">("catalog")
  const [width, setWidth] = useState("full")
  const [notice, setNotice] = useState("")
  return <section id="question-hold" className="my-8 min-w-0 space-y-4" aria-label="待正式版本示例">
    <h3 className="text-block-title">待正式版本</h3>
    <p className="text-ui-hint text-muted-foreground">示例 · 题干摘要由宿主在显示时临时读取，不写入试卷；读取不到时保留题号与说明。</p>
    <div className="flex flex-wrap gap-3">
      <QuestionSelect label="占位卡外观" value={appearance} onChange={value => setAppearance(value as "default" | "catalog")} items={[{ value: "default", label: "default" }, { value: "catalog", label: "catalog" }]} />
      <QuestionSelect label="占位卡容器宽度" value={width} onChange={setWidth} items={[{ value: "full", label: "跟随容器" }, { value: "390", label: "390px" }, { value: "320", label: "320px" }]} />
    </div>
    <div className="min-w-0 space-y-4" style={{ maxWidth: width === "full" ? "100%" : `${width}px` }}>
      {[true, false].map((hasBody, index) => <QuestionCard key={String(hasBody)} appearance={appearance} index={index + 2} number={index + 2} headingLevel={4}
        question={{ id: `hold-example-${index + 2}`, title: "待正式版本", kind: "单选题", points: 4 }}
        hold={{
          title: `第 ${index + 2} 题 · 待正式版本`,
          status: "题稿 r1 · 答案待补",
          body: hasBody ? <>函数 <QuestionMath label="y 等于 x 平方加 2x 加 5"><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>5</mn></QuestionMath> 的图象与 x 轴有几个交点？（原件无答案）</> : undefined,
          note: hasBody ? "此处仅临时显示题干摘要。请在作者页补齐答案并提交正式版本；当前占位不代表已有正式题面。" : "读不到题干摘要。可在作者页查看题稿，补齐答案并提交正式版本。",
        }}
        secondaryActions={<ToolbarButton render={<Button variant="ghost" />} onClick={() => setNotice("示例：答案尚未补齐，未读取答案与解析。")}>答案与解析 ▾</ToolbarButton>}
        actions={<ToolbarButton render={<Button variant="ghost" />} onClick={() => setNotice("示例宿主收到打开作者页的意图，未连接真实作者页。")}>在作者页补齐 →</ToolbarButton>}
      />)}
    </div>
    <p role="status" className="min-h-5 text-ui-hint text-muted-foreground">{notice}</p>
  </section>
}

function QuestionDetailsLayoutDemo() {
  const [tab,setTab]=useState<QuestionDetailTab>("archive")
  const [links,setLinks]=useState<DirectorySelections>({})
  const [width,setWidth]=useState("full")
  const question=questionSamples[0]
  return <section className="my-8 space-y-4" aria-label="题目详情新版式">
    <h3 className="text-block-title">题目详情与草稿档案</h3>
    <QuestionSelect label="详情容器宽度" value={width} onChange={setWidth} items={[{value:"full",label:"跟随容器"},...[560,559,390].map(value=>({value:String(value),label:`${value}px`}))]}/>
    <div className="min-w-0 space-y-6" style={{maxWidth:width === "full" ? "100%" : `${width}px`}}>
      <QuestionDetails question={question} metadata={questionMetadata[question.id]} links={links} onLinksChange={setLinks} tab={tab} onTabChange={setTab} status="可用" archive={[{label:"入库",value:"2026-11-17 · 王建国"}]}/>
      <h4 className="text-item-title">草稿档案 · 示例</h4>
      <QuestionArchiveSummary status="未入库" rows={[{label:"题型与结构",value:"单选题 · 4 个选项"},{label:"来源",value:"在线新建 · 王建国"},{label:"创建",value:"2026-11-17 18:42"}]}/>
    </div>
  </section>
}
