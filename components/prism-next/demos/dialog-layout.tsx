"use client"

import { useRef, useState } from "react"
import { ScanLine, Upload } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { DemoSection } from "../demo-parts"
import { PaperThumbnail } from "../paper-preview"
import { DialogLayout, DialogEvidence, DialogSection, DialogOptionTile, DialogQuietActions, DialogQuietAction, DialogOptionGrid, DialogOptionGridItem, DialogChoiceList, DialogChoice, DialogRecord, DialogNotice } from "../dialog-layout"

const people = [
  { value: "a", title: "成员甲", description: "编号 001 · 1 页", group: "received", status: { label: "待补充", tone: "warning" as const } },
  { value: "b", title: "成员乙", description: "编号 002 · 2 页", group: "received" },
  { value: "c", title: "成员丙", description: "编号 003 · 2 页", group: "received" },
  { value: "d", title: "成员丁", description: "编号 004 · 等待接收", group: "waiting" },
  { value: "e", title: "成员戊与需要完整显示的较长中文姓名", description: "编号 005 · 等待接收", group: "waiting" },
  { value: "f", title: "成员己", description: "编号 006", group: "waiting", disabledReason: "当前不可选择" },
]
const examples = [
  { id: "dispose", title: "处理异常", description: "媒体栏、主次选项与安静操作；操作只反馈请求。" },
  { id: "assign", title: "从多人中选择", description: "宿主搜索与分组单选共用一个受控值。" },
  { id: "record", title: "查看记录", description: "记录事实与两个同等权重的操作。" },
  { id: "reason", title: "选择理由", description: "提示、单选理由与宿主提供的其他理由输入。" },
  { id: "small", title: "无媒体栏 · sm", description: "小尺寸外壳，可关闭品牌细线。" },
  { id: "long", title: "长内容滚动", description: "仅正文滚动，头部和操作区保持可用。" },
] as const

export function DialogLayoutDemo() {
  const [active, setActive] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>("a")
  const [query, setQuery] = useState("")
  const [reason, setReason] = useState<string | null>("readable")
  const [other, setOther] = useState("")
  const [feedback, setFeedback] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const close = () => setActive(null)
  const openChange = (open: boolean) => { if (!open) close() }
  const request = (label: string) => setFeedback(`已触发“${label}”请求。`)
  const selectedPerson = people.find(person => person.value === selected)
  const media = <DialogEvidence title="材料甲" status={{ label: "待核对", tone: "warning" }} facts={["编号 001 · 2 页", "原始图像未接入"]}
    thumbnail={<PaperThumbnail page={{ id: "sample-paper", paperSize: "A4" }} label="材料甲" />} onView={() => request("查看大图")} />
  const message = feedback && <p role="status" className="text-ui-hint text-muted-foreground">{feedback}</p>
  const compactMedia = <div className="dialog-layout-media-fallback space-y-2"><p className="text-ui-hint text-muted-foreground">材料甲 · 编号 001 · 2 页 · 待核对</p><Button variant="ghost" onClick={() => request("查看大图")}>查看材料大图</Button></div>
  return <>
    <p className="mb-6 text-ui-hint text-muted-foreground">本页为中性示例数据；不连接扫描、上传或保存服务。</p>
    {examples.map(example => <DemoSection key={example.id} id={example.id} title={example.title} description={example.description}>
      <Button variant="outline" onClick={() => { setFeedback(""); setActive(example.id) }}>打开{example.title}</Button>
    </DemoSection>)}
    <DialogLayout open={active === "dispose"} onOpenChange={openChange} size="lg" title="材料甲的版式需要核对" closeLabel="关闭异常处理" eyebrow="处理异常" media={media}
      description="这份材料的版式与当前模板不一致，请选择处理方式。"
      footerStart={<Button variant="ghost" onClick={() => request("查看记录")}>查看记录（1）</Button>}
      footerEnd={<Button variant="outline" onClick={close}>关闭</Button>}>
      {compactMedia}<DialogSection title="重新接收"><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <DialogOptionTile emphasis="primary" icon={<ScanLine />} title="数据站接收" description="通过数据站重新接收材料" onClick={() => request("数据站接收")} />
        <DialogOptionTile icon={<Upload />} title="上传文件" description="选择本机的图片或 PDF" onClick={() => request("上传文件")} />
      </div></DialogSection>
      <DialogSection title="其他处理"><DialogQuietActions>
        <DialogQuietAction title="按现状使用" description="补充理由后交由宿主处理" onClick={() => request("按现状使用")} />
        <DialogQuietAction title="移出当前范围" description="这份材料将不参与当前任务" onClick={() => request("移出当前范围")} />
      </DialogQuietActions></DialogSection>{message}
    </DialogLayout>
    <DialogLayout open={active === "assign"} onOpenChange={openChange} size="xl" title="这份材料属于谁？" closeLabel="关闭成员选择" eyebrow="选择成员" media={media} initialFocus={searchRef}
      footerStart={<Button variant="ghost" onClick={() => request("移出材料")}>移出这份材料</Button>}
      footerEnd={<><Button variant="outline" onClick={close}>取消</Button><Button disabled={!selectedPerson || !!selectedPerson.disabledReason} onClick={() => request(`关联到${selectedPerson?.title}`)}>确认关联</Button></>}>
      {compactMedia}<div className="space-y-2"><Label htmlFor="dialog-member-search">搜索成员</Label><Input ref={searchRef} id="dialog-member-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="输入姓名或编号" /></div>
      <DialogOptionGrid label="材料所属成员" value={selected} onValueChange={setSelected} emptyText="没有符合条件的成员" groups={[
        { id: "received", title: "已有材料", description: "关联到已接收的材料", children: people.filter(person => person.group === "received" && `${person.title}${person.description}`.includes(query.trim())).map(person => <DialogOptionGridItem key={person.value} {...person} />) },
        { id: "waiting", title: "等待材料", description: "作为一份新材料", children: people.filter(person => person.group === "waiting" && `${person.title}${person.description}`.includes(query.trim())).map(person => <DialogOptionGridItem key={person.value} {...person} />) },
      ]} />
      <DialogNotice>结果预告：{selectedPerson ? `将关联到${selectedPerson.title}` : "尚未选择成员"}。</DialogNotice>{message}
    </DialogLayout>
    <DialogLayout open={active === "record"} onOpenChange={openChange} title="材料甲的处理记录" closeLabel="关闭记录" eyebrow="查看记录" media={media} footerLayout="equal"
      footerStart={<Button variant="outline" onClick={() => request("撤销处理")}>撤销处理</Button>} footerEnd={<Button variant="outline" onClick={close}>关闭</Button>}>
      {compactMedia}<DialogRecord rows={[{ label: "原始情况", value: "版式需要核对" }, { label: "处理方式", value: "按现状使用" }, { label: "处理理由", value: "内容完整，可以辨认" }, { label: "处理人", value: "成员甲" }, { label: "时间", value: "10 月 4 日 13:00" }]} />{message}
    </DialogLayout>
    <DialogLayout open={active === "reason"} onOpenChange={openChange} title="为什么按现状使用？" closeLabel="关闭理由选择" eyebrow="选择理由" media={media}
      footerEnd={<><Button variant="outline" onClick={close}>返回</Button><Button disabled={!reason || (reason === "other" && !other.trim())} onClick={() => request("提交理由")}>确认理由</Button></>}>
      {compactMedia}<DialogNotice tone="warning">版式不一致的材料可能影响后续处理，请先核对内容。</DialogNotice>
      <DialogChoiceList label="使用理由" value={reason} onValueChange={setReason} other={reason === "other" ? <div className="space-y-2"><Label htmlFor="dialog-other-reason">其他理由</Label><Textarea id="dialog-other-reason" value={other} onChange={event => setOther(event.target.value)} /></div> : undefined}>
        <DialogChoice value="readable" title="内容完整，可以辨认" /><DialogChoice value="checked" title="已人工核对无误" /><DialogChoice value="version" title="材料采用了另一种版式，但需要的信息仍然完整" /><DialogChoice value="other" title="其他" />
      </DialogChoiceList>{message}
    </DialogLayout>
    <DialogLayout open={active === "small"} onOpenChange={openChange} size="sm" accent={false} title="材料说明" closeLabel="关闭材料说明" description="短任务可以只使用标题、正文和底栏。" footer={<Button variant="outline" onClick={close}>关闭</Button>}>
      <DialogNotice tone="info">请先核对材料名称与编号。</DialogNotice>
      <DialogOptionTile title="继续核对" description="等待宿主提供可用材料" disabled disabledReason="材料尚未接入" />
    </DialogLayout>
    <DialogLayout open={active === "long"} onOpenChange={openChange} size="lg" title="长中文与公式材料的完整核对说明" closeLabel="关闭完整说明" eyebrow="阅读说明" footerEnd={<Button variant="outline" onClick={close}>完成阅读</Button>}>
      {Array.from({ length: 12 }, (_, index) => <DialogSection key={index} title={`核对项 ${index + 1}`}><p className="text-read-body">逐项核对较长的中文说明、材料名称以及上下文信息，保留完整内容和处理依据。正文可以滚动，标题和底部操作保持可用。</p><p className="text-read-body">公式：<math aria-label="x 的平方加 y 的平方等于一"><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup><mo>=</mo><mn>1</mn></math>。</p></DialogSection>)}
    </DialogLayout>
  </>
}
