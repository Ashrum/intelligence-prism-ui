"use client"
import {QuestionAnalysisPanel, type QuestionAnalysisPanelCompactProps} from '../question-analysis-panel'
import {DemoSection} from '../demo-parts'
import {ReviewDemoThemes, reviewFormula} from './review-workspace-fixtures'

const referenceItems=[
 {id:'last',label:'本班上次',value:-57.8,source:'本班第 2 次检测',date:'2026-09-22'},
 {id:'school',label:'本校',value:-57.8,source:'本校同卷检测',date:'2026-10-06'},
 {id:'region',label:'区域',value:-68.1,source:'区域同卷检测',date:'2026-10-06'},
 {id:'class1',label:'本校参照 1 班',value:-57.8,source:'本校同卷检测',date:'2026-10-06'},
 {id:'first',label:'本班第 1 次检测',value:-57.8,source:'本班历史检测',date:'2026-09-06'},
 {id:'cross',label:'跨区域联合检测',value:-70.1,source:'跨区域同卷',date:'2026-10-06'},
]
export const compactChoice:QuestionAnalysisPanelCompactProps={
 layout:'compact',
 verdict:{label:'需重新教',tone:'destructive',summary:'41 / 45 人答错，全班丢 123 分。多数人选了 A。'},
 keyMetrics:[{id:'mean',label:'平均分',value:'0.3',hint:'满分 3'},{id:'error',label:'错误率',value:'91.1%'},{id:'d',label:'区分度',value:'0.17',badge:'待改进'}],
 statistics:{mean:'0.3',sd:'0.9',d:'0.17',discrimination:'待改进',fullRate:'8.9%',zeroRate:'91.1%'},
 supplementaryMetrics:[{label:'证据强度',value:'充分'}],
 distribution:{kind:'options',title:'作答分布',aside:'未作答 0 人',options:[{id:'a',label:'A',count:41,emphasis:true},{id:'b',label:'B',count:0},{id:'c',label:'C',count:4,correct:true},{id:'d',label:'D',count:0}],legend:'绿色为正确选项'},
 comparisons:{title:'和别人比（得分率）',unit:'百分点',items:referenceItems},
 causes:{title:'错因',items:[{id:'concept',label:'概念理解错误',count:41}]},
 notes:{sections:[{id:'method',heading:'这些数字怎么来的',content:'有效 45 / 应有 45 人。错误率 = 1 − 得分率。区分度取全卷前后各 27% 的学生比较。'}]},
}
export const compactWritten:QuestionAnalysisPanelCompactProps={
 layout:'compact',verdict:{label:'课堂讲评',tone:'info',summary:'45 人都有失分，全班丢 154.5 分。主要是计算错误。'},
 keyMetrics:[{id:'mean',label:'平均分',value:'6.6',hint:'满分 10'},{id:'loss',label:'失分率',value:'34.3%'},{id:'d',label:'区分度',value:'0.47',badge:'良好'}],
 distribution:{kind:'segments',title:'得分分布',aside:'未作答 0 人',segments:[{id:'full',label:'满分',value:0,tone:'success'},{id:'partial',label:'部分',value:45,tone:'warning'},{id:'zero',label:'零分',value:0,tone:'destructive'}]},
 comparisons:{title:'和别人比（得分率）',unit:'百分点',items:referenceItems.map((item,index)=>({...item,value:index<2?0:-11.3}))},
 causes:{title:'错因',items:[{id:'calculation',label:'计算错误',count:29},{id:'steps',label:'步骤不完整',count:11},{id:'method',label:'方法选择错误',count:5}]},
 disclosures:[{id:'errors',label:'常见错误作答',meta:'4 组',content:<ul className="space-y-3 text-ui-body"><li>组 1 · 18 人：忽略分母非零条件。</li><li>组 2 · 11 人：未说明等价变形的适用范围。</li><li>组 3 · 10 人：长中文推导过程未保留参数取值范围与最终结论之间的完整逻辑联系，需结合公式核对 {reviewFormula}。</li><li>组 4 · 6 人：计算符号错误。</li></ul>}],
 notes:{sections:[{id:'coverage',heading:'统计范围',content:'有效 45 / 应有 45 人。参照来自相同评分标准；数据为演示。'}]},
}
export const compactMissing:QuestionAnalysisPanelCompactProps={
 layout:'compact',keyMetrics:[{id:'mean',label:'平均分',value:null},{id:'error',label:'错误率',value:null},{id:'d',label:'区分度',value:'0.17'}],
 distribution:{kind:'options',title:'作答分布',options:[{id:'a',label:'A',count:null},{id:'b',label:'B',count:0}]},
}
export function QuestionAnalysisCompactDemo(){return <div id="compact" className="space-y-8">
 <DemoSection title="compact · 选择题" description="首层呈现结论、三个关键数与小图；来源、日期和其他统计进入说明。示意数据。"><ReviewDemoThemes>{()=> <QuestionAnalysisPanel {...compactChoice}/>}</ReviewDemoThemes></DemoSection>
 <DemoSection title="compact · 解答题与长中文" description="得分分布、三种错因、默认收起的四组错误作答。展开后包含长中文与公式。"><ReviewDemoThemes>{()=> <QuestionAnalysisPanel {...compactWritten}/>}</ReviewDemoThemes></DemoSection>
 <DemoSection title="compact · 数据缺失" description="无结论、无参照、无说明；未知显示未提供，已知零人数保留。"><ReviewDemoThemes>{()=> <QuestionAnalysisPanel {...compactMissing}/>}</ReviewDemoThemes></DemoSection>
 </div>}
