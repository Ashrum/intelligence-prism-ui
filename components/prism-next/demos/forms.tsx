"use client"

import { useState } from "react"
import { Search,Mail } from "lucide-react"
import { zhCN } from "@daypicker/react/locale"
import { Button } from "@/components/coss/button"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import { Label } from "@/components/coss/label"
import { Field,FieldLabel,FieldDescription,FieldError } from "@/components/coss/field"
import { Fieldset,FieldsetLegend } from "@/components/coss/fieldset"
import { Form } from "@/components/coss/form"
import { Checkbox } from "@/components/coss/checkbox"
import { CheckboxGroup } from "@/components/coss/checkbox-group"
import { RadioGroup,Radio } from "@/components/coss/radio-group"
import { Switch } from "@/components/coss/switch"
import { Slider,SliderValue } from "@/components/coss/slider"
import { Calendar } from "@/components/coss/calendar"
import { OTPField,OTPFieldInput } from "@/components/coss/otp-field"
import { InputGroup,InputGroupInput,InputGroupAddon,InputGroupText } from "@/components/coss/input-group"
import { NumberField,NumberFieldGroup,NumberFieldInput,NumberFieldDecrement,NumberFieldIncrement } from "@/components/coss/number-field"
import { Combobox,ComboboxInput,ComboboxPopup,ComboboxList,ComboboxItem,ComboboxEmpty } from "@/components/coss/combobox"
import { Autocomplete,AutocompleteInput,AutocompletePopup,AutocompleteList,AutocompleteItem,AutocompleteEmpty } from "@/components/coss/autocomplete"
import { DemoSection,Feedback,MaterialSelect,Labeled } from "@/components/prism-next/demo-parts"

export function FormExample() {
  const [title,setTitle]=useState('二次方程的实数根')
  const [duration,setDuration]=useState<number|null>(8)
  const [kind,setKind]=useState('example')
  const [notes,setNotes]=useState('')
  const [error,setError]=useState('')
  const [durationError,setDurationError]=useState('')
  const [feedback,setFeedback]=useState('')
  return <Form className="max-w-md space-y-5" noValidate onSubmit={e=>{e.preventDefault();const badTitle=!title.trim();const badDuration=duration===null||!Number.isInteger(duration)||duration<1||duration>120;setError(badTitle?'请输入材料标题。':'');setDurationError(badDuration?'时长须为 1–120 的整数。':'');setFeedback('');if(badTitle||badDuration)return;setFeedback(`已保存「${title.trim()}」，预计研读 ${duration} 分钟。`)}}>
    <Field invalid={!!error}><FieldLabel htmlFor="form-title">材料标题</FieldLabel><Input id="form-title" value={title} aria-invalid={!!error} onChange={e=>{setTitle(e.target.value);setFeedback('');if(error)setError('')}}/><FieldError match={!!error}>{error}</FieldError></Field>
    <div className="flex flex-wrap gap-5">
      <div className="w-44"><Labeled label="材料类型" id="form-kind"><MaterialSelect id="form-kind" value={kind} onChange={v=>{setKind(v);setFeedback('')}}/></Labeled></div>
      <Field invalid={!!durationError} className="w-36"><NumberField value={duration} onValueChange={v=>{setDuration(v);setDurationError('');setFeedback('')}} min={1} max={120}><Label htmlFor="form-duration">预计时长（分钟）</Label><NumberFieldGroup><NumberFieldDecrement aria-label="减少时长"/><NumberFieldInput id="form-duration" aria-invalid={!!durationError}/><NumberFieldIncrement aria-label="增加时长"/></NumberFieldGroup></NumberField><FieldError match={!!durationError}>{durationError}</FieldError></Field>
    </div>
    <Field><FieldLabel htmlFor="form-notes">修订备注</FieldLabel><Textarea id="form-notes" value={notes} onChange={e=>{setNotes(e.target.value);setFeedback('')}} placeholder="补充需要复核的内容"/></Field>
    <div className="flex gap-2"><Button type="submit">保存修改</Button><Button variant="ghost" type="button" onClick={()=>{setTitle('二次方程的实数根');setDuration(8);setKind('example');setNotes('');setError('');setDurationError('');setFeedback('已恢复示例内容。')}}>重置</Button></div>
    <Feedback>{feedback||'修改仅作用于当前示例。'}</Feedback>
  </Form>
}

export function InputDemo() {
  return <><DemoSection title="默认与不同尺寸" description="保持官方 sm / default / lg 尺寸；宽度由字段容器决定。"><div className="grid max-w-2xl gap-6 sm:grid-cols-3">{(['sm','default','lg'] as const).map(size=><Labeled key={size} id={'input-'+size} label={size==='default'?'默认':size==='sm'?'紧凑':'宽松'}><Input id={'input-'+size} size={size} placeholder="材料标题"/></Labeled>)}</div></DemoSection><DemoSection title="状态"><div className="grid max-w-2xl gap-6 sm:grid-cols-2"><Labeled label="只读" id="input-readonly"><Input id="input-readonly" readOnly value="材料编号 M-2026-014"/></Labeled><Labeled label="禁用" id="input-disabled"><Input id="input-disabled" disabled value="已归档材料"/></Labeled><Field invalid><FieldLabel htmlFor="input-invalid">错误</FieldLabel><Input id="input-invalid" aria-invalid defaultValue=""/><FieldError match>请输入材料标题。</FieldError></Field><Labeled label="已有内容" id="input-filled"><Input id="input-filled" defaultValue="二次方程的实数根"/></Labeled></div></DemoSection></>
}
export function SelectDemo() {
  const [value,setValue]=useState('example')
  return <><DemoSection title="完整选择交互" description="支持方向键、键入匹配、选中标记、禁用项与 Esc 关闭。"><div className="max-w-48"><Labeled label="材料类型" id="select-main"><MaterialSelect id="select-main" value={value} onChange={setValue}/></Labeled></div><Feedback>当前选择：{{example:'例题讲解',concept:'知识梳理',practice:'练习解析'}[value]}</Feedback></DemoSection><DemoSection title="官方尺寸与禁用状态"><div className="flex flex-wrap items-end gap-6">{(['sm','default','lg'] as const).map(size=><div className="w-44" key={size}><Labeled id={'select-'+size} label={size}><MaterialSelect id={'select-'+size} size={size}/></Labeled></div>)}<div className="w-44"><Labeled label="禁用" id="select-disabled"><MaterialSelect id="select-disabled" disabled/></Labeled></div></div></DemoSection></>
}
export function TextareaDemo() {
  const [value,setValue]=useState('')
  return <DemoSection title="修订备注" description="字段标签常驻，多行内容按实际长度扩展。"><div className="max-w-lg"><Labeled label="备注" id="textarea-notes"><Textarea id="textarea-notes" value={value} onChange={e=>setValue(e.target.value)} maxLength={500} placeholder="例如：补充判别式等于零时的解释。"/></Labeled><Feedback>{value.length} / 500 字</Feedback></div></DemoSection>
}
export function FieldDemo(){return <DemoSection title="标签、说明与校验"><FormExample/></DemoSection>}
export function FormDemo(){return <DemoSection title="材料信息表单" description="清空标题后提交，检查就地错误与修正后的反馈。"><FormExample/></DemoSection>}
export function FieldsetDemo(){return <DemoSection title="按内容分组"><Fieldset className="max-w-md space-y-5"><FieldsetLegend>教研材料</FieldsetLegend><Labeled id="fieldset-title" label="标题"><Input id="fieldset-title" defaultValue="二次方程的实数根"/></Labeled><Labeled id="fieldset-author" label="编写人"><Input id="fieldset-author" placeholder="输入编写人姓名"/></Labeled></Fieldset></DemoSection>}
export function LabelDemo(){return <DemoSection title="点击标签聚焦字段"><div className="max-w-sm"><Label htmlFor="label-demo">材料名称</Label><Input id="label-demo" placeholder="点击上方标签可聚焦这里"/></div></DemoSection>}
export function InputGroupDemo(){const[q,setQ]=useState('');return <DemoSection title="前缀与单位"><div className="max-w-md space-y-5"><Labeled id="group-search" label="搜索材料"><InputGroup><InputGroupAddon><Search aria-hidden="true"/></InputGroupAddon><InputGroupInput id="group-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="输入标题关键词"/></InputGroup></Labeled><Labeled id="group-score" label="满分"><InputGroup><InputGroupInput id="group-score" type="number" min={1} max={150} defaultValue={100}/><InputGroupAddon align="inline-end"><InputGroupText>分</InputGroupText></InputGroupAddon></InputGroup></Labeled></div><Feedback>{q?`搜索关键词：${q}`:'图标、单位与输入共享同一控件边界。'}</Feedback></DemoSection>}
const topics=['一元二次方程','函数的单调性','多元函数泰勒展开','导数与极值','三角函数','数列求和']
export function ComboboxDemo(){const[value,setValue]=useState<string|null>('一元二次方程');return <DemoSection title="搜索并选择知识点"><div className="max-w-sm"><Label htmlFor="combobox-topic">知识点</Label><Combobox items={topics} value={value} onValueChange={setValue}><ComboboxInput id="combobox-topic" placeholder="搜索知识点" showClear clearProps={{'aria-label':'清除知识点'}} triggerProps={{'aria-label':'展开知识点'}}/><ComboboxPopup><ComboboxEmpty>没有匹配的知识点</ComboboxEmpty><ComboboxList>{(item:string)=><ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList></ComboboxPopup></Combobox></div><Feedback>{value?`已选择：${value}`:'尚未选择知识点。'}</Feedback></DemoSection>}
export function AutocompleteDemo(){const[value,setValue]=useState('');return <DemoSection title="自由输入与建议"><div className="max-w-sm"><Label htmlFor="autocomplete-topic">检索关键词</Label><Autocomplete items={topics} value={value} onValueChange={setValue}><AutocompleteInput id="autocomplete-topic" placeholder="例如：函数"/><AutocompletePopup><AutocompleteEmpty>可以继续输入新的关键词。</AutocompleteEmpty><AutocompleteList>{(item:string)=><AutocompleteItem key={item} value={item}>{item}</AutocompleteItem>}</AutocompleteList></AutocompletePopup></Autocomplete></div><Feedback>{value?`当前文本：${value}`:'可选择建议，也可保留自己的输入。'}</Feedback></DemoSection>}
export function NumberDemo(){const[value,setValue]=useState<number|null>(8);return <DemoSection title="分钟数与范围"><NumberField className="max-w-48" value={value} onValueChange={setValue} min={1} max={120}><Label htmlFor="number-minutes">预计研读时长</Label><NumberFieldGroup><NumberFieldDecrement aria-label="减少一分钟"/><NumberFieldInput id="number-minutes"/><NumberFieldIncrement aria-label="增加一分钟"/></NumberFieldGroup></NumberField><Feedback>{value===null?'请输入时长。':`${value} 分钟 · 可选范围 1–120`}</Feedback></DemoSection>}
export function CheckboxDemo(){const[value,setValue]=useState(false);return <DemoSection title="独立确认"><div className="space-y-4"><Label><Checkbox checked={value} onCheckedChange={setValue}/>我已复核公式与结论</Label><Label><Checkbox disabled/>此材料已锁定</Label></div><Feedback>{value?'已确认复核。':'尚未确认。'}</Feedback></DemoSection>}
export function CheckboxGroupDemo(){const[value,setValue]=useState<string[]>(['公式']);return <DemoSection title="多项复核内容"><Fieldset><FieldsetLegend className="mb-4">需要复核的内容</FieldsetLegend><CheckboxGroup value={value} onValueChange={setValue}>{['公式','推导步骤','数字','元数据'].map(t=><Label key={t}><Checkbox value={t}/>{t}</Label>)}</CheckboxGroup></Fieldset><Feedback>{value.length?`已选择：${value.join('、')}`:'尚未选择。'}</Feedback></DemoSection>}
export function RadioDemo(){const[value,setValue]=useState('private');return <DemoSection title="可见范围"><RadioGroup value={value} onValueChange={v=>setValue(String(v))} aria-label="可见范围"><Label><Radio value="private"/>私有草稿</Label><Label><Radio value="team"/>教研团队</Label><Label><Radio value="school" disabled/>全校（当前不可用）</Label></RadioGroup><Feedback>{value==='private'?'仅本人可见。':'教研团队可见。'}</Feedback></DemoSection>}
export function SwitchDemo(){const[value,setValue]=useState(true);return <DemoSection title="即时设置"><Label><Switch checked={value} onCheckedChange={setValue}/>显示公式编号</Label><Feedback>{value?'公式编号已显示。':'公式编号已隐藏。'}</Feedback></DemoSection>}
export function SliderDemo(){const[value,setValue]=useState(60);return <DemoSection title="阅读进度"><div className="max-w-sm"><Label id="slider-label">完成比例</Label><Slider aria-labelledby="slider-label" value={value} onValueChange={v=>setValue(typeof v==='number'?v:v[0]??0)} min={0} max={100} step={5}><SliderValue>{v=>`${v}%`}</SliderValue></Slider></div><Feedback>当前为 {Array.isArray(value)?value.join('–'):value}%</Feedback></DemoSection>}
export function OtpDemo(){const[value,setValue]=useState('');return <DemoSection title="六位验证码" description="支持连续输入、退格与整段粘贴；不发送真实验证码。"><Field><FieldLabel id="otp-label">演示验证码</FieldLabel><OTPField aria-labelledby="otp-label" value={value} onValueChange={setValue} length={6}>{Array.from({length:6},(_,i)=><OTPFieldInput key={i} aria-label={`第 ${i+1} 位`}/>)}</OTPField></Field><Feedback>{value.length===6?'六位内容已输入完整。':`已输入 ${value.length} / 6 位`}</Feedback></DemoSection>}
export function CalendarDemo(){const[value,setValue]=useState<Date|undefined>(new Date(2026,8,14));return <DemoSection title="复核日期"><Calendar mode="single" locale={zhCN} selected={value} onSelect={setValue} defaultMonth={new Date(2026,8,1)}/><Feedback>{value?`已选择：${value.getFullYear()}年${value.getMonth()+1}月${value.getDate()}日`:'尚未选择日期。'}</Feedback></DemoSection>}

export const formDemos={input:InputDemo,select:SelectDemo,textarea:TextareaDemo,field:FieldDemo,form:FormDemo,fieldset:FieldsetDemo,label:LabelDemo,'input-group':InputGroupDemo,combobox:ComboboxDemo,autocomplete:AutocompleteDemo,'number-field':NumberDemo,checkbox:CheckboxDemo,'checkbox-group':CheckboxGroupDemo,'radio-group':RadioDemo,switch:SwitchDemo,slider:SliderDemo,'otp-field':OtpDemo,calendar:CalendarDemo}
