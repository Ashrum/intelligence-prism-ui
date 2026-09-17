import type { QuestionMetadata } from "../question-metadata"
const define = (knowledge:string[], method:string, demand:string, family:string):QuestionMetadata => ({knowledge,method,demand,family,source:"自编演示题",version:"1.0"})
export const questionMetadata: Record<string,QuestionMetadata> = {
  "Q-M-001":define(["二次根式运算","分母有理化"],"同乘共轭式，运用平方差公式化简。","识别共轭结构，准确完成运算。","radical"),
  "Q-M-002":define(["二次函数图象","函数性质"],"配方为 (x − 1)² − 4，结合图象逐项核验。","建立解析式与图象的联系，判断单调性、值域与零点。","quadratic-properties"),
  "Q-M-003":define(["弧度制","扇形度量"],"运用 l = rθ 与 S = ½r²θ。","识别角度单位，区分弧长与面积公式。","sector"),
  "Q-M-004":define(["一次函数与坐标","二次函数最值"],"由直线建立面积函数，结合定义域求最值。","把几何约束转化为代数关系，解释最大值与端点取舍。","quadratic-model"),
  "Q-M-005":define(["二次函数性质","二次不等式"],"结合顶点、零点与开口方向核验判断。","区分最小值与函数值，由图象确定不等式解集。","quadratic-properties"),
  "Q-M-006":define(["二次函数建模","限定区间内的函数性质"],"待定系数法求式，再求值、解不等式及求最值。","把数据转化为模型，在限定时间范围内解释结果。","quadratic-model"),
  "Q-M-007":define(["集合的表示","交集运算"],"先列出整数集 A 的元素，再保留与 B 共有的元素。","识别整数约束，准确区分交集与并集。","set-operations"),
  "Q-M-008":define(["古典概型","事件的交与并"],"列举 6 个等可能结果，分别统计事件及其交、并所含结果数。","区分同时发生与至少一个发生，避免重复计数。","classical-probability"),
  "Q-M-009":define(["等差数列通项","等差数列前项和"],"用 aₙ = a₁ + (n − 1)d 求第 8 项，再用首末项求和。","准确对应项数与公差累加次数，区分项的值与前项和。","arithmetic-sequence"),
  "Q-M-010":define(["正弦函数周期","奇偶性与最值"],"由角频率求周期，利用 f(−x) 判断奇偶性，再代入特殊角。","分别核验周期、对称性与最大值，避免混淆原点对称和轴对称。","trigonometric-properties"),
  "Q-M-011":define(["指数方程","换元法"],"令 t = 2ˣ > 0，将方程化为一元二次方程，再代回求 x。","保持换元前后的等价关系，检查换元变量的取值限制。","exponential-equation"),
  "Q-M-012":define(["频数表","中位数与平均数","不放回抽样"],"按累计频数求中位数，按频数加权求平均数，再用对立事件求概率。","从同一材料提取不同统计信息，正确处理不放回抽取的条件变化。","statistics-probability"),
}
