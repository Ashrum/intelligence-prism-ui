import type { DirectorySelections } from "@/components/prism-next/textbook-directory"
import { QuestionMath as M, type QuestionRecord } from "@/components/prism-next/question-content"

export const judgmentQuestion: QuestionRecord & { initialLinks?: DirectorySelections } = {
  id: "Q-M-005", title: "二次函数的三个判断", kind: "判断题", response: "boolean", points: 6,
  stem: <p>已知函数 <M label="f(x)等于x平方减4x加3"><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>x</mi><mo>+</mo><mn>3</mn></M>，定义域为实数集。判断下列说法是否正确。</p>,
  parts: [
    {id:"1",response:"boolean",points:2,content:<p>函数图像的对称轴为直线 x = 2。</p>,answer:"正确。",explanation:"f(x) = (x − 2)² − 1，对称轴为 x = 2。"},
    {id:"2",response:"boolean",points:2,content:<p>因为 f(0) = 3，所以函数的最小值为 3。</p>,answer:"错误。",explanation:"函数在 x = 2 时取得最小值 −1；f(0) 只是一个函数值。"},
    {id:"3",response:"boolean",points:2,content:<p>不等式 f(x) &lt; 0 的解集为 1 &lt; x &lt; 3。</p>,answer:"正确。",explanation:"f(x) = (x − 1)(x − 3)，开口向上，两根之间函数值为负。"},
  ],
  answer:<p>① 正确　② 错误　③ 正确</p>, explanation:<p>各小题独立判分，判断正确得 2 分，错误或未作答得 0 分。</p>,
}

export const compositeQuestion: QuestionRecord & { initialLinks?: DirectorySelections } = {
  id:"Q-M-006",title:"注水过程中的水量变化",kind:"复合题",points:16,
  stem:<p>某水箱开始时存有 20 L 水。随后 6 min 内，水量 V(t) 按二次函数模型描述；t 的单位为 min，V 的单位为 L，且 0 ≤ t ≤ 6。本题按此模型计算。</p>,
  blocks:[
    {id:"data",content:<div className="overflow-x-auto"><table className="w-full max-w-lg border-collapse text-left tabular-nums"><caption className="mb-2 text-left text-ui-hint text-muted-foreground">本题设定的示例数据，用于数学建模与界面演示。</caption><tbody><tr className="border-y"><th className="p-3 font-medium" scope="row">时间 t / min</th><td className="p-3">0</td><td className="p-3">2</td><td className="p-3">4</td></tr><tr className="border-b"><th className="p-3 font-medium" scope="row">水量 V / L</th><td className="p-3">20</td><td className="p-3">40</td><td className="p-3">52</td></tr></tbody></table></div>},
    {id:"instruction",content:<p>请根据同一组材料完成以下三个小问。注意区分水箱中的总水量与新增水量。</p>},
  ],
  parts:[
    {id:"1",response:"single",points:4,content:<p>符合表中数据的函数关系式是（　）。</p>,options:[{id:"A",content:"V(t) = −t² + 12t + 20"},{id:"B",content:"V(t) = −t² + 10t + 20"},{id:"C",content:"V(t) = t² + 8t + 20"},{id:"D",content:"V(t) = −t² + 12t"}],answer:"A。",explanation:"设 V(t) = at² + bt + c。由 t = 0 得 c = 20；其余数据给出 4a + 2b = 20、16a + 4b = 32，解得 a = −1、b = 12。",rubric:[{id:"choice",label:"选择 A",points:4}]},
    {id:"2",response:"fill",points:4,content:<p>开始注水 3 min 后，水箱中共有 <span role="img" aria-label="第1空，待填写" className="mx-2 inline-block w-16 border-b border-current"/> L 水。</p>,answer:"47 L。固定单位为 L，数值 47 与 47.0 等价。",explanation:"V(3) = −9 + 36 + 20 = 47。27 L 为新增水量，不是本空所求的总水量。",rubric:[{id:"fill",label:"总水量为 47 L",points:4}]},
    {id:"3",response:"long",points:8,content:<div><p>① 求水箱中水量不少于 52 L 的时间范围。</p><p>② 求这 6 min 内的最大水量及对应时刻，并说明理由。</p></div>,answer:<p>① 4 ≤ t ≤ 6；② t = 6 min 时，最大水量为 56 L。</p>,explanation:<div><p>−t² + 12t + 20 ≥ 52，整理得 (t − 4)(t − 8) ≤ 0，解得 4 ≤ t ≤ 8。与题设 0 ≤ t ≤ 6 取交集，得到 4 ≤ t ≤ 6。</p><M block label="V(t)等于56减去t减6的平方"><mi>V</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mn>56</mn><mo>−</mo><msup><mrow><mo>(</mo><mi>t</mi><mo>−</mo><mn>6</mn><mo>)</mo></mrow><mn>2</mn></msup></M><p>因此在 t = 6 时取最大值 56。也可利用抛物线在区间 [0, 6] 上单调递增求得最大值。各评分点独立，不将定义域错误重复扣到最大值部分。</p></div>,rubric:[{id:"inequality",label:"建立水量不等式",points:2},{id:"solve",label:"解得 4 ≤ t ≤ 8",points:2},{id:"domain",label:"结合定义域得 4 ≤ t ≤ 6",points:2},{id:"maximum",label:"最大水量、时刻与理由均正确",points:2}]},
  ],
  answer:<p>第 1 问 A；第 2 问 47 L；第 3 问 4 ≤ t ≤ 6，最大水量为 56 L。</p>,
  explanation:<p>共享材料只呈现一次，小问分别保留作答类型、答案与评分依据。整题默认 16 分，选用时保留全部小问。</p>,
}
