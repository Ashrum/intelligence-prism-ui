import type { QuestionMetadata } from "../question-metadata"
const define = (knowledge:string[], method:string, demand:string, family:string):QuestionMetadata => ({knowledge,method,demand,family,source:"自编演示题",version:"1.0"})
export const questionMetadata: Record<string,QuestionMetadata> = {
  "Q-M-001":define(["二次根式运算","分母有理化"],"同乘共轭式，运用平方差公式化简。","识别共轭结构，准确完成运算。","radical"),
  "Q-M-002":define(["二次函数图象","函数性质"],"配方为 (x − 1)² − 4，结合图象逐项核验。","建立解析式与图象的联系，判断单调性、值域与零点。","quadratic-properties"),
  "Q-M-003":define(["弧度制","扇形度量"],"运用 l = rθ 与 S = ½r²θ。","识别角度单位，区分弧长与面积公式。","sector"),
  "Q-M-004":define(["一次函数与坐标","二次函数最值"],"由直线建立面积函数，结合定义域求最值。","把几何约束转化为代数关系，解释最大值与端点取舍。","quadratic-model"),
  "Q-M-005":define(["二次函数性质","二次不等式"],"结合顶点、零点与开口方向核验判断。","区分最小值与函数值，由图象确定不等式解集。","quadratic-properties"),
  "Q-M-006":define(["二次函数建模","限定区间内的函数性质"],"待定系数法求式，再求值、解不等式及求最值。","把数据转化为模型，在限定时间范围内解释结果。","quadratic-model"),
}
