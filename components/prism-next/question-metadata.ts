export type QuestionMetadata = {
  knowledge: string[]
  method: string
  demand: string
  family: string
  source: string
  version: string
  note?: string
}
export function relatedReason(a:QuestionMetadata,b:QuestionMetadata) {
  if(a.family===b.family) return a.family==="quadratic-model"?"同样考查受约束的二次函数最值；情境与作答形式不同。":"核心知识点与方法相同，题型或设问可能不同。"
  if(a.family.startsWith("quadratic")&&b.family.startsWith("quadratic")) return "知识点相关：共享二次函数图象、顶点与最值方法，建模要求不同。"
  return null
}
