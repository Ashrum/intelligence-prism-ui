import { QuestionMath, type QuestionRecord } from "../question-content"

/** Author-written stress fixture: long Chinese, uncut display formula and multiple response models. */
export const questionPresentationSample: QuestionRecord = {
  id: "Q-PRESENTATION-001", title: "结合二次函数图像、代数运算与实际取值范围解释结论，并逐步核对各小问的适用条件", kind: "复合题", points: 12, difficulty: "综合",
  stem: <div className="space-y-3"><p>已知二次函数 f(x) = x² − 4x + 3。请保留定义域和等值变形中的全部条件，完成以下问题，并说明每个结论成立的依据。</p>
    <QuestionMath block label="f(x)等于x平方减4x加3，等于x减2的平方减1，等于x减1乘x减3">
      <mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>x</mi><mo>+</mo><mn>3</mn><mo>=</mo>
      <msup><mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>2</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>−</mo><mn>1</mn><mo>=</mo>
      <mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>1</mn><mo>)</mo><mo>(</mo><mi>x</mi><mo>−</mo><mn>3</mn><mo>)</mo></mrow>
    </QuestionMath></div>,
  parts: [
    { id: "1", response: "multiple", points: 4, content: <p>下列说法正确的是（可多选）。</p>, options: [{ id: "A", content: "图像开口向上" }, { id: "B", content: "对称轴为 x = 2" }, { id: "C", content: "最小值为 3" }], answer: "A、B", explanation: "二次项系数为正；配方可见对称轴为 x = 2，最小值为 −1。" },
    { id: "2", response: "fill", points: 4, content: <p>当 x = 2 时，f(x) = ______。</p>, answer: "−1", explanation: "代入计算得 4 − 8 + 3 = −1。" },
    { id: "3", response: "long", points: 4, content: <p>求 f(x) ≤ 0 的解集，并说明理由。</p>, answer: "1 ≤ x ≤ 3", explanation: "函数开口向上，两个零点为 1、3。" },
  ],
  answer: "（1）A、B；（2）−1；（3）1 ≤ x ≤ 3。", explanation: "分别从一般式、顶点式和因式分解式核对结论。",
}
