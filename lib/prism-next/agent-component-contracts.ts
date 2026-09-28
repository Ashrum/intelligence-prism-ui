import { coreAgentSpecs } from "./agent-specs"

/** Stable paragraph selectors: excerpts always read the existing Agent Spec, never a copied contract. */
const paragraphStarts: Record<string, readonly string[]> = {
  "object-picker": [
    "AgentObjectPicker (semantic 01, components/prism-next/agent-object-picker.tsx) declares In",
    "Picker required props: title, objectType={id,label}, selection={mode:single}|{mode:multipl",
    "Picker candidates are available={id,name,status:available,description?,recent?,recommendat",
    "Picker view=inline|workspace defaults inline; density=default|compact defaults default, an",
    "Picker onExpand(trigger) and workspace onBack are host navigation only. One notice default"
  ],
  "scope-builder": [
    "AgentScopeBuilder (semantic 02, components/prism-next/agent-scope-builder.tsx) declares In",
    "Scope required props: title, scope={scopeId,version}, readonly dimensions, summary:string|",
    "Restricted scope dimensions={id,label,required,core?,access:restricted,validation:{state:o",
    "confirmation=unconfirmed(reason?)|confirmed(version,reason?)|changed(reason) is external. ",
    "Scope workspace onReset/onRestoreDefaults emit the current target only, never clear or cho"
  ],
  "context-summary": [
    "AgentExecutionProgress (26), AgentExecutionResult (27), and AgentContextSummary (03) suppo",
    "Context adds source.version, selection=unavailable, selectionDetail={description?,version?",
    "AgentContextSummary composes AgentContextList; selection, read, current context and citati"
  ],
  "file-input": [
    "For file selected state, local source displays 已选择（仅本机） and existing source displays 已选择（已",
    "AgentFileInput (semantic 04, components/prism-next/agent-file-input.tsx) declares Inline +",
    "File items={id,name,type,sizeBytes?,source:{kind:local|existing,label?},version?,status,pr",
    "File actions remove/replace/move are declared per item, with disabledReason when unavailab",
    "File view=inline|workspace defaults inline; density=default|compact only changes spacing. "
  ],
  "capture-scan": [
    "AgentCaptureScan (semantic 05, components/prism-next/agent-capture-scan.tsx) declares Inli",
    "Capture props: captureSet={id,title,version:{id,label},snapshot?}, pages:readonly AgentCap",
    "Capture page={id,name,source:string|null,capturedAt:string|null,quality:{state:clear|blurr",
    "Every Capture onIntent carries setId/versionId: capture-request and confirm-set; recapture",
    "Capture receipt=idle|unknown(reason?) or received|running|succeeded|failed|unconfirmed wit"
  ],
  "content-input": [
    "AgentContentInput (semantic 06, components/prism-next/agent-content-input.tsx) declares In",
    "Content input requires title, inputId and content: a single AgentContentField or {type:str",
    "Validation is host-supplied {state:invalid,message} or {state:valid|unknown,message?}, at ",
    "Content input view=inline|workspace defaults inline; density=default|compact defaults defa",
    "Content onSubmit emits {inputId,baseVersion?,draftVersion?,fields:{id,label,type,value}[]}"
  ],
  "parameter-config": [
    "AgentParameterConfig (semantic 07, components/prism-next/agent-parameter-config.tsx) decla",
    "Parameter props require title, opaque baseVersion, and one readonly parameters list. Each ",
    "view=inline|workspace defaults inline; density=default|compact defaults default. Inline st",
    "Parameter status is required: provided means a supplied value, not validation or confirmat",
    "onIntent emits change:{type:change,parameterId,value,baseVersion} or reset:{type:reset,bas"
  ],
  "constraint-builder": [
    "AgentConstraintBuilder (semantic 08, components/prism-next/agent-constraint-builder.tsx) d",
    "Constraint props require title, basis={objectId,version}, groups:readonly {id,label,descri",
    "Constraint validation is required {state:valid,reason?}|{state:conflict,reason,targets:rea",
    "Constraint view=inline|workspace defaults inline; density=default|compact defaults default",
    "Constraint onValueChange emits {objectId,version,constraintId,type,value} with correlated "
  ],
  "template-picker": [
    "AgentTemplatePicker (semantic 09, components/prism-next/agent-template-picker.tsx) declare",
    "Template picker props: title, templateSet={id,version}, templates, controlled selectedId|n",
    "Inline shows recommendations plus the current selection when expand is provided; without e",
    "selectionImpact={requiresConfirmation,description} is host-authored relative to the curren"
  ],
  "candidate-picker": [
    "AgentCandidatePicker (semantic 10, components/prism-next/agent-candidate-picker.tsx) decla",
    "Candidate props require title, candidateSet={id,version}, candidates, selectedIds, result,",
    "AgentCandidateEntry={id,title,type,summary?,rationale:string|null,source:string|null,alter",
    "onIntent is the sole data-change outlet. All intents include candidateSetId/baseVersion: s",
    "submission is required idle/submitting/unconfirmed/submitted/error with optional message ("
  ],
  "collection-basket": [
    "AgentCollectionBasket (semantic 11, components/prism-next/agent-collection-basket.tsx) dec",
    "Collection entries={id,title,type,access?:available,source?,version?,groupId?,summary?,fie",
    "Collection sync defaults unknown: local/synced/failed/unknown display 本页暂存/已同步/同步失败/状态未确认;",
    "Inline shows first inlineLimit (default 3, finite integer >=1) plus every invalid/conflict",
    "Collection entry actions explicitly declare remove, independent move.up/move.down, group={"
  ],
  "structure-arranger": [
    "AgentStructureArranger (semantic 12, components/prism-next/agent-structure-arranger.tsx) d",
    "Arrangement requires structure={id,title,version:{id,label},baseVersion?,snapshot?}, items",
    "summary={groupCount?,itemCount?,itemCountLabel?,totalScore?,targetScore?} is exclusively h",
    "Explicit actions declare move/groupCreate/groupRename/groupDelete/setAttribute/batchMove/b",
    "view inline/workspace and density default/compact share all supplied facts. Inline has rea"
  ],
  "artifact-preview": [
    "AgentArtifactPreview receives object identity, version, status and optional open capabilit"
  ],
  "object-viewer": [
    "AgentObjectViewer (semantic 14, components/prism-next/agent-object-viewer.tsx) declares In",
    "Required object={id,type,name,displayId?}, version={id,label,state:current|historical,curr",
    "Object sections use unique stable IDs: available={id,title,access?:available,summary?,cont",
    "view=inline|workspace defaults inline; density=default|compact defaults default, not a thi",
    "Object actions={id,kind:add-to-collection|review|drilldown,label,disabledReason?} with onA"
  ],
  "change-set": [
    "AgentChangeSet (semantic 15) supports view=inline|workspace with the same host items and d"
  ],
  "review-queue": [
    "AgentReviewQueue (semantic 16, components/prism-next/agent-review-queue.tsx) declares Inli",
    "Queue props require title, queue={id,version,snapshot?}, items:readonly AgentReviewQueueIt",
    "Queue counts?:Partial<Record<AgentItemReviewState,number>> and progress?:{reviewed,total} ",
    "Queue view=inline|workspace defaults inline; density=default|compact defaults default. Wit",
    "Queue onOpen/onNext emit {queueId,queueVersion,itemId,version} and the trigger. onOpen req"
  ],
  "item-reviewer": [
    "AgentItemReviewer (semantic 17, components/prism-next/agent-item-reviewer.tsx) declares In",
    "AgentItemReview is a discriminated host fact with required description. waiting-human/draf",
    "Review actions={id,label,impact,disabledReason?} are host-registered capabilities. onActio",
    "draft={value:T,onChange,render} is entirely controlled. render receives the exact value, a",
    "history records={id,item,state,description,reviewer?,time?,resultVersion?,reason?,request?"
  ],
  "exception-handler": [
    "AgentExceptionHandler (semantic 18, components/prism-next/agent-exception-handler.tsx) dec",
    "Exception disposition requires description and state=waiting-human|waiting|unknown|resolve",
    "Exception actions are host-registered {id,label,impact,disabledReason?}. onAction emits on",
    "Exception evidence={id,label,location,version?,preview?,unavailableReason?} is passive and"
  ],
  "metric-summary": [
    "AgentMetricSummary (semantic 19, components/prism-next/agent-metric-summary.tsx) declares ",
    "Metric props require title, record={id,version,dataTime?,snapshot?}, scope and groups={id,",
    "Metric change={text,direction?:increase|decrease|unchanged|unknown,significance?:significa",
    "Metric scope=available(summary,restricted?:{count?,reason}) or restricted(disclosure:{coun",
    "onDrilldown(intent,trigger) emits metric(recordId,version,metricId,metricVersion), change("
  ],
  "distribution-matrix": [
    "AgentDistributionMatrix (semantic 20, components/prism-next/agent-distribution-matrix.tsx)",
    "Distribution required props: title, record (AgentMetricRecord), scope (AgentMetricScope), ",
    "Distribution sample={size,denominator?} describes the whole matrix in one standing sample/",
    "Distribution onIntent(intent,trigger?) always includes recordId/version/rowDimensionId/col",
    "Distribution accessibility: native scope=row/col headers; each button labelled by row/colu"
  ],
  "evidence-drilldown": [
    "AgentEvidenceDrilldown (semantic 21, components/prism-next/agent-evidence-drilldown.tsx) d",
    "Evidence objects={kind:object,id,title,type,version?,location?,summary?,children,openable?",
    "Evidence path is a controlled readonly ID array, default [], traversing child nodes from t",
    "Restricted evidence/object nodes={id,kind,access:restricted,disclosure:{label,reason}} acc"
  ],
  "suggestion-set": [
    "AgentSuggestionSet (semantic 22, components/prism-next/agent-suggestion-set.tsx) declares ",
    "Suggestion props require title, suggestionSet={id,version,versionLabel?,snapshot?}, sugges",
    "Suggestion evidence={summary:string|null,target?:{conclusionId,version},unavailableReason?",
    "Suggestion onIntent is the built-in intent outlet and always includes suggestionSetId/base",
    "Suggestion comparison={selectedIds,open,disabledReason?} is workspace-only view state, sep"
  ],
  "plan-builder": [
    "AgentPlanBuilder (semantic 23, components/prism-next/agent-plan-builder.tsx) declares Inli",
    "Plan props: plan={id,title,kind:teaching|learning|revision|task,version:{id,label},baseVer",
    "Plan core=draft|confirmed|pending|unconfirmed|unknown, tasks=not-created|partial|created|p",
    "Plan actions explicitly declare step-add/step-edit/step-remove/step-move/assign/attach-res",
    "Plan view=inline|workspace and density=default|compact share the same draft/facts. Inline "
  ],
  "path-priority": [
    "AgentPathPriority (semantic 24, components/prism-next/agent-path-priority.tsx) declares In",
    "Path props: path={id,title,version:{id,label},baseVersion?,snapshot?}; items:readonly {id,",
    "Path status=not-started|in-progress|completed|blocked(reason required)|skipped|snoozed(unt",
    "Path item actions explicitly declare reorder/set-priority/skip/snooze/restore/open-item/ac",
    "Path save=unsaved|saving|saved|conflict|error|unconfirmed|unknown. Snapshot/readOnlyReason"
  ],
  "execution-confirmation": [
    "AgentExecutionConfirmation adds optional conditions:ReactNode before its status/action. Pu",
    "AgentExecutionConfirmation receives a discriminated ready/submitting/received/blocked/unkn"
  ],
  "execution-progress": [
    "AgentExecutionProgress (26), AgentExecutionResult (27), and AgentContextSummary (03) suppo",
    "Progress adds run={id,label,version?}, stages={id,title,state,time?,description?,steps}[],",
    "AgentStep.state accepts done/running/pending/error/unknown/waiting-human/waiting/partial. ",
    "AgentExecutionProgress reuses AgentTaskProgress; overall state and expansion are external."
  ],
  "execution-result": [
    "AgentExecutionProgress (26), AgentExecutionResult (27), and AgentContextSummary (03) suppo",
    "Result adds receipt.record={request,run,version?,receivedAt?}, outputs={id,title,version,s",
    "AgentExecutionResult receives a succeeded/partial/failed/unknown receipt. Unknown exposes "
  ],
  "document-workspace": [
    "AgentDocumentWorkspace (semantic 28, components/prism-next/agent-document-workspace.tsx) d",
    "All four capabilities view/edit/annotate/export are mandatory: supported may have reason; ",
    "Document sections={id,title,content,children?} use unique stable IDs. activeSection is con",
    "Document save={state:unsaved|saved-draft|submitted|conflict|unknown,description?} is exclu",
    "Document quickActions={id,label,capability,disabledReason?} use only registered capability"
  ],
  "slide-workspace": [
    "AgentSlideWorkspace (semantic 29, components/prism-next/agent-slide-workspace.tsx): Inline",
    "Slide props: deckId/version (opaque), title/versionLabel, source={label,openable?}, save, ",
    "Every slide onIntent includes deckId/version: select-slide(slideId), reorder(slideId,toInd",
    "Slide temporary text draft binds source version/content/capability/selection; stale change"
  ],
  "image-canvas": [
    "AgentImageCanvas (semantic 30, components/prism-next/agent-image-canvas.tsx) declares Inli",
    "Image props: title, imageSet={id,version}, complete authorized images, controlled selected",
    "Region={id,label,rect:[left,top,width,height],source:teacher|system|example}; percentages ",
    "Inline provides thumbnail/region count and expand; workspace adds zoom/fit-width/pan, keyb",
    "Image canvas has one standing boundary, collapsed details, merged identical capability rea"
  ],
  "audio-transcript": [
    "AgentAudioTranscript (31) and AgentVideoTimeline (32), 2026-09-27 design candidates: Inlin",
    "Audio props: audioId/version, audio={title,availability,description?,src?,duration?,versio",
    "Both expose view=inline|workspace, density=default|compact, readOnlyReason presence includ",
    "Audio intents always audioId/version: seek(segmentId,seconds), edit-segment(segmentId,text",
    "Media draft binds object/version/content/capability baseline. Changed baseline retains but"
  ],
  "video-timeline": [
    "AgentAudioTranscript (31) and AgentVideoTimeline (32), 2026-09-27 design candidates: Inlin",
    "Audio props: audioId/version, audio={title,availability,description?,src?,duration?,versio",
    "Both expose view=inline|workspace, density=default|compact, readOnlyReason presence includ",
    "Audio intents always audioId/version: seek(segmentId,seconds), edit-segment(segmentId,text",
    "Media draft binds object/version/content/capability baseline. Changed baseline retains but"
  ],
  "artifact-output": [
    "AgentArtifactOutput (semantic 33, components/prism-next/agent-artifact-output.tsx) declare",
    "Artifact output requires artifact={id,title,version:{id,label}}, formats:{id,label,support",
    "AgentArtifactOutputRecord={id,artifactId,title,version:{id,label},format,layout,range,stat",
    "File={id,name,version:{id,label},sizeBytes?,generatedAt?,download?:{label,disabledReason?}",
    "onValueChange and onGenerate emit {artifactId,currentVersionId,options} with copied select"
  ],
  "relation-graph": [
    "AgentRelationGraph (semantic 34, components/prism-next/agent-relation-graph.tsx): Inline +",
    "Relation props: graphId/version (opaque), readable title/versionLabel, complete authorized",
    "Every relation intent includes graphId/version: select-node(nodeId), filter(filter), open-",
    "Relation graph/list share one induced subgraph. Equivalent list preserves full names, type"
  ],
  "structured-content": [
    "AgentStructuredContent (semantic 35, components/prism-next/agent-structured-content.tsx) d",
    "Structure props require structure={id,title,version:{id,label},baseVersion?,snapshot?,curr",
    "onSelect emits {structureId,versionId,nodeId}; selection changes only via props. expandedI",
    "onIntent receives {structureId,versionId,baseVersionId} plus rename:{nodeId,title}, add:{n",
    "view=inline|workspace defaults inline and density=default|compact defaults default. Inline"
  ],
  "resource-retriever": [
    "AgentResourceRetriever (semantic 36, components/prism-next/agent-resource-retriever.tsx) d",
    "Resource props require title, resourceSet={id,version}, resources, query={value,label?,dis",
    "AgentResource requires opaque id/version (nullable version), readable title/versionLabel/d",
    "Resource license states available/restricted/confirmation-required/unknown are host facts;",
    "Resource preview={resourceId,resourceVersion,requestedBy:user,state:loading|ready|error,me"
  ],
  "material-extractor": [
    "AgentMaterialExtractor (semantic 37, components/prism-next/agent-material-extractor.tsx) d",
    "MaterialExtractor context={extractorId,baseRevision}, sources, candidates, selection and t",
    "MaterialTextRange={sourceId,sourceVersion,start:{paragraphId,offset},end:{paragraphId,offs",
    "All MaterialExtractor business operations emit onIntent with extractorId/baseRevision. sel",
    "MaterialExtractor candidate states candidate/confirmed/added(targetLabel)/invalid(reason)/"
  ],
  "material-pack": [
    "AgentMaterialPack (semantic 38, components/prism-next/agent-material-pack.tsx) declares In",
    "MaterialPack props: pack={id,title,version:{id,label},baseVersion:{id,label},snapshot?}; c",
    "MaterialPack item={resource:{resourceId,versionId:string|null,source:AgentResourceSource},",
    "Every MaterialPack onIntent carries packId/versionId/baseVersionId. add-request/category-c",
    "MaterialPack reuse record={id,target:{objectId,versionId:string|null,label,versionLabel:st"
  ],
  "interactive-demo": [
    "AgentInteractiveDemo (39) and AgentSimulationLab (41), 2026-09-27 design candidates: Inlin",
    "39 props demoId/version/title, subject?/grade?, parameters={id,label,min,max,step,value:nu",
    "Both view=inline|workspace and density=default|compact default inline/default; onExpand(tr"
  ],
  "calc-tool": [
    "AgentCalcTool (semantic 40, components/prism-next/agent-calc-tool.tsx) declares Inline + d",
    "Calc props: toolSessionId/version, controlled expression/mode, capabilities for evaluate/s",
    "Calc result binds toolSessionId/version/expression/mode and requires readable text; mismat",
    "Every calc onIntent includes toolSessionId/version: change-input(expression,mode), evaluat",
    "Inline Enter and both views Ctrl/Cmd+Enter equal guarded Calculate; workspace Enter is new"
  ],
  "simulation-lab": [
    "AgentInteractiveDemo (39) and AgentSimulationLab (41), 2026-09-27 design candidates: Inlin",
    "41 props labId/version/title/objective, steps={id,title,description?}[], controlled curren",
    "41 capabilities run/step/record/export and mobileSupport. Events set-variable(variableId,v",
    "Both view=inline|workspace and density=default|compact default inline/default; onExpand(tr"
  ],
  "subject-editor": [
    "AgentSubjectEditor (semantic 42, components/prism-next/agent-subject-editor.tsx) declares ",
    "Subject editor value is the exact controlled expression without prose delimiters; formulaI",
    "Subject onIntent emits {type:change|apply|cancel,formulaId,baseVersion,formulaMode,value?}",
    "Inline has eight quick insertion buttons; workspace has five groups (structure/relation/op"
  ]
}

export function getSemanticContract(slug: string): string[] {
  return (paragraphStarts[slug] ?? []).map(prefix => {
    const paragraph = coreAgentSpecs["agent-components"].contract.find(text => text.startsWith(prefix))
    if (!paragraph) throw new Error(`Missing Agent Spec paragraph for ${slug}: ${prefix}`)
    return paragraph
  })
}
