"use client"

import { useState } from "react"
import { DataStation, DataStationBadge, type DataStationProps, type DataStationBadgeProps } from "../data-station"
import { Button } from "../button"
import { DemoSection, Feedback } from "../demo-parts"

export const dataStationBase: DataStationProps = {
  presentation: "inline", state: { kind: "ready" }, selectedId: "02", recommendedId: "02", connection: { kind: "idle" },
  refreshDescription: "状态每 10 秒刷新",
  task: { className: "高二（3）班", subject: "数学", gradingMode: "答题卡批阅", bindingDescription: "将与本次数据站扫描会话绑定" },
  devices: [
    { id: "02", name: "高中部教学数据站 02", location: "高中部 2 楼 · 教师文印室", number: "ST-HS-02", onlineTime: "刚刚在线", paperSizes: ["A3", "A4"], sides: "单双面", onlineDescription: "两端在线 · 可建立连接", availability: { kind: "available" } },
    { id: "01", name: "高中部教学数据站 01", location: "高中部 1 楼 · 教务处", number: "ST-HS-01", onlineTime: "刚刚在线", paperSizes: ["A3", "A4"], sides: "单双面", availability: { kind: "busy", occupiedBy: "高一（5）班", estimatedMinutes: 6 } },
    { id: "ms-01", name: "初中部教学数据站 01", location: "初中部 3 楼 · 教师办公室", number: "ST-MS-01", paperSizes: ["A4"], sides: "双面", availability: { kind: "offline", lostMinutesAgo: 12 } },
  ],
}
export const dataStationFixtures: { label: string; props: DataStationProps }[] = [
  { label: "待连接", props: dataStationBase },
  { label: "连接中", props: { ...dataStationBase, connection: { kind: "connecting", stationId: "02" } } },
  { label: "已连接", props: { ...dataStationBase, connection: { kind: "connected", stationId: "02" }, devices: dataStationBase.devices.map(device => device.id === "02" ? { ...device, onlineDescription: "已连接" } : device) } },
  { label: "连接失败", props: { ...dataStationBase, connection: { kind: "failed", stationId: "02", reason: "数据站暂未响应连接请求，请确认终端在线后重试。" } } },
  { label: "空态", props: { ...dataStationBase, devices: [], state: { kind: "empty", nextStep: "请联系学校管理员配置数据站；也可返回资料接收，通过本机上传文件。" } } },
  { label: "加载中", props: { ...dataStationBase, state: { kind: "loading" } } },
  { label: "加载失败", props: { ...dataStationBase, state: { kind: "error", reason: "暂时无法取得本校数据站列表，请重新加载。" } } },
]
function StationFixture({ props }: { props: DataStationProps }) {
  const [selectedId, setSelectedId] = useState(props.selectedId)
  const [feedback, setFeedback] = useState("尚未发出操作请求")
  return <div className="min-w-0 space-y-3"><DataStation {...props} selectedId={selectedId}
    onSelect={id => { setSelectedId(id); setFeedback(`已选择 ${id}；尚未连接`) }}
    onConnect={id => setFeedback(`已发出连接请求：${id}；等待调用方回执`)}
    onDisconnect={id => setFeedback(`已发出断开请求：${id}；等待调用方回执`)}
    onRetry={intent => setFeedback(intent.kind === "load" ? "已发出重新加载请求；等待调用方回执" : `已发出重试请求：${intent.stationId}；等待调用方回执`)}
    onClose={() => setFeedback("已发出返回请求")} /><Feedback>{feedback}</Feedback></div>
}
const badges: DataStationBadgeProps["state"][] = [{ kind: "connected", name: "02" }, { kind: "available", count: 1 }, { kind: "disconnected" }]
export function DataStationDemo() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [sheetFixture, setSheetFixture] = useState(dataStationBase)
  const [selectedId, setSelectedId] = useState("02")
  const [feedback, setFeedback] = useState("入口尚未打开")
  return <>
    <DemoSection title="右侧抽屉与入口徽标" description="页面使用调用方提供的固定状态，刷新文案不代表已接入轮询；操作只记录请求。">
      <div className="flex flex-wrap gap-3">{badges.map(state => <DataStationBadge key={state.kind} state={state} onOpen={() => { setSheetFixture(state.kind === "connected" ? dataStationFixtures[2].props : dataStationBase); setSelectedId("02"); setOpen(true); setFeedback(`已打开数据站入口：${state.kind}`) }} />)}</div>
      <DataStation {...sheetFixture} presentation="sheet" open={open} selectedId={selectedId}
        onClose={() => setOpen(false)} onSelect={setSelectedId} onDisconnect={id => setFeedback(`已发出断开请求：${id}；等待调用方回执`)} onConnect={id => setFeedback(`已发出连接请求：${id}；等待调用方回执`)} />
      <Feedback>{feedback}</Feedback>
    </DemoSection>
    <DemoSection id="station-drawer" title="触控端 · 右侧 Drawer" description="宿主明确选择 drawer；Esc、遮罩、关闭与返回均请求关闭，连接状态不变。">
      <Button variant="outline" className="h-auto sm:h-auto min-h-11 whitespace-normal" onClick={() => setDrawerOpen(true)}>打开触控抽屉</Button>
      <DataStation {...dataStationBase} presentation="drawer" open={drawerOpen} onClose={() => setDrawerOpen(false)} selectedId={selectedId} onSelect={setSelectedId}
        onConnect={id => setFeedback(`已发出连接请求：${id}；等待调用方回执`)} />
    </DemoSection>
    {dataStationFixtures.map(({ label, props }) => <DemoSection key={label} title={label}><div className="max-w-xl"><StationFixture props={props} /></div></DemoSection>)}
    <DemoSection title="选择其他可用数据站" description="单选只改变待连接目标；主按钮随推荐与所选目标变化。">
      <div className="max-w-xl"><StationFixture props={{ ...dataStationBase, selectedId: null, devices: [...dataStationBase.devices, { ...dataStationBase.devices[0], id: "03", name: "高中部教学数据站 03", number: "ST-HS-03" }] }} /></div>
    </DemoSection>
    <DemoSection title="窄工具栏 · 多行数据站入口" description="入口名称可跨行，桌面断点仍使用自然高度，触控目标至少 44px。">
      <div className="w-44 max-w-full"><DataStationBadge state={{ kind: "connected", name: "高二年级数学期中考试资料接收专用教学数据站" }} onOpen={() => setFeedback("已发出长名称数据站查看请求")} /></div>
      <Feedback>{feedback}</Feedback>
    </DemoSection>
    <DemoSection title="三主题 · 320px · 长中文与公式" description="状态、设备信息与操作完整换行，控件保留触控空间。">
      <div className="flex flex-wrap items-start gap-4">{(["light", "paper", "dark"] as const).map(theme => <section key={theme} aria-label={`${theme} 320px`} data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="w-80 max-w-full space-y-3 p-3">
        <h3 className="text-item-title">{theme} · 320px</h3><StationFixture props={{ ...dataStationBase, devices: dataStationBase.devices.map(device => ({ ...device, name: `${device.name} · 高二数学期中考试标准答案答题卡与评分依据完整核对资料接收专用设备` })) }} />
        <p className="text-ui-hint">当前任务公式：<math><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn></math></p>
      </section>)}</div>
    </DemoSection>
  </>
}
