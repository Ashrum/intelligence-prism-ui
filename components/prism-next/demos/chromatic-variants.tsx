"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Select, SelectItem, SelectPopup, SelectPrimitive, SelectValue, selectTriggerVariants } from "@/components/coss/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/coss/table";
import { Badge } from "../badge";
import { Button } from "../button";
import { DeltaValue } from "../delta-value";
import { DemoSection } from "../demo-parts";
import { RulerSheet, RulerSheetBand } from "../ruler-sheet";
import { SegmentedControl } from "../segmented-control";

const scope = { "data-agent-preview": "", "data-prism-theme": "light" };

export function ChromaticActionsDemo() {
  return <DemoSection id="chromatic-actions" title="曜彩浅色按钮与徽标">
    <div {...scope} className="prism-chromatic-scope flex flex-wrap items-center gap-3 bg-background p-3">
      <Button appearance="chromatic" variant="outline" aria-label="试题篮，3 道题">
        试题篮<Badge variant="count-info" size="sm" aria-hidden="true">3</Badge>
      </Button>
      <Button appearance="chromatic" variant="default">新建批阅</Button>
      <Badge variant="attention-soft">低于预警线</Badge>
    </div>
  </DemoSection>;
}

const classes = [
  { value: "9-1", label: "九(1)班" },
  { value: "9-2", label: "九(2)班" },
  { value: "8-7", label: "八(7)班" },
];
const resourceTabs = ["同步", "阶段", "备考", "真题", "我的"].map(label => ({ value: label, label }));
const subjects = [
  { value: "math", label: "初中数学" },
  { value: "physics", label: "初中物理" },
];

export function ChromaticSegmentsDemo() {
  const [classId, setClassId] = useState(classes[0].value);
  const [tab, setTab] = useState(resourceTabs[0].value);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  return <DemoSection id="chromatic-segments" title="曜彩浅色分段控件">
    <div {...scope} className="prism-chromatic-scope grid min-w-0 justify-items-start gap-3 bg-background p-3" ref={setPortalContainer}>
      <SegmentedControl size="sm" aria-label="走势班级" items={classes} value={classId} onValueChange={setClassId} />
      <SegmentedControl size="md" aria-label="资源分类" items={resourceTabs} value={tab} onValueChange={setTab}
        lead={<Select items={subjects} defaultValue="math">
          <SelectPrimitive.Trigger aria-label="学科" className={selectTriggerVariants({ size: "sm" })} data-slot="select-trigger">
            <span className="size-1.5 shrink-0 rounded-full bg-[var(--chromatic-sky)]" aria-hidden="true" />
            <SelectValue />
            <SelectPrimitive.Icon><ChevronDown className="size-3" aria-hidden="true" /></SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPopup alignItemWithTrigger={false} portalProps={{ container: portalContainer }}>
            {subjects.map(subject => <SelectItem key={subject.value} value={subject.value}>{subject.label}</SelectItem>)}
          </SelectPopup>
        </Select>} />
    </div>
  </DemoSection>;
}

export function ChromaticDeltaDemo() {
  return <DemoSection id="chromatic-delta" title="曜彩浅色变化值">
    <div {...scope} className="prism-chromatic-scope flex flex-wrap gap-3 bg-background p-3">
      <DeltaValue value={1.2} />
      <DeltaValue value={-35} />
      <DeltaValue value={0} />
      <DeltaValue />
    </div>
  </DemoSection>;
}

const rows = [
  { label: "一元二次方程", date: "10/24", value: 1.2 },
  { label: "二次函数", date: "10/17", value: -35 },
  { label: "平行四边形", date: "10/10", value: 0 },
];

export function ChromaticRulerDemo() {
  return <DemoSection id="chromatic-ruler" title="曜彩浅色标尺纸">
    <div {...scope} className="prism-chromatic-scope min-w-0 bg-secondary pb-3 pe-3 ps-4 pt-5">
      <RulerSheet>
        <RulerSheetBand className="px-3 py-2"><h3 className="text-item-title">已完成批阅</h3></RulerSheetBand>
        <Table aria-label="已完成批阅">
          <TableHeader><TableRow>
            <TableHead>练习</TableHead><TableHead>日期</TableHead><TableHead>较上次</TableHead>
          </TableRow></TableHeader>
          <TableBody>{rows.map(row => <TableRow key={row.label}>
            <TableCell className="whitespace-normal">{row.label}</TableCell>
            <TableCell>{row.date}</TableCell>
            <TableCell className="whitespace-normal"><DeltaValue value={row.value} /></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </RulerSheet>
    </div>
  </DemoSection>;
}
