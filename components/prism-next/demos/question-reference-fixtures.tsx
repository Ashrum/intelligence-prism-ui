import type { QuestionRecord } from "../question-content"

/** Explicit reference fixtures. Their content is separate from queue/metric/distribution records. */
export const axisQuestion: QuestionRecord = {
  id: "p04-question-2", title: "二次函数的配方与对称轴", kind: "解答题", points: 5,
  stem: <p>已知 y = x² − 2x + 3，求对称轴。</p>,
}
export const completingSquareQuestion: QuestionRecord = {
  id: "question-4", title: "配方与顶点坐标", kind: "解答题", points: 2,
  stem: <p>将 x² − 4x + 1 配方，并写出顶点坐标。</p>,
}
export const distributionQuestions: QuestionRecord[] = [
  { id: "q1", title: "函数识别", kind: "解答题", points: 5, stem: <p>判断 y = x² − 2x + 3 是否为二次函数，并说明理由。</p> },
  { id: "q2", title: "图像平移", kind: "解答题", points: 5, stem: <p>函数 y = x² 的图像向右平移 2 个单位后，对应的解析式是什么？</p> },
  { id: "q3", title: "最值", kind: "解答题", points: 5, stem: <p>求函数 y = x² − 4x + 3 的最小值及对应的 x 值。</p> },
  { id: "q4", title: "结合实际情境解释二次函数对称轴与最值的关系", kind: "解答题", points: 5, stem: <p>某情境中的数量关系为 y = −x² + 4x + 1，且 0 ≤ x ≤ 4。求最大值，并结合对称轴说明理由。</p> },
]
