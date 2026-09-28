"use client"

import type { ReactNode } from "react"
import { AgentChangeSetDemo } from "./agent-change-set"
import { AgentSemanticGroupDemo } from "./agent-semantic-group"
import { AgentRecordViewsDemo } from "./agent-record-views"
import { AgentExceptionHandlerDemo } from "./agent-exception-handler"
import { AgentEvidenceDrilldownDemo } from "./agent-evidence-drilldown"
import { AgentItemReviewerDemo } from "./agent-item-reviewer"
import { AgentDocumentWorkspaceDemo } from "./agent-document-workspace"
import { AgentFileInputDemo } from "./agent-file-input"
import { AgentCollectionBasketDemo } from "./agent-collection-basket"
import { AgentObjectViewerDemo } from "./agent-object-viewer"
import { AgentScopeBuilderDemo } from "./agent-scope-builder"
import { AgentCandidatePickerDemo } from "./agent-candidate-picker"
import { AgentSuggestionSetDemo } from "./agent-suggestion-set"
import { AgentResourceRetrieverDemo } from "./agent-resource-retriever"
import { AgentAudioTranscriptDemo, AgentVideoTimelineDemo } from "./agent-media-workspaces"
import { AgentSlideWorkspaceDemo } from "./agent-slide-workspace"
import { AgentRelationGraphDemo } from "./agent-relation-graph"
import { AgentInteractiveDemoDemo, AgentSimulationLabDemo } from "./agent-subject-demos"
import { AgentCalcToolDemo } from "./agent-calc-tool"
import { AgentImageCanvasDemo } from "./agent-image-canvas"
import { AgentTemplatePickerDemo } from "./agent-template-picker"
import { AgentParameterConfigDemo } from "./agent-parameter-config"
import { AgentConstraintBuilderDemo } from "./agent-constraint-builder"
import { AgentArtifactOutputDemo } from "./agent-artifact-output"
import { AgentPlanBuilderDemo } from "./agent-plan-builder"
import { AgentPathPriorityDemo } from "./agent-path-priority"
import { AgentCaptureScanDemo } from "./agent-capture-scan"
import { AgentMaterialPackDemo } from "./agent-material-pack"
import { AgentStructureArrangerDemo } from "./agent-structure-arranger"
import { AgentStructuredContentDemo } from "./agent-structured-content"
import { AgentMetricSummaryDemo } from "./agent-metric-summary"
import { AgentDistributionMatrixDemo } from "./agent-distribution-matrix"
import { AgentObjectPickerDemo } from "./agent-object-picker"
import { AgentReviewQueueDemo } from "./agent-review-queue"
import { AgentContentInputDemo } from "./agent-content-input"
import { AgentSubjectEditorDemo } from "./agent-subject-editor"
import { AgentMaterialExtractorDemo } from "./agent-material-extractor"
import { AgentCorePreview } from "./agent-core-previews"
import { LearningComponentDemo } from "./learning-components"

export const agentComponentExamples: Record<string, { description: string; preview: ReactNode; examples: ReactNode }> = {
  "object-picker": { description: "选择具体对象，并保留对象的身份与可用情况。", preview: <AgentObjectPickerDemo />, examples: <AgentObjectPickerDemo /> },
  "scope-builder": { description: "组合班级、教材与资料来源等任务范围。", preview: <AgentScopeBuilderDemo />, examples: <AgentScopeBuilderDemo /> },
  "context-summary": { description: "分开呈现选用、读取、本轮参考与引用记录。", preview: <AgentCorePreview kind="context" />, examples: <AgentRecordViewsDemo initialKind="context" onlyKind /> },
  "file-input": { description: "选择已有文件，查看队列与接收情况。", preview: <AgentFileInputDemo />, examples: <AgentFileInputDemo /> },
  "capture-scan": { description: "核对采集页、页序与质量记录。", preview: <AgentCaptureScanDemo />, examples: <AgentCaptureScanDemo /> },
  "content-input": { description: "输入题干、答案或结构化讲评材料。", preview: <AgentContentInputDemo />, examples: <AgentContentInputDemo /> },
  "parameter-config": { description: "查看与调整任务参数，保留校验提示。", preview: <AgentParameterConfigDemo />, examples: <AgentParameterConfigDemo /> },
  "constraint-builder": { description: "整理处理条件，定位冲突与影响。", preview: <AgentConstraintBuilderDemo />, examples: <AgentConstraintBuilderDemo /> },
  "template-picker": { description: "比较并选择适合当前任务的模板。", preview: <AgentTemplatePickerDemo />, examples: <AgentTemplatePickerDemo /> },
  "candidate-picker": { description: "从候选结果中选择条目并确认去向。", preview: <AgentCandidatePickerDemo />, examples: <AgentCandidatePickerDemo /> },
  "collection-basket": { description: "集中查看和管理已收集的条目。", preview: <AgentCollectionBasketDemo />, examples: <AgentCollectionBasketDemo /> },
  "structure-arranger": { description: "调整已有条目的顺序与结构。", preview: <AgentStructureArrangerDemo />, examples: <AgentStructureArrangerDemo /> },
  "artifact-preview": { description: "查看成果身份、版本与内容摘要。", preview: <AgentCorePreview kind="preview" />, examples: <AgentSemanticGroupDemo initialSection="preview" onlySection /> },
  "object-viewer": { description: "查看对象详情与允许展示的内容。", preview: <AgentObjectViewerDemo />, examples: <AgentObjectViewerDemo /> },
  "change-set": { description: "逐项比较修改建议并保留采纳决定。", preview: <AgentChangeSetDemo />, examples: <AgentChangeSetDemo /> },
  "review-queue": { description: "浏览待审条目，查看状态并选择下一项。", preview: <AgentReviewQueueDemo />, examples: <AgentReviewQueueDemo /> },
  "item-reviewer": { description: "核对单个条目的草稿、证据与审核结果。", preview: <AgentItemReviewerDemo />, examples: <AgentItemReviewerDemo /> },
  "exception-handler": { description: "了解异常影响并选择可用的处置方式。", preview: <AgentExceptionHandlerDemo />, examples: <AgentExceptionHandlerDemo /> },
  "metric-summary": { description: "阅读指标、统计口径与缺测说明。", preview: <AgentMetricSummaryDemo />, examples: <AgentMetricSummaryDemo /> },
  "distribution-matrix": { description: "比较多个维度的分布并查看单元格依据。", preview: <AgentDistributionMatrixDemo />, examples: <AgentDistributionMatrixDemo /> },
  "evidence-drilldown": { description: "沿证据链查看来源并返回原处。", preview: <AgentEvidenceDrilldownDemo />, examples: <AgentEvidenceDrilldownDemo /> },
  "suggestion-set": { description: "比较建议的依据与影响，选择或调整建议。", preview: <AgentSuggestionSetDemo />, examples: <AgentSuggestionSetDemo /> },
  "plan-builder": { description: "编排步骤、时间和检查点。", preview: <AgentPlanBuilderDemo />, examples: <AgentPlanBuilderDemo /> },
  "path-priority": { description: "查看顺序、依赖与阻塞，调整跟进优先级。", preview: <AgentPathPriorityDemo />, examples: <AgentPathPriorityDemo /> },
  "execution-confirmation": { description: "确认操作对象、版本和影响范围。", preview: <AgentCorePreview kind="confirmation" />, examples: <AgentSemanticGroupDemo initialSection="confirmation" onlySection /> },
  "execution-progress": { description: "查看当前阶段、步骤和异常记录。", preview: <AgentCorePreview kind="progress" />, examples: <AgentRecordViewsDemo initialKind="progress" onlyKind /> },
  "execution-result": { description: "区分完成与剩余范围，查看回执和成果。", preview: <AgentCorePreview kind="result" />, examples: <AgentRecordViewsDemo initialKind="result" onlyKind /> },
  "document-workspace": { description: "阅读与编辑文档章节，核对版本与保存状态。", preview: <AgentDocumentWorkspaceDemo />, examples: <AgentDocumentWorkspaceDemo /> },
  "slide-workspace": { description: "浏览课件页面、备注并调整页面顺序。", preview: <AgentSlideWorkspaceDemo />, examples: <AgentSlideWorkspaceDemo /> },
  "image-canvas": { description: "查看图像、定位区域并核对标注。", preview: <AgentImageCanvasDemo />, examples: <AgentImageCanvasDemo /> },
  "audio-transcript": { description: "查看录音与转写片段，核对时间和文字。", preview: <AgentAudioTranscriptDemo />, examples: <AgentAudioTranscriptDemo /> },
  "video-timeline": { description: "查看视频章节、字幕与时间标记。", preview: <AgentVideoTimelineDemo />, examples: <AgentVideoTimelineDemo /> },
  "artifact-output": { description: "查看可用输出格式、预览与文件情况。", preview: <AgentArtifactOutputDemo />, examples: <AgentArtifactOutputDemo /> },
  "relation-graph": { description: "查看知识点等对象间的关系及其来源。", preview: <AgentRelationGraphDemo />, examples: <AgentRelationGraphDemo /> },
  "structured-content": { description: "浏览和调整内容层级，保留版本依据。", preview: <AgentStructuredContentDemo />, examples: <AgentStructuredContentDemo /> },
  "resource-retriever": { description: "查询资源并区分预览、读取和引用情况。", preview: <AgentResourceRetrieverDemo />, examples: <AgentResourceRetrieverDemo /> },
  "material-extractor": { description: "选择文本片段，保留出处与范围。", preview: <AgentMaterialExtractorDemo />, examples: <AgentMaterialExtractorDemo /> },
  "material-pack": { description: "分类整理素材，并保留原始引用。", preview: <AgentMaterialPackDemo />, examples: <AgentMaterialPackDemo /> },
  "interactive-demo": { description: "调整演示参数并观察对应变化。", preview: <AgentInteractiveDemoDemo />, examples: <AgentInteractiveDemoDemo /> },
  "calc-tool": { description: "核对表达式、计算结果与过程依据。", preview: <AgentCalcToolDemo />, examples: <AgentCalcToolDemo /> },
  "simulation-lab": { description: "按步骤探索实验变量，记录观察。", preview: <AgentSimulationLabDemo />, examples: <AgentSimulationLabDemo /> },
  "subject-editor": { description: "编辑单个公式片段并核对替换范围。", preview: <AgentSubjectEditorDemo />, examples: <AgentSubjectEditorDemo /> },
}

export const agentSupplementalExamples = [
  { slug: "record-views", name: "任务记录三件套", description: "在同一组记录中比较上下文、进度和执行结果。", preview: <AgentCorePreview kind="progress" />, examples: <AgentRecordViewsDemo /> },
  { slug: "change-set-two-state", name: "对比查看器两态", description: "比较对话摘要和完整差异中的同一组采纳草稿。", preview: <AgentChangeSetDemo />, examples: <AgentChangeSetDemo /> },
  { slug: "context-summary-review", name: "从任务依据到执行结果", description: "观察确认范围、执行记录与成果摘要如何组合。", preview: <AgentCorePreview kind="preview" />, examples: <AgentSemanticGroupDemo initialSection="composition" /> },
  { slug: "existing-agent-inputs", name: "既有输入与引导组件", description: "体验指令输入、澄清问题和来源查看。", preview: <AgentCorePreview kind="input" />, examples: <LearningComponentDemo kind="agent-components" /> },
] as const
