import { useMemo, useRef, useState } from "react";
import {
  Button, DatePicker, Editable, FileUpload, ResizableHandle, ResizablePanel, ResizablePanelGroup,
  TagsInput, VirtualList, type VirtualListHandle, type VirtualListScrollSnapshot,
} from "@ole/ui";
import { DemoSection } from "./demo-section";

const initialRows = Array.from({ length: 500 }, (_, index) => index + 1);
const rowKey = (id: number) => id;

function VirtualListDemo() {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [atBottom, setAtBottom] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [version, setVersion] = useState(0);
  const savedScroll = useRef<VirtualListScrollSnapshot>(undefined);
  const list = useRef<VirtualListHandle>(null);
  const visible = useMemo(() => query ? rows.filter((row) => `Row ${row}`.toLowerCase().includes(query.toLowerCase())) : rows, [query, rows]);

  return (
    <DemoSection id="virtual-list" title="Virtual list">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => list.current?.scrollToBottom()}>Go to bottom</Button>
        <Button size="sm" variant="outline" onClick={() => setRows((current) => [...current, current.length + 1])}>Append row</Button>
        <Button size="sm" variant="outline" aria-pressed={expanded} onClick={() => setExpanded((current) => !current)}>Expand last row</Button>
        <Button size="sm" variant="outline" onClick={() => {
          savedScroll.current = list.current?.getScrollSnapshot();
          setVersion((current) => current + 1);
        }}>Remount and restore</Button>
        <span className="text-ui-hint text-muted-foreground">{atBottom ? "At bottom" : "Reading above bottom"}</span>
      </div>
      <VirtualList
        key={version}
        ref={list}
        role="region"
        aria-label="Virtual rows"
        className="h-64 rounded-lg border bg-card text-card-foreground"
        items={visible}
        estimateSize={42}
        overscan={5}
        followBottom
        getItemKey={rowKey}
        initialScrollSnapshot={savedScroll.current}
        onBottomAnchorChange={setAtBottom}
        stickyHeader={(
          <div className="border-b p-2">
            <input
              type="search" aria-label="Search rows" placeholder="Search rows" value={query}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              onChange={(event) => {
                setQuery(event.target.value);
                list.current?.restoreScrollOffset(0);
              }}
            />
          </div>
        )}
        renderItem={(row) => (
          <div className="border-b px-3 py-2.5 text-ui-body">
            <span className="font-medium tabular-nums">Row {row}</span>
            {row % 7 === 0 && <p className="text-muted-foreground">This row has an additional line.</p>}
            {expanded && row === rows.at(-1) && <p className="py-6 text-muted-foreground">This row grew after it was rendered.</p>}
          </div>
        )}
      />
      {!visible.length && <p className="text-ui-hint text-muted-foreground">No matching rows.</p>}
    </DemoSection>
  );
}

export function WaveTwoDemos() {
  return (
    <>
      <VirtualListDemo />
      <DemoSection id="resizable-panels" title="Resizable panels">
        <ResizablePanelGroup className="h-32 rounded-lg border bg-card text-card-foreground">
          <ResizablePanel id="gallery-primary" defaultSize="45%" minSize="24%">
            <p className="p-3 text-ui-body">First panel</p>
          </ResizablePanel>
          <ResizableHandle aria-label="Resize first panel" />
          <ResizablePanel id="gallery-secondary" minSize="24%">
            <p className="p-3 text-ui-body">Second panel</p>
          </ResizablePanel>
        </ResizablePanelGroup>
        <p className="text-ui-hint text-muted-foreground">Use arrow keys to resize, Shift for a larger step, and Home or End for the limits. Press Enter or double-click to reset.</p>
      </DemoSection>
      <DemoSection id="date-picker" title="Date picker">
        <div className="flex flex-wrap gap-2">
          <DatePicker label="Single date" />
          <DatePicker mode="range" label="Date range" />
        </div>
      </DemoSection>
      <DemoSection id="editable" title="Editable">
        <Editable label="Display text" defaultValue="Sample text" className="max-w-sm" />
      </DemoSection>
      <DemoSection id="tags-input" title="Tags input">
        <TagsInput label="Tags" defaultValue={["Blue", "Green"]} maxTags={5} placeholder="Type a tag, then press Enter or comma" className="max-w-lg" />
      </DemoSection>
      <DemoSection id="file-upload" title="File picker">
        <FileUpload accept=".txt,image/*" maxSize={2 * 1024 * 1024} className="max-w-lg" />
      </DemoSection>
    </>
  );
}
