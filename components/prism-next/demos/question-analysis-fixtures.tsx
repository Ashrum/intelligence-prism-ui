"use client"
import type {QuestionAnalysisCardProps} from '../question-analysis-card'
import type {QuestionAnalysisPanelProps} from '../question-analysis-panel'
import type {StudentControlItem} from '../student-control-bar'
import {reviewFormula} from './review-workspace-fixtures'
export const analysisStudents:StudentControlItem[]=[{id:'a',name:'张同学',examId:'20260001',score:6,scoreText:'6 分',status:'部分得分',review:'待复核',ratio:50,identityTone:'warning',tickTone:'warning',group:'待复核'},{id:'b',name:'长中文姓名与完整身份核对',examId:'20260002',score:12,scoreText:'12 分',status:'满分',review:'已确认',ratio:100,identityTone:'success',tickTone:'neutral',group:'已确认'}]
export const analysisEvidence=[{question:'q17',points:['p2'],label:<>第 17 题 · 评分点 2 · {reviewFormula}</>}]
export const analysisKnowledge=[{id:'ellipse',name:'椭圆焦距关系与离心率约束的完整推导',rate:42,secondary:'受影响 21 / 36 · 1 道证据题',status:'继续观察',evidence:analysisEvidence}]
export const analysisQuestion:QuestionAnalysisCardProps['question']={id:'review-demo',number:17,type:'解答题',category:'subjective',max:12,record:{id:'review-demo',title:'椭圆条件与参数范围',kind:'解答题',points:12,stem:<>请根据完整题设核对参数约束，说明下列关系成立的条件并保留必要的推导过程：{reviewFormula}</>,answer:<>参数条件与关系：{reviewFormula}</>,explanation:'根据题设逐步建立等量关系，核对每一步等价变形及取值范围。'},points:[{id:'p2',label:'说明完整的参数约束与结论之间的关系',max:12,rate:42,knowledge:['ellipse']}]}
export const analysisPanel:Omit<QuestionAnalysisPanelProps,'onKnowledge'|'onEvidence'>={total:36,kind:'解答题',max:12,statistics:{mean:'5.6',sd:'4.2',d:'0.32',discrimination:'良好',fullRate:'16.7',zeroRate:'30.6'},distribution:[6,19,11],affected:30,rate:47,pending:2,reasons:[{text:'推导过程未说明参数取值范围与结论之间的完整逻辑联系',count:12}],related:analysisKnowledge}
