"use client"
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'motion/react'
import { Check, Info, Search } from 'lucide-react'
import { Button } from '@/components/coss/button'
import { Input } from '@/components/coss/input'
import { Badge } from '@/components/prism-next/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/coss/table'
import { DemoSection, Labeled, MaterialSelect } from '@/components/prism-next/demo-parts'
import { RootFormula } from '@/components/prism-next/math-content'
import { chartSeriesColors, chartShapeColors, chartSequentialDefault } from '@/lib/prism-next/chart-palette'
import { themeOptions, themePalette, brandColors, COSS_COMMIT, DESIGN_VERSION } from '@/lib/prism-next/config'
import { components } from '@/lib/prism-next/catalog'
const roles=[['background','正文背景'],['secondary','次级背景'],['surface','浮层表面'],['border','分割与边框'],['foreground','正文与公式'],['heading','标题'],['muted','次要文字'],['disabled','禁用文字'],['link','文字链接']] as const
export function Foundations(){const{setTheme}=useTheme();const[moved,setMoved]=useState(false);return <div className="prism-content"><header className="prism-page-heading"><p>FOUNDATIONS / v{DESIGN_VERSION}</p><h1>基础规范</h1><span>清晰的内容层级、成套的主题配对、coss 原始组件与克制的动效。</span></header>
  <p className="text-ui-hint mb-6"><a className="prism-link" href="/next/foundations/typography">字体与字号规范 → 角色、阅读编辑、公式与全站检查</a></p>
  <DemoSection id="expression-review" title="表现力候选 v0.1" description="先比较三个样本。品牌三色和字号标准保持；候选尚未晋升为全站默认规范。"><div className="grid gap-5 lg:grid-cols-3">{[{title:'从新对话开始',text:'比较欢迎区、输入区与任务建议的比例和层次。',href:'/next/skeletons/agent',link:'打开 Agent 对照'},{title:'从材料到结果',text:'同一套几何标记用于材料入口与保存结果，核对工作面保持安静。',href:'/next/use-cases/parsing',link:'打开解析对照'},{title:'暖纸的数据色',text:'分类与连续色阶分别比较，数据与选中状态保持一致。',href:'/next/components/status-composition',link:'打开分类配色对照'}].map(item=><section key={item.title} className="space-y-3"><h3 className="text-block-title">{item.title}</h3><p className="text-ui-hint text-muted-foreground">{item.text}</p><a className="prism-link inline-block text-ui-action" href={item.href}>{item.link} →</a>{item.title==='暖纸的数据色'&&<a className="prism-link block text-ui-action" href="/next/components/evidence-matrix">打开连续色阶对照 →</a>}</section>)}</div><p className="mt-5 text-ui-hint text-muted-foreground">Agent 与解析页顶部可切换「原版 / 候选」；图表页切到暖纸后可切换配色。首次使用固定示例即可走到保存结果；不会调用 OCR 或模型。</p></DemoSection>
  <DemoSection title="四个主题，同一套语义" description="背景切换时，文字、图标、边框、状态与弹出层一起切换。蓝图另行切换几何：圆角归零、结构线 1.5px。"> <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{themeOptions.map(t=><section key={t.value} data-agent-preview data-prism-theme={t.value} className="overflow-hidden rounded-xl border" style={{background:themePalette[t.value].background,color:themePalette[t.value].foreground,borderColor:themePalette[t.value].border}}><div className="space-y-3 p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">{t.label}</h3><Search className="size-4"/></div><p className="text-ui-hint">清楚地阅读文字、公式与数字。</p><p className="text-ui-body" style={{color:themePalette[t.value].muted}}>说明文字也保持可读。</p><div className="rounded-md border px-3 py-2 text-ui-body" style={{background:themePalette[t.value].secondary,borderColor:themePalette[t.value].border}}>x² − 3x + 2 = 0</div><Button type="button" variant="outline" style={{color:themePalette[t.value].foreground,background:themePalette[t.value].surface,borderColor:themePalette[t.value].border}} onClick={()=>setTheme(t.value)}>应用{t.label}主题</Button></div></section>)}</div>
    <div className="mt-7 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>语义角色</TableHead>{themeOptions.map(t=><TableHead key={t.value}>{t.label}</TableHead>)}</TableRow></TableHeader><TableBody>{roles.map(([key,label])=><TableRow key={key}><TableCell>{label}</TableCell>{themeOptions.map(t=><TableCell key={t.value} className="font-mono text-ui-body"><span className="mr-2 inline-block size-3 rounded-sm border align-middle" style={{background:themePalette[t.value][key]}}/>{themePalette[t.value][key]}</TableCell>)}</TableRow>)}</TableBody></Table></div></DemoSection>
  <DemoSection title="曜彩只在需要时出现" description="三原色保留为资产；可读的文字和状态使用各主题中的配套深浅色。"><div className="flex flex-wrap gap-7">{brandColors.map(c=><div key={c.name} className="flex items-center gap-3"><span className="size-8 rounded-lg border" style={{background:c.color}}/><div className="text-ui-body">{c.name}<p className="mt-1 font-mono text-ui-meta text-muted-foreground">{c.color}</p></div></div>)}</div><div className="mt-6 flex flex-wrap gap-3"><Badge variant="info"><Info/>进行中的信息</Badge><Badge variant="error">需要修正</Badge><Badge variant="success"><Check/>已完成</Badge></div></DemoSection>
  <DemoSection id="chart-palette" title="曜彩图表色板" description="浅色与纸色共用六色；深色保持色相并提亮。文字沿用正文色，色块只用于图形与面积。">
    <div className="grid gap-5 lg:grid-cols-3">{themeOptions.filter(t=>['light','paper','dark'].includes(t.value)).map(t=>{
      const shapes=chartShapeColors(t.value),ramp=chartSequentialDefault(t.value,themePalette[t.value].secondary)
      return <section key={t.value} data-agent-preview data-prism-theme={t.value} className="space-y-4 rounded-xl border bg-background p-5 text-foreground">
        <h3 className="text-block-title">{t.label}</h3>
        <ol className="grid grid-cols-2 gap-3">{chartSeriesColors(t.value).map((color,i)=><li key={color} className="flex min-w-0 items-center gap-2 text-ui-hint"><span aria-hidden="true" className="size-5 shrink-0 rounded-sm" style={{background:color}}/><span>{i+1}<code className="block text-ui-meta">{color}</code></span></li>)}</ol>
        <div className="space-y-3 rounded-lg border bg-card p-3 text-card-foreground">
          <p className="text-ui-hint">卡片表面 · 同一色板</p>
          <div className="flex gap-2">{chartSeriesColors(t.value).map(color=><span key={color} aria-hidden="true" className="h-5 min-w-0 flex-1 rounded-sm" style={{background:color}}/>)}</div>
          <p className="text-ui-meta">形状：{shapes.base} / 选中：{shapes.selected} / 面积：{shapes.fill}</p>
          <div aria-hidden="true" className="h-8 rounded-sm border-2" style={{background:shapes.fill,borderColor:shapes.base}}/>
        </div>
        <p className="text-ui-hint">连续色阶</p><div aria-hidden="true" className="h-6 rounded-sm" style={{background:`linear-gradient(90deg,${ramp.join(',')})`}}/><p className="break-words text-ui-meta">{ramp.join(' → ')}</p>
      </section>
    })}</div>
    <p className="mt-4 text-ui-hint text-muted-foreground">系列色对页面和卡片均 ≥ 3:1；面积浅调对白底 ≥ 1.5:1。图例保留名称与点形，颜色不单独承载信息。</p>
  </DemoSection>
  <DemoSection id="ai-floating" title="AI 来源与悬浮材质" description="品牌细线只标识 AI 来源；悬浮材质仅用于工具条与弹出层。各主题使用同名语义令牌。"><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{themeOptions.map(t=><section key={t.value} data-agent-preview data-prism-theme={t.value} className="space-y-5 bg-background p-5 text-foreground"><h3 className="text-block-title">{t.label}</h3><div className="bg-muted"><div className="h-0.5" style={{background:'var(--brand-ai-gradient)'}}/><div className="space-y-2 p-4"><h4 className="text-item-title">AI 判定依据</h4><p className="text-ui-body">来源标识不代表正确性或完成状态。</p></div></div><div className="bg-border p-4"><div role="toolbar" aria-label={`${t.label}悬浮材质`} className="surface-floating flex flex-wrap items-center gap-3 rounded-xl p-3"><span className="text-ui-action">阅读工具</span><span className="text-ui-meta">92% 表面 · 12px 模糊</span></div></div></section>)}</div></DemoSection>
  <DemoSection id="mathematics" title="文字、公式与数字" description="正文采用系统常用字体；数学使用本地 STIX Two Math 与原生 MathML，不手动压缩分式和根号。"><div className="max-w-2xl space-y-5"><h3 className="text-block-title text-(--heading)">二次方程的实数根</h3><p className="text-read-body text-foreground">正文优先完整、明确地传达内容。辅助信息通过字号、间距与位置建立层次，不靠过浅的字色隐藏。</p><div className="prism-equation"><RootFormula/></div><p className="prism-numeric text-ui-body">结果值　+1.000　+2.000　−0.125</p><p className="text-ui-hint text-muted-foreground">表格数字开启 tabular-nums；需要小数点对齐时统一精度并右对齐。</p></div></DemoSection>
  <DemoSection title="coss 尺寸与字段宽度" description="高度、内边距和下拉行为沿用官方实现；蓝图主题单独调整圆角与结构线。宽度服从输入内容，避免把短选项拉成整栏。"><div className="flex flex-wrap items-start gap-7">{(['sm','default','lg']as const).map(size=><div key={size} className="w-48 space-y-4"><Labeled label={size==='default'?'默认尺寸':size==='sm'?'紧凑尺寸':'宽松尺寸'} id={'foundation-input-'+size}><Input id={'foundation-input-'+size} size={size} defaultValue="材料标题"/></Labeled><Labeled label="材料类型" id={'foundation-select-'+size}><MaterialSelect id={'foundation-select-'+size} size={size}/></Labeled><Button size={size}>保存修改</Button></div>)}</div><p className="mt-6 text-ui-hint text-muted-foreground">以默认 16px 根字号计：桌面默认高 32px，sm 为 28px，lg 为 36px；窄屏分别为 36 / 32 / 40px。单行标题通常填满表单列，类型选择约 11–12rem，数字输入约 9–11rem。这里只调整字段容器，不覆盖组件内部尺寸。</p></DemoSection>
  <DemoSection title="动效用于说明状态" description="coss 的展开与焦点动效保持原样；跨状态的出现与位移使用 Motion，并响应系统的减少动态效果设置。"><div className="max-w-sm"><div className={"mb-5 flex h-12 rounded-lg bg-muted p-2 "+(moved?"justify-end":"justify-start")}><motion.div layout transition={{duration:.2,ease:'easeOut'}} className="h-8 w-20 rounded-md bg-primary text-center text-ui-hint text-primary-foreground">{moved?'已就位':'待移动'}</motion.div></div><Button variant="outline" onClick={()=>setMoved(v=>!v)}>切换位置</Button></div></DemoSection>
  <footer aria-label="组件来源与版本" className="mt-10 border-t pt-6 text-ui-hint text-muted-foreground">
    <div className="max-w-3xl space-y-3">
      <p>组件源代码：coss apps/ui（MIT），版本固定于 <code>{COSS_COMMIT.slice(0,12)}</code>。</p>
      <p>本版提供 {components.filter(item=>!item.kind).length} 项官方基础组件、{components.filter(item=>item.kind==="pattern").length} 项业务与组合组件、{components.filter(item=>item.kind==="extension").length} 项扩展。应用示例单列，不计入组件数量。</p>
      <p>保留 shadcn 的组件源码工作方式；使用 Base UI 1.8.0、Motion 13.3.0。全站使用同一套 coss 组件与主题。</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <a href="/next" className="prism-link">查看组件目录 →</a>
        <a href="https://coss.com/ui/docs" target="_blank" rel="noreferrer" className="prism-link">查看 coss 官方文档 ↗</a>
      </div>
    </div>
  </footer>
</div>}
