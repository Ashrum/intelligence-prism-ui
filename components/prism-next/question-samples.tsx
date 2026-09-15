import { QuestionMath as M, QuestionFigure, type QuestionRecord } from "./question-content"

const root3 = <msqrt><mn>3</mn></msqrt>
const fraction = (a: string, b: string) => <mfrac><mn>{a}</mn><mn>{b}</mn></mfrac>
const fx = <mrow><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow>
const square = <msup><mi>x</mi><mn>2</mn></msup>
const fExpression = <mrow>{square}<mo>−</mo><mn>2</mn><mi>x</mi><mo>−</mo><mn>3</mn></mrow>
const blank = (number: string) => <span role="img" aria-label={`第${number}空，待填写`} className="mx-2 inline-flex min-w-24 items-end justify-center border-b border-foreground/65 px-4 align-baseline text-sm text-muted-foreground">（{number}）</span>

export const questionSamples: QuestionRecord[] = [
  {
    id: "Q-M-001", title: "二次根式的化简", kind: "单选题", points: 5,
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
    id: "Q-M-002", title: "二次函数的性质", kind: "多选题", points: 6,
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
    id: "Q-M-003", title: "扇形的弧长与面积", kind: "填空题", points: 6,
    stem: <><p>已知扇形的半径为 4 cm，圆心角为 <M label="三分之π弧度"><mfrac><mi>π</mi><mn>3</mn></mfrac></M>（弧度）。</p><p className="leading-[2.7]">该扇形的弧长为{blank("1")}cm，面积为{blank("2")}<M label="平方厘米"><msup><mtext>cm</mtext><mn>2</mn></msup></M>。</p></>,
    answer: <p>第（1）空：<M label="三分之四π"><mfrac><mrow><mn>4</mn><mi>π</mi></mrow><mn>3</mn></mfrac></M>；第（2）空：<M label="三分之八π"><mfrac><mrow><mn>8</mn><mi>π</mi></mrow><mn>3</mn></mfrac></M>。</p>,
    explanation: <><p>弧度制下，弧长等于半径乘圆心角，扇形面积等于半径平方与圆心角乘积的一半。</p><M block label="弧长等于四乘以三分之π，等于三分之四π厘米"><mi>l</mi><mo>=</mo><mi>r</mi><mi>θ</mi><mo>=</mo><mn>4</mn><mo>×</mo><mfrac><mi>π</mi><mn>3</mn></mfrac><mo>=</mo><mfrac><mrow><mn>4</mn><mi>π</mi></mrow><mn>3</mn></mfrac><mtext> </mtext><mtext>cm</mtext></M><M block label="面积等于二分之一乘十六乘三分之π，等于三分之八π平方厘米"><mi>S</mi><mo>=</mo>{fraction("1","2")}<msup><mi>r</mi><mn>2</mn></msup><mi>θ</mi><mo>=</mo><mfrac><mrow><mn>8</mn><mi>π</mi></mrow><mn>3</mn></mfrac><mtext> </mtext><msup><mtext>cm</mtext><mn>2</mn></msup></M></>,
  },
  {
    id: "Q-M-004", title: "动点与矩形面积", kind: "解答题", points: 12,
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
