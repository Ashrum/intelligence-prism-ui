import { QuestionFigure } from "@/components/prism-next/fixtures/question-figure"
import type { DirectorySelections } from "@/components/prism-next/textbook-directory"
import { QuestionMath as M, type QuestionRecord } from "@/components/prism-next/question-content"

const root3 = <msqrt><mn>3</mn></msqrt>
const fraction = (a: string, b: string) => <mfrac><mn>{a}</mn><mn>{b}</mn></mfrac>
const fx = <mrow><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow>
const square = <msup><mi>x</mi><mn>2</mn></msup>
const fExpression = <mrow>{square}<mo>−</mo><mn>2</mn><mi>x</mi><mo>−</mo><mn>3</mn></mrow>
const blank = (number: string) => <span role="img" aria-label={`第${number}空，待填写`} className="mx-2 inline-flex min-w-24 items-end justify-center border-b border-foreground/65 px-4 align-baseline text-ui-hint text-muted-foreground">（{number}）</span>

export const questionSamples: (QuestionRecord & { initialLinks?: DirectorySelections })[] = [
  {
    id: "Q-M-001", title: "二次根式的化简", kind: "单选题", response: "single", points: 5,
    stem: <p>化简 <M label="根号三加一除以根号三减一"><mfrac><mrow>{root3}<mo>+</mo><mn>1</mn></mrow><mrow>{root3}<mo>−</mo><mn>1</mn></mrow></mfrac></M>，所得结果是（　　）。</p>,
    optionColumns: 4,
    options: [
      { id: "A", content: <M label="二加根号三"><mn>2</mn><mo>+</mo>{root3}</M> },
      { id: "B", content: <M label="二减根号三"><mn>2</mn><mo>−</mo>{root3}</M> },
      { id: "C", content: <M label="一加根号三"><mn>1</mn><mo>+</mo>{root3}</M> },
      { id: "D", content: <M label="根号三">{root3}</M> },
    ],
    answer: <p>A，即 <M label="二加根号三"><mn>2</mn><mo>+</mo>{root3}</M>。</p>,
    explanation: <><p>分子、分母同时乘以分母的共轭式。分母化为 2，分子展开后即可约分。</p><M block label="原式等于根号三加一的平方除以二，等于二加根号三"><mfrac><mrow>{root3}<mo>+</mo><mn>1</mn></mrow><mrow>{root3}<mo>−</mo><mn>1</mn></mrow></mfrac><mo>=</mo><mfrac><msup><mrow><mo>(</mo>{root3}<mo>+</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></msup><mn>2</mn></mfrac><mo>=</mo><mn>2</mn><mo>+</mo>{root3}</M></>,
  },
  {
    id: "Q-M-002", title: "二次函数的性质", kind: "多选题", response: "multiple", points: 6,
    stem: <p>已知函数 <M label="f从实数集映射到实数集"><mi>f</mi><mo>:</mo><mi>ℝ</mi><mo>→</mo><mi>ℝ</mi></M>，<M label="f(x)等于x平方减二x减三">{fx}<mo>=</mo>{fExpression}</M>，下列说法正确的有（　　）。</p>,
    optionColumns: 1,
    options: [
      { id: "A", content: <>函数在 <M label="负无穷到一，右端点包含"><mo>(</mo><mo>−</mo><mi>∞</mi><mo>,</mo><mn>1</mn><mo>]</mo></M> 上单调递减，且函数的值域为 <M label="负四到正无穷，左端点包含"><mo>[</mo><mo>−</mo><mn>4</mn><mo>,</mo><mo>+</mo><mi>∞</mi><mo>)</mo></M>。</> },
      { id: "B", content: <>对任意实数 <M label="x"><mi>x</mi></M>，都有 <M label="f(x)大于等于负三">{fx}<mo>≥</mo><mo>−</mo><mn>3</mn></M>。</> },
      { id: "C", content: <>图像关于直线 <M label="x等于一"><mi>x</mi><mo>=</mo><mn>1</mn></M> 对称，并且与 <M label="x轴"><mi>x</mi></M> 轴交于 <M label="负一逗号零"><mo>(</mo><mo>−</mo><mn>1</mn><mo>,</mo><mn>0</mn><mo>)</mo></M> 和 <M label="三逗号零"><mo>(</mo><mn>3</mn><mo>,</mo><mn>0</mn><mo>)</mo></M> 两点。</> },
      { id: "D", content: <>若 <M label="f(x)大于零">{fx}<mo>&gt;</mo><mn>0</mn></M>，则一定有 <M label="x大于三"><mi>x</mi><mo>&gt;</mo><mn>3</mn></M>。</> },
    ],
    answer: <p>A、C。</p>,
    explanation: <><p>配方得到：</p><M block label="f(x)等于x减一的平方减四">{fx}<mo>=</mo><msup><mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>−</mo><mn>4</mn></M><p>抛物线开口向上，顶点为（1，−4），对称轴为 x = 1。因此 A 正确；取 x = 1 时，f(x) = −4，B 错误。</p><p>因式分解得 f(x) = (x + 1)(x − 3)，零点为 −1 和 3，故 C 正确。f(x) &gt; 0 的解为 x &lt; −1 或 x &gt; 3，D 遗漏了前一部分。</p></>,
    initialLinks: { "math-1:course": ["math-1:course:c221"], "math-1:knowledge": ["math-1:knowledge:k221", "math-1:knowledge:k223"] },
  },
  {
    id: "Q-M-003", title: "扇形的弧长与面积", kind: "填空题", response: "fill", points: 6, answerFieldCount: 2,
    stem: <><p>已知扇形的半径为 4 cm，圆心角为 <M label="三分之π弧度"><mfrac><mi>π</mi><mn>3</mn></mfrac></M>（弧度）。</p><p className="py-2">该扇形的弧长为{blank("1")}cm，面积为{blank("2")}<M label="平方厘米"><msup><mtext>cm</mtext><mn>2</mn></msup></M>。</p></>,
    answer: <p>第（1）空：<M label="三分之四π"><mfrac><mrow><mn>4</mn><mi>π</mi></mrow><mn>3</mn></mfrac></M>；第（2）空：<M label="三分之八π"><mfrac><mrow><mn>8</mn><mi>π</mi></mrow><mn>3</mn></mfrac></M>。</p>,
    explanation: <><p>弧度制下，弧长等于半径乘圆心角，扇形面积等于半径平方与圆心角乘积的一半。</p><M block label="弧长等于四乘以三分之π，等于三分之四π厘米"><mi>l</mi><mo>=</mo><mi>r</mi><mi>θ</mi><mo>=</mo><mn>4</mn><mo>×</mo><mfrac><mi>π</mi><mn>3</mn></mfrac><mo>=</mo><mfrac><mrow><mn>4</mn><mi>π</mi></mrow><mn>3</mn></mfrac><mtext> </mtext><mtext>cm</mtext></M><M block label="面积等于二分之一乘十六乘三分之π，等于三分之八π平方厘米"><mi>S</mi><mo>=</mo>{fraction("1","2")}<msup><mi>r</mi><mn>2</mn></msup><mi>θ</mi><mo>=</mo><mfrac><mrow><mn>8</mn><mi>π</mi></mrow><mn>3</mn></mfrac><mtext> </mtext><msup><mtext>cm</mtext><mn>2</mn></msup></M></>,
  },
  {
    id: "Q-M-004", title: "动点与矩形面积", kind: "解答题", response: "long", points: 12,
    stem: <><p>在平面直角坐标系中，O 为原点，A(6, 0)，B(0, 4)。M 为线段 AB 上除端点外的动点，N、P 分别为 M 在 x、y 轴上的垂足，构成矩形 ONMP。</p><p>设 ON = x，且 0 &lt; x &lt; 6。根据上述条件，回答下列问题。</p></>,
    figure: <QuestionFigure />,
    parts: [
      { id: "1", content: "求直线 AB 的方程。" },
      { id: "2", content: "写出矩形面积 S 关于 x 的函数表达式，并求面积的最大值及此时 x 的值。" },
      { id: "3", content: <>当矩形面积不小于 <M label="三分之十六">{fraction("16","3")}</M> 时，求 x 的取值范围。</> },
    ],
    answer: <ol className="space-y-2"><li>（1）<M label="y等于负三分之二x加四"><mi>y</mi><mo>=</mo><mo>−</mo>{fraction("2","3")}<mi>x</mi><mo>+</mo><mn>4</mn></M>。</li><li>（2）<M label="S(x)等于负三分之二x平方加四x"><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mo>−</mo>{fraction("2","3")}{square}<mo>+</mo><mn>4</mn><mi>x</mi></M>，0 &lt; x &lt; 6；当 x = 3 时，最大面积为 6。</li><li>（3）x ∈ [2, 4]。</li></ol>,
    explanation: <div className="space-y-5"><section><h5 className="mb-2 font-medium">（1）由两点确定直线</h5><p>直线经过 A(6, 0)、B(0, 4)，斜率为 (0 − 4) / (6 − 0) = −2/3，纵截距为 4，所以 y = −2x/3 + 4。</p></section><section><h5 className="mb-2 font-medium">（2）用动点坐标表示面积</h5><p>矩形的宽为 x，高为 M 的纵坐标。将面积表达式配方：</p><M block label="S(x)等于x乘四减三分之二x，等于负三分之二乘x减三的平方加六"><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>x</mi><mo>(</mo><mn>4</mn><mo>−</mo>{fraction("2","3")}<mi>x</mi><mo>)</mo><mo>=</mo><mo>−</mo>{fraction("2","3")}<msup><mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>3</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>+</mo><mn>6</mn></M><p>平方项的系数为负，且 x = 3 在定义域内，因此最大面积为 6。</p></section><section><h5 className="mb-2 font-medium">（3）将面积条件转成不等式</h5><M block label="面积不小于三分之十六等价于x减二乘x减四小于等于零"><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>≥</mo>{fraction("16","3")}<mo>⇔</mo><mo>(</mo><mi>x</mi><mo>−</mo><mn>2</mn><mo>)</mo><mo>(</mo><mi>x</mi><mo>−</mo><mn>4</mn><mo>)</mo><mo>≤</mo><mn>0</mn></M><p>结合 0 &lt; x &lt; 6，得到 2 ≤ x ≤ 4。边界处面积恰好等于 16/3，因此两个端点都取到。</p></section></div>,
    initialLinks: { "math-1:course": ["math-1:course:c221", "math-1:course:c223"], "math-1:knowledge": ["math-1:knowledge:k223"] },
  },
]

export const additionalQuestionSamples: QuestionRecord[] = [
  {
    id: "Q-M-007", title: "集合的交集", kind: "单选题", response: "single", points: 5,
    stem: <p>已知集合 <M label="A等于所有满足负一小于等于x且x小于等于三的整数x构成的集合"><mi>A</mi><mo>=</mo><mo>{"{"}</mo><mi>x</mi><mo>∈</mo><mi>ℤ</mi><mo>|</mo><mo>−</mo><mn>1</mn><mo>≤</mo><mi>x</mi><mo>≤</mo><mn>3</mn><mo>{"}"}</mo></M>，<M label="B等于集合零、二、四"><mi>B</mi><mo>=</mo><mo>{"{"}</mo><mn>0</mn><mo>,</mo><mn>2</mn><mo>,</mo><mn>4</mn><mo>{"}"}</mo></M>，则 <M label="A与B的交集"><mi>A</mi><mo>∩</mo><mi>B</mi></M> 为（　　）。</p>,
    optionColumns: 2,
    options: [
      { id: "A", content: <M label="集合零、二"><mo>{"{"}</mo><mn>0</mn><mo>,</mo><mn>2</mn><mo>{"}"}</mo></M> },
      { id: "B", content: <M label="集合零、二、四"><mo>{"{"}</mo><mn>0</mn><mo>,</mo><mn>2</mn><mo>,</mo><mn>4</mn><mo>{"}"}</mo></M> },
      { id: "C", content: <M label="集合负一、一、三"><mo>{"{"}</mo><mo>−</mo><mn>1</mn><mo>,</mo><mn>1</mn><mo>,</mo><mn>3</mn><mo>{"}"}</mo></M> },
      { id: "D", content: <M label="空集"><mo>∅</mo></M> },
    ],
    answer: <p>A，即 <M label="集合零、二"><mo>{"{"}</mo><mn>0</mn><mo>,</mo><mn>2</mn><mo>{"}"}</mo></M>。</p>,
    explanation: <p>A 中的元素为 −1、0、1、2、3。交集取两个集合共有的元素，其中只有 0、2 同时属于 A 和 B；4 不属于 A。</p>,
  },
  {
    id: "Q-M-008", title: "一次掷骰子的事件概率", kind: "多选题", response: "multiple", points: 6,
    stem: <p>将一枚均匀的六面骰子掷一次，六个面分别标有 1 至 6，且每个点数出现的可能性相同。记事件 A 为“点数是偶数”，事件 B 为“点数大于 4”。下列说法正确的有（　　）。</p>,
    optionColumns: 2,
    options: [
      { id: "A", content: <M label="A的概率等于二分之一"><mi>P</mi><mo>(</mo><mi>A</mi><mo>)</mo><mo>=</mo>{fraction("1", "2")}</M> },
      { id: "B", content: <M label="B的概率等于三分之一"><mi>P</mi><mo>(</mo><mi>B</mi><mo>)</mo><mo>=</mo>{fraction("1", "3")}</M> },
      { id: "C", content: <M label="A与B同时发生的概率等于三分之一"><mi>P</mi><mo>(</mo><mi>A</mi><mo>∩</mo><mi>B</mi><mo>)</mo><mo>=</mo>{fraction("1", "3")}</M> },
      { id: "D", content: <M label="A与B至少一个发生的概率等于三分之二"><mi>P</mi><mo>(</mo><mi>A</mi><mo>∪</mo><mi>B</mi><mo>)</mo><mo>=</mo>{fraction("2", "3")}</M> },
    ],
    answer: <p>A、B、D。</p>,
    explanation: <><p>样本空间共有 6 个等可能结果。A = {"{2, 4, 6}"}，B = {"{5, 6}"}，所以 P(A) = 3/6 = 1/2，P(B) = 2/6 = 1/3。</p><p>两个事件同时发生时只有点数 6，故 P(A ∩ B) = 1/6，C 错误。至少一个事件发生的点数为 2、4、5、6，故 P(A ∪ B) = 4/6 = 2/3，D 正确。</p></>,
  },
  {
    id: "Q-M-009", title: "等差数列的项与前项和", kind: "填空题", response: "fill", points: 6, answerFieldCount: 2,
    stem: <><p>已知等差数列 <M label="数列a下标n"><mo>{"{"}</mo><msub><mi>a</mi><mi>n</mi></msub><mo>{"}"}</mo></M> 的首项 <M label="a一等于三"><msub><mi>a</mi><mn>1</mn></msub><mo>=</mo><mn>3</mn></M>，公差 <M label="d等于二"><mi>d</mi><mo>=</mo><mn>2</mn></M>。</p><p className="leading-[2.7]">第 8 项为{blank("1")}，前 8 项和为{blank("2")}。</p></>,
    answer: <p>第（1）空：17；第（2）空：80。</p>,
    explanation: <><p>由等差数列的通项公式和前 n 项和公式可得：</p><M block label="a八等于a一加七d，等于三加七乘二，等于十七"><msub><mi>a</mi><mn>8</mn></msub><mo>=</mo><msub><mi>a</mi><mn>1</mn></msub><mo>+</mo><mn>7</mn><mi>d</mi><mo>=</mo><mn>3</mn><mo>+</mo><mn>7</mn><mo>×</mo><mn>2</mn><mo>=</mo><mn>17</mn></M><M block label="前八项和等于八乘三加十七的和除以二，等于八十"><msub><mi>S</mi><mn>8</mn></msub><mo>=</mo><mfrac><mrow><mn>8</mn><mo>×</mo><mo>(</mo><mn>3</mn><mo>+</mo><mn>17</mn><mo>)</mo></mrow><mn>2</mn></mfrac><mo>=</mo><mn>80</mn></M></>,
  },
  {
    id: "Q-M-010", title: "正弦函数的周期与对称性", kind: "判断题", response: "boolean", points: 6,
    stem: <p>已知函数 <M label="f(x)等于sin二x，x为实数">{fx}<mo>=</mo><mi>sin</mi><mo>(</mo><mn>2</mn><mi>x</mi><mo>)</mo><mo>,</mo><mi>x</mi><mo>∈</mo><mi>ℝ</mi></M>。判断下列说法是否正确。</p>,
    parts: [
      { id: "1", response: "boolean", points: 2, content: <p>函数的最小正周期为 <M label="π"><mi>π</mi></M>。</p>, answer: "正确。", explanation: <p>最小正周期为 <M label="二π除以二等于π"><mfrac><mrow><mn>2</mn><mi>π</mi></mrow><mn>2</mn></mfrac><mo>=</mo><mi>π</mi></M>。</p> },
      { id: "2", response: "boolean", points: 2, content: <p>函数图像关于 y 轴对称。</p>, answer: "错误。", explanation: <p>f(−x) = −f(x)，函数为奇函数，图像关于原点对称；它不是偶函数，图像不关于 y 轴对称。</p> },
      { id: "3", response: "boolean", points: 2, content: <p>当 <M label="x等于四分之π"><mi>x</mi><mo>=</mo><mfrac><mi>π</mi><mn>4</mn></mfrac></M> 时，函数取得最大值 1。</p>, answer: "正确。", explanation: <p>此时 <M label="sin二x等于sin二分之π，等于一"><mi>sin</mi><mo>(</mo><mn>2</mn><mi>x</mi><mo>)</mo><mo>=</mo><mi>sin</mi><mo>(</mo><mfrac><mi>π</mi><mn>2</mn></mfrac><mo>)</mo><mo>=</mo><mn>1</mn></M>，达到正弦函数的最大值。</p> },
    ],
    answer: <p>① 正确　② 错误　③ 正确。</p>,
    explanation: <p>分别利用正弦函数的周期公式、奇偶性和取值范围判断。各小问判断正确得 2 分。</p>,
  },
  {
    id: "Q-M-011", title: "用换元法解指数方程", kind: "解答题", response: "long", points: 8,
    stem: <p>解方程 <M label="二的二x次方减五乘二的x次方加四等于零"><msup><mn>2</mn><mrow><mn>2</mn><mi>x</mi></mrow></msup><mo>−</mo><mn>5</mn><mo>·</mo><msup><mn>2</mn><mi>x</mi></msup><mo>+</mo><mn>4</mn><mo>=</mo><mn>0</mn></M>，其中 x 为实数，并写出求解过程。</p>,
    answer: <p>x = 0 或 x = 2。</p>,
    explanation: <><p>令 <M label="t等于二的x次方且t大于零"><mi>t</mi><mo>=</mo><msup><mn>2</mn><mi>x</mi></msup><mo>&gt;</mo><mn>0</mn></M>，原方程化为：</p><M block label="t平方减五t加四等于零，即t减一乘t减四等于零"><msup><mi>t</mi><mn>2</mn></msup><mo>−</mo><mn>5</mn><mi>t</mi><mo>+</mo><mn>4</mn><mo>=</mo><mn>0</mn><mo>⇔</mo><mo>(</mo><mi>t</mi><mo>−</mo><mn>1</mn><mo>)</mo><mo>(</mo><mi>t</mi><mo>−</mo><mn>4</mn><mo>)</mo><mo>=</mo><mn>0</mn></M><p>解得 t = 1 或 t = 4，均满足 t &gt; 0。分别代回得到 2ˣ = 1 或 2ˣ = 4，因此 x = 0 或 x = 2；代入原方程均成立。</p></>,
  },
  {
    id: "Q-M-012", title: "阅读调查中的统计与概率", kind: "复合题", points: 16,
    stem: <p>某班随机抽取 20 名学生，统计他们上个月完整阅读的课外书数量。调查数据如下，每名学生只计入一个组。</p>,
    blocks: [
      { id: "reading-data", content: <div className="overflow-x-auto"><table className="w-full max-w-lg border-collapse text-left tabular-nums"><caption className="mb-2 text-left text-ui-body text-muted-foreground">20 名学生的月阅读量（本题自编数据）</caption><tbody><tr className="border-y"><th scope="row" className="p-3 font-medium">阅读量 / 本</th><td className="p-3">0</td><td className="p-3">1</td><td className="p-3">2</td><td className="p-3">3</td><td className="p-3">4</td></tr><tr className="border-b"><th scope="row" className="p-3 font-medium">人数 / 人</th><td className="p-3">2</td><td className="p-3">4</td><td className="p-3">6</td><td className="p-3">6</td><td className="p-3">2</td></tr></tbody></table></div> },
    ],
    parts: [
      { id: "1", response: "single", points: 4, content: <p>这 20 名学生月阅读量的中位数为（　　）。</p>, options: [{ id: "A", content: "1 本" }, { id: "B", content: "2 本" }, { id: "C", content: "2.5 本" }, { id: "D", content: "3 本" }], answer: "B，即 2 本。", explanation: "将阅读量从小到大排列，第 7 至第 12 个数据均为 2。第 10 个与第 11 个数据均为 2，所以中位数为 2。", rubric: [{ id: "median", label: "选择 B", points: 4 }] },
      { id: "2", response: "fill", points: 4, content: <p>这 20 名学生月阅读量的平均数为{blank("1")}本。</p>, answer: "2.1 本。", explanation: <M label="平均数等于零乘二加一乘四加二乘六加三乘六加四乘二的和除以二十，等于二点一"><mtext>平均数</mtext><mo>=</mo><mfrac><mrow><mn>0</mn><mo>×</mo><mn>2</mn><mo>+</mo><mn>1</mn><mo>×</mo><mn>4</mn><mo>+</mo><mn>2</mn><mo>×</mo><mn>6</mn><mo>+</mo><mn>3</mn><mo>×</mo><mn>6</mn><mo>+</mo><mn>4</mn><mo>×</mo><mn>2</mn></mrow><mn>20</mn></mfrac><mo>=</mo><mn>2.1</mn></M>, rubric: [{ id: "mean", label: "平均数为 2.1 本", points: 4 }] },
      { id: "3", response: "long", points: 8, content: <p>从这 20 名学生中随机选取 2 人，每一对学生被选中的可能性相同。求至少有 1 人上个月阅读量不少于 3 本的概率，并说明计算过程。</p>, answer: <p><M label="九十五分之六十二">{fraction("62", "95")}</M>。</p>, explanation: <><p>阅读量不少于 3 本的有 8 人，其余 12 人的阅读量少于 3 本。将选取过程视为不放回地依次抽取 2 人，先计算“两人阅读量都少于 3 本”的概率，再取其对立事件：</p><M block label="所求概率等于一减二十分之十二乘十九分之十一，等于九十五分之六十二"><mi>P</mi><mo>=</mo><mn>1</mn><mo>−</mo>{fraction("12", "20")}<mo>×</mo>{fraction("11", "19")}<mo>=</mo>{fraction("62", "95")}</M></>, rubric: [{ id: "groups", label: "确定两类人数分别为 8 人、12 人", points: 2 }, { id: "complement", label: "选用两人都少于 3 本的对立事件", points: 2 }, { id: "without-replacement", label: "正确计算不放回抽取概率 12/20 × 11/19", points: 2 }, { id: "result", label: "得到所求概率 62/95", points: 2 }] },
    ],
    answer: <p>第 1 问 B；第 2 问 2.1 本；第 3 问 <M label="九十五分之六十二">{fraction("62", "95")}</M>。</p>,
    explanation: <p>同一张频数表分别用于求中位数、加权平均数与不放回抽样概率。第 3 问采用对立事件法，避免重复计算“至少 1 人”的情况。</p>,
  },
]
