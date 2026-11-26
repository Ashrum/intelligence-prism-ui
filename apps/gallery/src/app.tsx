import { useRef, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSub,
  ContextMenuSubPopup,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DataTable,
  FilterBar,
  FilterBarActions,
  FilterBarBody,
  FilterBarChips,
  FilterBarHeader,
  FilterChipOptions,
  FilterChipShell,
  useDataTable,
  type ColumnDef,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  Input,
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
  PortalScope,
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
  PrismRulerShell,
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  ToastPrimitive,
  ToastProvider,
} from "@ole/ui";
import { ArrowDown, ArrowUpRight, Layers, Moon, PanelRightOpen, Sun } from "lucide-react";

type Theme = "light" | "dark";

const themeKey = "ole-gallery-theme";
const sections = [
  { id: "controls", label: "Controls" },
  { id: "overlays", label: "Overlays" },
  { id: "data", label: "Data display" },
];
const palette = [
  { name: "Sky", hex: "#4EB1D9", color: "bg-prism-sky" },
  { name: "Pink", hex: "#E0438F", color: "bg-prism-pink" },
  { name: "Lime", hex: "#C2F25B", color: "bg-prism-lime" },
];
const subjects = [
  { value: "math", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "language", label: "Language arts" },
];
const assignmentRows = [
  { id: "linear-equations", title: "Linear equations", subject: "Mathematics", status: "Ready" },
  { id: "states-of-matter", title: "States of matter", subject: "Science", status: "In review" },
  { id: "reading-inference", title: "Reading inference", subject: "Language arts", status: "Draft" },
];

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function SubjectSelect({ label }: { label: string }) {
  return (
    <Select items={subjects} defaultValue="math">
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false}>
        {subjects.map((subject) => (
          <SelectItem key={subject.value} value={subject.value}>
            {subject.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}

function DemoSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="demo-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-block-title">{title}</h2>
      {children}
    </section>
  );
}

function Controls() {
  const toast = ToastPrimitive.useToastManager();
  return (
    <DemoSection id="controls" title="Controls">
      <Tabs defaultValue="fields">
        <TabsList aria-label="Control examples">
          <TabsTab value="fields">Fields</TabsTab>
          <TabsTab value="buttons">Buttons</TabsTab>
        </TabsList>
        <TabsPanel value="fields" className="demo-fields">
          <div>
            <label htmlFor="assignment-name">Assignment name</label>
            <Input id="assignment-name" placeholder="e.g. Linear equations" />
          </div>
          <div>
            <span className="field-label">Subject</span>
            <SubjectSelect label="Subject" />
          </div>
        </TabsPanel>
        <TabsPanel value="buttons" className="button-examples">
          <Button onClick={() => toast.add({
            title: "Draft saved",
            description: "Your assignment is ready to edit.",
            type: "success",
          })}>Save draft</Button>
          <Button variant="outline" onClick={() => toast.add({
            title: "Share link generated",
            type: "info",
          })}>Generate link</Button>
          <Button disabled>Disabled</Button>
        </TabsPanel>
      </Tabs>
      <Accordion aria-label="Assignment help">
        <AccordionItem value="visibility">
          <AccordionTrigger>Who can see a draft?</AccordionTrigger>
          <AccordionPanel>Draft assignments stay private until you share them.</AccordionPanel>
        </AccordionItem>
      </Accordion>
    </DemoSection>
  );
}

function FocusDemo() {
  const titleInput = useRef<HTMLInputElement>(null);
  const noteInput = useRef<HTMLInputElement>(null);
  const toast = ToastPrimitive.useToastManager();

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Layers aria-hidden="true" /> Open focus demo
      </DialogTrigger>
      <DialogPopup initialFocus={titleInput}>
        <DialogHeader>
          <DialogTitle>Edit assignment</DialogTitle>
          <DialogDescription>
            Press Tab to move within the dialog. Open the nested popover and press Escape to return to its trigger.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="dialog-name" className="text-ui-action">Assignment title</label>
            <Input id="dialog-name" ref={titleInput} defaultValue="Linear equations" />
          </div>
          <SubjectSelect label="Assignment subject" />
          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="justify-self-start" />}>
              Add a note
            </PopoverTrigger>
            <PopoverPopup initialFocus={noteInput} className="w-64">
              <PopoverTitle>Assignment note</PopoverTitle>
              <PopoverDescription>Keep a reminder with the draft.</PopoverDescription>
              <Input ref={noteInput} aria-label="Note" placeholder="Add a reminder" className="mt-2" />
              <PopoverClose render={<Button variant="outline" size="sm" className="mt-3" />}>
                Done
              </PopoverClose>
            </PopoverPopup>
          </Popover>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />} onClick={() => toast.add({
            title: "Assignment saved",
            type: "success",
          })}>Save assignment</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function Overlays() {
  const toast = ToastPrimitive.useToastManager();
  const contextTrigger = useRef<HTMLDivElement>(null);
  const [contextOpen, setContextOpen] = useState<"pointer" | "keyboard" | null>(null);
  return (
    <DemoSection id="overlays" title="Overlays">
      <div className="overlay-demo">
        <div>
          <h3 className="text-ui-action">Nested overlay focus</h3>
          <p className="text-ui-hint text-muted-foreground">Dialog, Select and Popover share a portal host.</p>
        </div>
        <FocusDemo />
      </div>
      <div className="button-examples">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            <PanelRightOpen aria-hidden="true" /> Open sheet
          </SheetTrigger>
          <SheetPopup side="right">
            <SheetHeader>
              <SheetTitle>Assignment details</SheetTitle>
              <SheetDescription>Review the learning objective and subject.</SheetDescription>
            </SheetHeader>
            <SheetPanel className="space-y-2">
              <h3 className="text-block-title">Linear equations</h3>
              <p className="text-read-body">Solve and interpret one-variable equations using equivalent expressions.</p>
            </SheetPanel>
          </SheetPopup>
        </Sheet>
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            <ArrowUpRight aria-hidden="true" /> Open popover
          </PopoverTrigger>
          <PopoverPopup className="w-64">
            <PopoverTitle>Subject guide</PopoverTitle>
            <PopoverDescription>Use the subject field to organize related assignments.</PopoverDescription>
          </PopoverPopup>
        </Popover>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>Discard draft</AlertDialogTrigger>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
              <AlertDialogDescription>Unsaved assignment changes will be lost.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>Keep draft</AlertDialogClose>
              <AlertDialogClose render={<Button variant="destructive" />}
                onClick={() => toast.add({ title: "Draft discarded" })}>Discard</AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
        <PreviewCard>
          <PreviewCardTrigger href="#data" className="text-ui-action underline underline-offset-4">
            Preview assignments
          </PreviewCardTrigger>
          <PreviewCardPopup>View assignment titles, subjects and review statuses.</PreviewCardPopup>
        </PreviewCard>
      </div>
      <ContextMenu open={contextOpen !== null} onOpenChange={(open) => setContextOpen(open ? "pointer" : null)}>
        <ContextMenuTrigger ref={contextTrigger} tabIndex={0} className="rounded-lg border border-dashed p-4 text-ui-body"
          onKeyDown={(event) => {
            if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
            event.preventDefault();
            setContextOpen("keyboard");
          }}>
          Right-click or press Shift+F10 for assignment actions
        </ContextMenuTrigger>
        <ContextMenuPopup anchor={contextOpen === "keyboard" ? contextTrigger : undefined} finalFocus={contextTrigger}>
          <ContextMenuItem onClick={() => toast.add({ title: "Assignment duplicated" })}>Duplicate assignment</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
            <ContextMenuSubPopup>
              <ContextMenuItem onClick={() => toast.add({ title: "Assignment moved to drafts" })}>Drafts</ContextMenuItem>
            </ContextMenuSubPopup>
          </ContextMenuSub>
        </ContextMenuPopup>
      </ContextMenu>
    </DemoSection>
  );
}

const assignmentColumns: ColumnDef<(typeof assignmentRows)[number]>[] = [
  { accessorKey: "title", header: "Assignment" },
  { accessorKey: "subject", header: "Subject" },
  { accessorKey: "status", header: "Status" },
];
const assignmentStatuses = ["Ready", "In review", "Draft", "Archived"].map((status) => ({
  id: status, label: status, count: assignmentRows.filter((row) => row.status === status).length,
}));

function DataDisplay() {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState("Ready");
  const expandButton = useRef<HTMLButtonElement>(null);
  const rows = status ? assignmentRows.filter((row) => row.status === status) : assignmentRows;
  const table = useDataTable({ data: rows, columns: assignmentColumns, getRowId: (row) => row.id });

  return (
    <DemoSection id="data" title="Data display">
      <FilterBar aria-label="Assignment filters">
        <FilterBarHeader expanded={expanded}>
          <span className="text-ui-action">Filters</span>
          {!expanded && status && (
            <FilterBarChips aria-label="Applied assignment filters">
              <FilterChipShell label="Status" removeLabel={`Remove status filter: ${status}`} onRemove={() => {
                setStatus("");
                expandButton.current?.focus();
              }}>
                <FilterChipOptions options={assignmentStatuses} value={status} valueLabel={status}
                  triggerLabel={`Change status filter: ${status}`} optionsLabel="Status options" onValueChange={setStatus} />
              </FilterChipShell>
            </FilterBarChips>
          )}
          <FilterBarActions
            reset={{ children: "Reset", disabled: !status, onClick: () => setStatus("") }}
            toggle={{
              ref: expandButton, "aria-expanded": expanded, "aria-controls": "assignment-filter-options",
              children: expanded ? "Collapse filters" : "Expand filters", onClick: () => setExpanded(!expanded),
            }}
          />
        </FilterBarHeader>
        <FilterBarBody id="assignment-filter-options" expanded={expanded}>
          <div className="flex flex-wrap items-center gap-1 p-2">
            {assignmentStatuses.map((option) => (
              <Button key={option.id} size="xs" variant="outline" aria-pressed={status === option.id}
                disabled={option.count === 0} onClick={() => setStatus(option.id)}>
                {option.label} <span className="tabular-nums">{option.count}</span>
              </Button>
            ))}
          </div>
        </FilterBarBody>
      </FilterBar>
      <DataTable table={table} aria-label="Example assignment statuses"
        getCellClassName={({ column }) => column.id === "title" ? "font-medium" : undefined} />
    </DemoSection>
  );
}

export function App() {
  const [theme, setTheme] = useState(initialTheme);
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
  const dark = theme === "dark";

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(themeKey, next);
    } catch {
      // The toggle still works for the current page.
    }
  }

  return (
    <div className="gallery" data-prism-theme={theme}>
      <a className="skip-link" href="#gallery-main">Skip to components</a>
      <div className="gallery-layout">
        <header className="site-header">
          <a href="./" className="wordmark" aria-label="OLE UI gallery">
            <span className="wordmark-mark" aria-hidden="true">O</span>
            OLE<span className="wordmark-ui">UI</span>
          </a>
          <Button variant="outline" onClick={toggleTheme}>
            {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            {dark ? "Light mode" : "Dark mode"}
          </Button>
        </header>

        <main id="gallery-main" tabIndex={-1}>
          <header className="gallery-heading">
            <div>
              <h1>Component Gallery</h1>
              <p className="text-read-body text-muted-foreground">
                Explore the controls, overlays and Smart Prism theme in <code>@ole/ui</code>.
              </p>
            </div>
            <a href="#controls" className="jump-link text-ui-action">
              Explore components <ArrowDown size={15} aria-hidden="true" />
            </a>
          </header>

          <PortalScope container={portalHost}>
            <ToastProvider>
              <PrismRulerShell className="gallery-sheet">
                <aside className="sheet-aside">
                  <nav aria-label="On this page">
                    {sections.map(({ id, label }) => <a key={id} href={`#${id}`}>{label}</a>)}
                  </nav>
                  <div className="palette">
                    <h2 className="text-block-title">Smart Prism <span lang="zh">一色一尺</span></h2>
                    <ul>
                      {palette.map(({ name, hex, color }) => (
                        <li key={name}>
                          <span className={`palette-swatch ${color}`} aria-hidden="true" />
                          <span>{name}</span>
                          <code>{hex}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
                <div className="sheet-content">
                  <Controls />
                  <Overlays />
                  <DataDisplay />
                </div>
              </PrismRulerShell>
            </ToastProvider>
          </PortalScope>
        </main>
      </div>
      <div ref={setPortalHost} data-gallery-portal="" />
    </div>
  );
}
