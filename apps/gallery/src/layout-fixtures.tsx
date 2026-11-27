import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  AppShell, BasketTrigger, DrawerChannelHost, DrawerChannelProvider, FilterSummaryList, InspectorSlot,
  LayoutForm, LayoutList, LayoutSplit, LeaveConfirmDialog, LeaveGuardProvider, PageStatePanel, PaperStage,
  Popover, PopoverPopup, PopoverTrigger, ProcessHost, Select, SelectItem, SelectPopup, SelectTrigger, SelectValue,
  Tabs, TabsList, TabsTab, ToastProvider, WorkbenchDialog, toastManager,
  useBasketDrawer, useDrawerChannel, useLeaveGuard, useProcessHost,
  type AppShellProps, type DrawerChannelView, type LeaveGuardHost, type OleContext, type ProcessAction,
} from "@ole/ui";

const fixtures = {
  list: "列表",
  split: "分栏",
  focus: "沉浸作业",
  form: "表单",
  overlays: "浮层",
  states: "页面状态",
} as const;
type Fixture = keyof typeof fixtures;

export function readLayoutFixture(): Fixture | undefined {
  const value = new URLSearchParams(window.location.search).get("fixture");
  return value && Object.hasOwn(fixtures, value) ? value as Fixture : undefined;
}

export function LayoutFixtureLinks() {
  return (
    <nav className="flex flex-wrap gap-3" aria-label="工作台布局夹具">
      {Object.entries(fixtures).map(([id, label]) => (
        <a key={id} className="underline" href={`?fixture=${id}`}>{label}</a>
      ))}
    </nav>
  );
}

function Action({ children, onClick, primary, disabled, label }: {
  children: ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean; label?: string;
}) {
  return (
    <button type="button" data-slot="workbench-action" data-primary={primary || undefined} disabled={disabled}
      aria-label={label} onClick={onClick}>{children}</button>
  );
}

function drawer(id: string, title: string, kind: DrawerChannelView["kind"], size: DrawerChannelView["size"] = "md"): DrawerChannelView {
  return { id, title, kind, size, host: "layout-fixture", mode: "readonly" };
}

function NavigationRails() {
  return <ul className="space-y-4 p-1.5 text-center text-sm"><li>教学</li><li>资源</li><li>批阅</li></ul>;
}

function FixtureShell({
  switcher, actions, children, overlays, ...props
}: {
  switcher: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  overlays?: ReactNode;
  oleContext?: OleContext;
}) {
  const channel = useDrawerChannel();
  return (
    <AppShell {...props} scroll="page" l1={<NavigationRails />} l2={<div className="p-4">工作台布局</div>}
      navigationEntry={<Action onClick={() => channel.openRoot(drawer("nav", "导航", "navigation"))}>导航</Action>}
      topBar={{ context: switcher, actions }}
      overlays={overlays ?? <DrawerChannelHost closeLabel="关闭" backLabel="返回" renderView={() => <NavigationRails />} />}>
      {children}
    </AppShell>
  );
}

const papers = Array.from({ length: 128 }, (_, index) => ({
  id: index + 1, title: `第 ${index + 1} 套 · 九年级数学练习卷`,
}));

function ListFixture({ switcher }: { switcher: ReactNode }) {
  const basket = useBasketDrawer();
  const [selected, setSelected] = useState<number[]>([]);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const shown = tab === "basket" ? papers.filter((paper) => selected.includes(paper.id)) : papers;
  function toggle(id: number) {
    setSelected((before) => before.includes(id) ? before.filter((value) => value !== id) : [...before, id]);
  }
  const shellOverlays = (
    <DrawerChannelHost closeLabel="关闭" backLabel="返回"
      renderView={(view) => basket.isView(view) ? (
        <div className="space-y-3 p-4">
          {selected.length === 0 && <p>试卷篮为空</p>}
          {selected.map((id) => <p key={id} className="flex flex-wrap items-center gap-2">
            {papers[id - 1]?.title}<Action onClick={() => toggle(id)}>移除</Action>
          </p>)}
        </div>
      ) : <NavigationRails />}
      renderFooter={(view) => basket.isView(view) ? <Action onClick={() => basket.onOpenChange(false)}>完成</Action> : null}
    />
  );
  return (
    <FixtureShell switcher={switcher} overlays={shellOverlays}
      actions={<BasketTrigger count={selected.length} aria-expanded={basket.open} onClick={() => basket.onOpenChange(true)} />}>
      <FilterSummaryList
        header={{
          title: "试卷库", back: <Action onClick={() => setMessage("已返回资源入口")}>返回</Action>,
          primaryAction: { id: "new", label: "新建试卷", onSelect: () => setMessage("已打开新建入口") },
          secondaryActions: ["导入", "导出", "管理"].map((label) => ({ id: label, label, onSelect: () => setMessage(label) })),
          tabs: <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
            <TabsList variant="underline" size="sm">
              <TabsTab value="all">全部试卷</TabsTab><TabsTab value="basket">已入篮</TabsTab>
            </TabsList>
          </Tabs>,
          compactTabs: <select className="fixture-input" aria-label="试卷分类" value={tab} onChange={(event) => setTab(event.target.value)}>
            <option value="all">全部试卷</option><option value="basket">已入篮</option>
          </select>,
        }}
        filters={
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input className="fixture-input" placeholder="搜索试卷" aria-label="搜索试卷" value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
              <Action onClick={() => setExpandedFilters(!expandedFilters)}>
                {expandedFilters ? "收起筛选" : "展开筛选"}
              </Action>
            </div>
            {expandedFilters && ["学段", "学科", "年份", "来源", "难度"].map((label) => (
              <label className="flex flex-wrap items-center gap-2" key={label}>
                {label}<select className="fixture-input"><option>全部</option><option>示例</option></select>
              </label>
            ))}
          </div>
        }
        summaryLabel="资源摘要"
        summary={<p className="py-2">第 {page} 页 · 共 {shown.length} 套 · 已加入 {selected.length} 套</p>}
        bottomBar={<><Action onClick={() => setPage(Math.max(1, page - 1))}>上一页</Action>
          <span>第 {page} 页</span><Action onClick={() => setPage(page + 1)}>下一页</Action>
          <Action disabled={!selected.length} onClick={() => setSelected([])}>清空已选</Action></>}>
        <output className="block" aria-live="polite">{message}</output>
        <ul aria-label="试卷结果">
          {shown.filter((paper) => paper.title.includes(search)).map(({ id, title }) => (
            <li key={id} className="fixture-row flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{title}</span>
              <Action label={`${selected.includes(id) ? "移除" : "加入试卷篮"} ${id}`} onClick={() => toggle(id)}>
                {selected.includes(id) ? "移除" : "入篮"}
              </Action>
            </li>
          ))}
        </ul>
      </FilterSummaryList>
    </FixtureShell>
  );
}

function SplitFixture({ switcher }: { switcher: ReactNode }) {
  const [requestedWidth, setRequestedWidth] = useState<number>();
  const [actualWidth, setActualWidth] = useState(0);
  const [selected, setSelected] = useState(1);
  const [view, setView] = useState<"selection" | "detail">("detail");
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setActualWidth(entry.contentRect.width); });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  return (
    <FixtureShell switcher={switcher}>
      <div className="flex h-full min-h-0 min-w-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2 p-2">
          <label className="flex flex-wrap items-center gap-2">
            正文净宽
            <input className="fixture-input w-24" type="number" min={1} placeholder="自动" value={requestedWidth ?? ""}
              onChange={(event) => setRequestedWidth(event.target.valueAsNumber > 0 ? event.target.valueAsNumber : undefined)} />
          </label>
          {[760, 761, 762].map((width) => <Action key={width} onClick={() => setRequestedWidth(width)}>{width}</Action>)}
          <Action onClick={() => setRequestedWidth(undefined)}>自动</Action>
          <output>{Math.round(actualWidth)} px</output>
        </div>
        <div className="min-h-0 max-w-full flex-1" ref={frame} style={{ width: requestedWidth }}>
          <LayoutSplit singleView={view} onSingleViewChange={setView}
            header={{ title: "对象核对" }}
            list={<ul className="space-y-2 p-3">{papers.slice(0, 50).map(({ id }) => (
              <li key={id}><button type="button" data-slot="workbench-action" aria-pressed={selected === id}
                onClick={() => { setSelected(id); setView("detail"); }}>对象 {id}</button></li>
            ))}</ul>}>
            <article className="space-y-4 p-4">
              <h2 className="text-ui-title">对象 {selected} · 详情</h2>
              {Array.from({ length: 25 }, (_, index) => <p key={index}>证据条目 {index + 1} · 此栏独立滚动。</p>)}
            </article>
          </LayoutSplit>
        </div>
      </div>
    </FixtureShell>
  );
}

function FocusFixture({ switcher }: { switcher: ReactNode }) {
  const channel = useDrawerChannel();
  const [pane, setPane] = useState<"inspector" | "agent">("inspector");
  const [paneSize, setPaneSize] = useState<"sm" | "md">("md");
  const [shown, setShown] = useState(true);
  const [score, setScore] = useState("");
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  const [edge, setEdge] = useState(false);
  const auxiliary = drawer("review-aux", "复核辅助", "auxiliary");
  const preview = drawer("review-preview", "原卷预览", "business", "xl");
  const activeView = channel.state.views.at(-1);
  const previewInDrawer = () => channel.pushChild(auxiliary.id, preview);
  const tabs = <><Action primary={pane === "inspector"} onClick={() => setPane("inspector")}>检查器</Action>
    <Action primary={pane === "agent"} onClick={() => setPane("agent")}>Agent</Action></>;
  const content = (kind: typeof pane, inDrawer: boolean) => (
    <InspectorSlot label={kind === "inspector" ? "评分检查器" : "复核 Agent"} controls={tabs}>
      {kind === "inspector" ? (
        <label className="grid gap-2">当前答案评分
          <input className="fixture-input" type="number" min={0} max={10} data-review-score=""
            value={score} onChange={(event) => setScore(event.target.value)} />
        </label>
      ) : (
        <label className="grid gap-2">Agent 草稿
          <textarea className="fixture-input" value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Action onClick={() => setSaved(score)}>保存评分</Action>
        <Action onClick={inDrawer ? previewInDrawer : () => channel.openRoot(preview)}>原卷预览</Action>
        {!inDrawer && <Action onClick={() => setPaneSize(paneSize === "md" ? "sm" : "md")}>
          {paneSize === "md" ? "切换到 SM" : "切换到 MD"}
        </Action>}
      </div>
      {saved && <output>已保存 {saved} 分</output>}
    </InspectorSlot>
  );
  const overlays = (
    <DrawerChannelHost closeLabel="关闭" backLabel="返回" renderView={(view) =>
      view.id === auxiliary.id ? content(pane, true)
        : view.id === preview.id ? <PaperSample readOnly /> : <NavigationRails />}
      returnFocus={() => document.querySelector<HTMLElement>('[data-slot="workbench-auxiliary"]:not([hidden]) [data-review-score]')} />
  );
  const auxTrigger = <Action onClick={() => {
    if (shown) channel.openRoot(auxiliary);
    else setShown(true);
  }}>辅助</Action>;
  const config: AppShellProps = {
    mode: "immersive",
    focusTopBar: {
      back: <a data-slot="workbench-action" href="./">返回</a>,
      identity: <div className="flex min-w-0 items-center gap-x-2">
        {switcher}<span className="min-w-0 truncate" title="人工复核 · 答案 01">人工复核 · 答案 01</span>
      </div>,
    },
    l1: <NavigationRails />,
    navigationEntry: <Action onClick={() => channel.openRoot(drawer("nav", "导航", "navigation"))}>导航</Action>,
    scroll: "page", overlays,
    budget: { paddingStart: edge ? 0 : 16, paddingEnd: edge ? 0 : 16, contentMinWidth: 720 },
    auxiliaryPane: {
      open: shown,
      size: paneSize, minSize: "sm", objectId: "answer-01", active: pane,
      inspector: content("inspector", false), agent: content("agent", false), label: "复核辅助栏",
      entry: { presentation: { kind: "drawer", size: "md" }, trigger: auxTrigger },
    },
    children: (layout) => (
      <FocusStage
        restoreInline={shown && activeView?.id === auxiliary.id && layout.auxiliaryPane?.kind === "inline"}
        onRestore={() => channel.requestExit("system")}
        edge={edge}
        toolbar={<>
          <Action onClick={() => setEdge(!edge)}>{edge ? "标准留白" : "贴边"}</Action>
          <Action onClick={() => channel.openRoot(preview)}>预览</Action>
          {layout.auxiliaryPane?.kind === "inline" &&
            <Action onClick={() => setShown(false)}>收起辅助</Action>}
        </>}
      />
    ),
  };
  return <AppShell {...config} />;
}

function FocusStage({ restoreInline, onRestore, edge, toolbar }: {
  restoreInline: boolean; onRestore: () => void; edge: boolean; toolbar: ReactNode;
}) {
  useEffect(() => { if (restoreInline) onRestore(); }, [restoreInline, onRestore]);
  return (
    <PaperStage edgeToEdge={edge} toolbarHeight={40} toolbar={toolbar} ruler={{
      top: <div className="fixture-ruler-top">{["0", "1", "2", "3", "4", "5", "6", "7"].map((mark) => <span key={mark}>{mark}</span>)}</div>,
      left: <div className="fixture-ruler-left">{["A", "B", "C", "D", "E", "F"].map((mark) => <span key={mark}>{mark}</span>)}</div>,
    }}><PaperSample /></PaperStage>
  );
}

function PaperSample({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <article className="fixture-paper m-2 min-w-72 space-y-5 border p-5">
      <h1 className="text-ui-title">原卷 · 数学第 6 题</h1>
      <p>已知函数 f(x) = x² − 4x + 3。求图像与坐标轴的交点，并说明对称轴的位置。</p>
      <p>作答记录</p>
      <div className="space-y-4">
        <p>f(x) = (x − 1)(x − 3)，当 x = 1 或 x = 3 时，f(x) = 0。</p>
        <p>图像与 x 轴交于 (1, 0) 与 (3, 0)，与 y 轴交于 (0, 3)。</p>
        <p>对称轴为 x = 2。</p>
      </div>
      {!readOnly && <label className="grid gap-2">原卷批注<input className="fixture-input" /></label>}
    </article>
  );
}

function FormSubmit() {
  const process = useProcessHost();
  return <Action primary disabled={process?.actions.submit?.disabled}
    onClick={() => process?.run("submit")}>校验并提交</Action>;
}

function FormFixture({ switcher }: { switcher: ReactNode }) {
  const [title, setTitle] = useState("");
  const [invalidCount, setInvalidCount] = useState(0);
  const invalid = invalidCount > 0;
  const [status, setStatus] = useState("");
  const field = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (!invalidCount) return;
    field.current?.focus({ preventScroll: true });
    field.current?.closest("[data-form-name]")?.scrollIntoView({ block: "nearest" });
  }, [invalidCount]);
  function submit(action: ProcessAction) {
    if (title.trim()) {
      setInvalidCount(0);
      setStatus(action === "next" ? "已进入下一步" : action === "save" ? "已保存" : "已提交");
      return;
    }
    setInvalidCount((count) => count + 1);
  }
  return (
    <FixtureShell switcher={switcher}>
      <ProcessHost ownsHeader title="评分配置" steps={<span>当前步骤 · 设置评分规则</span>}
        actions={{ save: {}, submit: {}, next: {} }} onAction={submit}
        save={(state, run) => <Action disabled={state.disabled} onClick={run}>保存</Action>}
        submit={(state, run) => <Action disabled={state.disabled} onClick={run}>提交</Action>}
        next={(state, run) => <Action primary disabled={state.disabled} onClick={run}>下一步</Action>}>
        <LayoutForm columns={2} anchor={<ul className="space-y-2">
          <li><a href="#fixture-form-basics">基础参数</a></li>
          <li><a href="#fixture-form-name">规则名称</a></li>
        </ul>}
          header={{ title: "规则设置" }}
          bottomBar={<><FormSubmit /><output aria-live="polite">{status}</output></>}>
          {Array.from({ length: 12 }, (_, index) => (
            <label key={index} id={index === 0 ? "fixture-form-basics" : undefined} className="grid gap-2">
              评分参数 {index + 1}
              <input className="fixture-input w-full" type="number" defaultValue={index + 1} />
            </label>
          ))}
          <label className="grid gap-2" data-form-name="">
            规则名称
            <input ref={field} className="fixture-input w-full" id="fixture-form-name" required
              aria-invalid={invalid || undefined} aria-describedby={invalid ? "fixture-form-error" : undefined}
              value={title} onChange={(event) => { setTitle(event.target.value); setInvalidCount(0); }} />
            {invalid && <span id="fixture-form-error" role="alert">请输入规则名称。</span>}
          </label>
        </LayoutForm>
      </ProcessHost>
    </FixtureShell>
  );
}

function OverlaysFixture({ switcher }: { switcher: ReactNode }) {
  const channel = useDrawerChannel();
  const guard = useLeaveGuard();
  const [dialog, setDialog] = useState(false);
  const [dialogSize, setDialogSize] = useState<"sm" | "md" | "lg">("md");
  const [drafts, setDrafts] = useState({ score: "", note: "" });
  const [failSave, setFailSave] = useState(false);
  const [status, setStatus] = useState("");
  const live = useRef(drafts);
  const fail = useRef(failSave);
  const fields = { score: useRef<HTMLInputElement>(null), note: useRef<HTMLInputElement>(null) };
  const dialogFocus = useRef<HTMLInputElement>(null);
  const leaveFocus = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const navigation = drawer("nav", "导航", "navigation");
  const selection = drawer("selection", "对象选择", "selection");
  const auxiliary = drawer("aux", "辅助内容", "auxiliary");
  const detail = drawer("detail", "对象详情", "business");
  const active = channel.state.views.at(-1)?.id;
  const inlineStatuses = active === navigation.id ? ["blocked", "failed"] as const : [];

  function update(key: keyof typeof drafts, value: string) {
    live.current = { ...live.current, [key]: value };
    setDrafts(live.current);
  }
  function hostLabel(id: string) {
    return id === "score" ? "评分草稿" : "批注草稿";
  }
  function editHost(key: keyof typeof drafts): LeaveGuardHost {
    return {
      id: key, objectId: "answer-01", dirty: live.current[key] !== "",
      discard: () => update(key, ""),
      async save() {
        await new Promise<void>((resolve) => setTimeout(resolve, 800));
        if (fail.current) throw new Error("暂时无法保存。请重试。");
        update(key, "");
      },
      returnToEdit() {
        const root = channel.state.views[0];
        if (root) channel.invalidateView(root.id, () => fields[key].current);
        else leaveFocus.current = fields[key].current;
      },
    };
  }
  function requestLeave(target: string, hosts: readonly (keyof typeof drafts)[] = ["score", "note"]) {
    const id = `fixture-leave:${++sequence.current}`;
    guard.request({
      id, target,
      read: () => ({ intentId: id, target, valid: true, hosts: hosts.map(editHost) }),
      navigate: () => {
        if (channel.state.views[0]) channel.invalidateView(channel.state.views[0].id);
        setStatus(`已前往 ${target}`);
      },
    });
  }
  function retry(hostId: string) {
    if (hostId !== "score" && hostId !== "note") return;
    fail.current = false;
    setFailSave(false);
    requestLeave("资源入口", [hostId]);
  }
  function notify() {
    toastManager.add({ title: "已收到通知", description: "可以继续当前操作。" });
  }
  const leaveDialog = <LeaveConfirmDialog hostLabel={hostLabel} inlineStatuses={inlineStatuses} onRetry={retry}
    finalFocus={() => {
      const target = leaveFocus.current;
      leaveFocus.current = null;
      return target ?? true;
    }} />;
  const drawerHost = (
    <DrawerChannelHost closeLabel="关闭" backLabel="返回" overlay={active ? leaveDialog : undefined}
      renderView={(view) => {
        if (view.id === navigation.id) return (
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              <Action onClick={() => channel.pushChild(navigation.id, selection)}>对象选择</Action>
              <Action onClick={() => requestLeave("资源入口")}>前往资源入口</Action>
            </div>
            <LeaveConfirmDialog presentation="inline" inlineStatuses={inlineStatuses} hostLabel={hostLabel} onRetry={retry} />
          </div>
        );
        if (view.id === auxiliary.id) return (
          <div className="space-y-4 p-4">
            <p>答案 01</p>
            <Action onClick={() => channel.pushChild(auxiliary.id, detail)}>打开详情</Action>
          </div>
        );
        return (
          <div className="space-y-4 p-4">
            <p>{view.title} · 答案 01</p>
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger data-slot="workbench-action">轻浮层</PopoverTrigger>
                <PopoverPopup><p>按 ESC 返回详情操作。</p></PopoverPopup>
              </Popover>
              <Select items={[{ value: "a", label: "答案 01" }, { value: "b", label: "答案 02" }]} defaultValue="a">
                <SelectTrigger aria-label="选择答案"><SelectValue /></SelectTrigger>
                <SelectPopup>
                  <SelectItem value="a">答案 01</SelectItem><SelectItem value="b">答案 02</SelectItem>
                </SelectPopup>
              </Select>
              <Action onClick={notify}>触发通知</Action>
            </div>
          </div>
        );
      }} />
  );
  return (
    <FixtureShell switcher={switcher} overlays={
      <ToastProvider>
        {drawerHost}
        {!active && leaveDialog}
        <WorkbenchDialog size={dialogSize} title="复核设置与已登记的长标题详情" description="填写备注或返回当前页面。"
          open={dialog} onOpenChange={setDialog} initialFocus={dialogFocus}
          footer={<><Action onClick={notify}>触发通知</Action><Action primary onClick={() => setDialog(false)}>完成</Action></>}>
          <label className="my-2 grid gap-2">备注<input ref={dialogFocus} className="fixture-input" /></label>
          <ul className="space-y-2">{Array.from({ length: 40 }, (_, index) => <li key={index}>复核设置 {index + 1}</li>)}</ul>
        </WorkbenchDialog>
      </ToastProvider>
    }>
      <LayoutList header={{ title: "浮层与离开守卫" }}>
        <div className="grid gap-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Action onClick={() => channel.openRoot(navigation)}>打开导航 Drawer</Action>
            <Action onClick={() => channel.openRoot(auxiliary)}>打开辅助 Drawer</Action>
            <select className="fixture-input" aria-label="Dialog 尺寸" value={dialogSize}
              onChange={(event) => setDialogSize(event.target.value as typeof dialogSize)}>
              <option value="sm">SM</option><option value="md">MD</option><option value="lg">LG</option>
            </select>
            <Action onClick={() => setDialog(true)}>打开 Dialog</Action>
          </div>
          <label className="grid gap-2">评分草稿
            <input ref={fields.score} className="fixture-input max-w-sm" value={drafts.score} onChange={(event) => update("score", event.target.value)} />
          </label>
          <label className="grid gap-2">批注草稿
            <input ref={fields.note} className="fixture-input max-w-sm" value={drafts.note} onChange={(event) => update("note", event.target.value)} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={failSave}
              onChange={(event) => { fail.current = event.target.checked; setFailSave(event.target.checked); }} />
            模拟保存失败
          </label>
          <div className="flex flex-wrap gap-2">
            <Action onClick={() => update("score", "")}>处理评分草稿</Action>
            <Action onClick={() => update("note", "")}>处理批注草稿</Action>
            <Action onClick={() => requestLeave("资源入口")}>离开编辑</Action>
          </div>
          <output aria-live="polite">{status}</output>
        </div>
      </LayoutList>
    </FixtureShell>
  );
}

function StatesFixture({ switcher }: { switcher: ReactNode }) {
  const [action, setAction] = useState("");
  return (
    <FixtureShell switcher={switcher}>
      <LayoutList header={{ title: "页面状态" }} bottomBar={<output aria-live="polite">{action}</output>}>
        <div className="grid gap-3 py-3">
          <PageStatePanel state="loading" description="正在读取当前资源。" />
          <PageStatePanel state="error" description="读取资源时连接中断。" onRetry={() => setAction("正在重试加载")} />
          <PageStatePanel state="forbidden" description="当前账号无法查看此资源。" />
          <PageStatePanel state="empty" description="当前还没有资源。" />
          <PageStatePanel state="no-results" description="没有资源符合当前筛选条件。" onReset={() => setAction("筛选条件已重置")} />
          <PageStatePanel state="partial-success" description="已处理 8 项，另有 2 项失败。" onRetryFailed={() => setAction("正在重试 2 个失败项")} />
        </div>
      </LayoutList>
    </FixtureShell>
  );
}

const components = {
  list: ListFixture, split: SplitFixture, focus: FocusFixture, form: FormFixture,
  overlays: OverlaysFixture, states: StatesFixture,
};

export function LayoutFixtures({ initialFixture, theme }: { initialFixture: Fixture; theme: string }) {
  const [fixture, setFixture] = useState(initialFixture);
  const Component = components[fixture];
  const oleContext = theme === "dark" || theme === "blueprint-night" ? "dark" : theme === "paper" ? "paperForcedLight" : "light";
  const switcher = (
    <select className="fixture-input min-w-0 max-w-full" aria-label="布局夹具" value={fixture} onChange={(event) => {
      const next = event.target.value as Fixture;
      const url = new URL(window.location.href);
      url.searchParams.set("fixture", next);
      url.hash = "";
      window.history.replaceState(null, "", url);
      setFixture(next);
    }}>
      {Object.entries(fixtures).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select>
  );
  return (
    <div data-prism-theme={theme} data-ole-context={oleContext} className="layout-fixture" lang="zh">
      <LeaveGuardProvider key={fixture}>
        <DrawerChannelProvider>
          <Component switcher={switcher} />
        </DrawerChannelProvider>
      </LeaveGuardProvider>
    </div>
  );
}
