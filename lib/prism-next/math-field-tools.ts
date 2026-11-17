export type MathFieldSubject = 'math' | 'physics' | 'chemistry'
export type MathFieldTool = { label: string; latex: string; face: string; keyboardSpan?: number }
export type MathFieldCommandKey = { label: string; face: string; command: 'deleteBackward' | 'moveToPreviousPlaceholder' | 'moveToNextPlaceholder' }
export type MathFieldKey = MathFieldTool | MathFieldCommandKey
const tool = (label: string, latex: string, face: string, keyboardSpan?: number): MathFieldTool => ({ label, latex, face, keyboardSpan })
export const mathFieldTemplates = [
  tool('分式', String.raw`\frac{#?}{#?}`, '▭/▭'), tool('根式', String.raw`\sqrt{#?}`, '√'),
  tool('上标', '^{#?}', 'x²'), tool('下标', '_{#?}', 'x₁'), tool('括号', String.raw`\left(#?\right)`, '( )'),
  tool('方程组', String.raw`\begin{cases}#?&#?\\#?&#?\end{cases}`, '{⋮'),
]
export const mathFieldRelations = [tool('小于等于', '\\le', '≤'), tool('大于等于', '\\ge', '≥'), tool('不等于', '\\ne', '≠'), tool('约等于', '\\approx', '≈'), tool('正负', '\\pm', '±'), tool('乘', '\\times', '×'), tool('除', '\\div', '÷')]
export const mathFieldGreek = [tool('阿尔法', '\\alpha', 'α'), tool('贝塔', '\\beta', 'β'), tool('西塔', '\\theta', 'θ'), tool('派', '\\pi', 'π'), tool('伽马', '\\gamma', 'γ'), tool('德尔塔', '\\Delta', 'Δ')]
export const mathFieldSubjectTools: Record<MathFieldSubject, MathFieldTool[]> = {
  math: [tool('属于', '\\in', '∈'), tool('不属于', '\\notin', '∉'), tool('子集', '\\subset', '⊂'), tool('并集', '\\cup', '∪'), tool('交集', '\\cap', '∩'), tool('实数集', '\\mathbb{R}', 'ℝ'), tool('绝对值', '\\left|#?\\right|', '|x|'), tool('n 次根', '\\sqrt[#?]{#?}', 'ⁿ√')],
  physics: [tool('矢量', '\\vec{#?}', 'x⃗'), tool('米每秒', '\\,\\mathrm{m/s}', 'm/s', 2), tool('牛顿', '\\,\\mathrm{N}', 'N'), tool('加速度单位', '\\,\\mathrm{m/s^2}', 'm/s²', 2)],
  chemistry: [tool('水', '\\ce{H2O}', 'H₂O', 2), tool('反应箭头', '\\rightarrow', '→'), tool('可逆反应', '\\rightleftharpoons', '⇌'), tool('化学方程式', '\\ce{2H2 + O2 -> 2H2O}', '2H₂+O₂→2H₂O', 4)],
}
export const mathFieldKeyboardCommands: MathFieldCommandKey[] = [
  { label: '退格', face: '⌫', command: 'deleteBackward' },
  { label: '上一个空格', face: '←', command: 'moveToPreviousPlaceholder' },
  { label: '下一个空格', face: '→', command: 'moveToNextPlaceholder' },
]
const digit = (value: string) => tool(`数字 ${value}`, value, value)
// SHEET 08: four calculator rows, seven keys each. Commands stay in-row.
export const mathFieldNumberKeys: MathFieldKey[] = [
  digit('7'), digit('8'), digit('9'), mathFieldRelations[6], mathFieldTemplates[0], mathFieldTemplates[2], mathFieldTemplates[1],
  digit('4'), digit('5'), digit('6'), mathFieldRelations[5], tool('左括号', '(', '('), tool('右括号', ')', ')'), mathFieldGreek[3],
  digit('1'), digit('2'), digit('3'), tool('减', '-', '−'), mathFieldRelations[0], mathFieldRelations[1], mathFieldKeyboardCommands[0],
  digit('0'), tool('小数点', '.', '.'), tool('字母 x', 'x', 'x'), tool('加', '+', '+'), tool('等于', '=', '='), mathFieldKeyboardCommands[1], mathFieldKeyboardCommands[2],
]
export const mathFieldShortcuts = {
  sqrt: '\\sqrt{#?}', pi: '\\pi', '<=': '\\le', '>=': '\\ge', '!=': '\\ne', '+-': '\\pm', '*': '\\times', alpha: '\\alpha',
}

export type FormulaTool = MathFieldTool & { aliases: readonly string[] }
const formula = (label: string, aliases: string[], latex: string, face: string): FormulaTool => ({ label, aliases, latex, face })
export const formulaQuickTools: readonly FormulaTool[] = [
  formula('分数', ['分式'], String.raw`\frac{#?}{#?}`, '▭/▭'),
  formula('根号', ['根式', '平方根'], String.raw`\sqrt{#?}`, '√'),
  formula('上标', ['平方'], '^{#?}', 'x²'), formula('下标', [], '_{#?}', 'x₁'),
  formula('括号', ['圆括号'], String.raw`\left(#?\right)`, '( )'),
  formula('小于等于', ['≤'], '\\le', '≤'), formula('不等于', ['≠'], '\\ne', '≠'),
  formula('正负', ['±'], '\\pm', '±'), formula('圆周率', ['希腊字母', 'π', 'pi', '派'], '\\pi', 'π'),
]
export const formulaTools: readonly FormulaTool[] = [
  ...formulaQuickTools,
  formula('绝对值', ['模'], String.raw`\left|#?\right|`, '|x|'),
  formula('方程组', ['联立方程'], String.raw`\begin{cases}#?&#?\\#?&#?\end{cases}`, '{⋮'),
  formula('分段函数', ['分段'], String.raw`\begin{cases}#?&#?\\#?&#?\end{cases}`, 'f(x)'),
  formula('对数', ['log'], String.raw`\log_{#?}{#?}`, 'log'),
  formula('正弦', ['三角函数', 'sin'], String.raw`\sin{#?}`, 'sin'),
  formula('余弦', ['三角函数', 'cos'], String.raw`\cos{#?}`, 'cos'),
  formula('正切', ['三角函数', 'tan'], String.raw`\tan{#?}`, 'tan'),
  formula('角', ['角度符号'], '\\angle', '∠'), formula('三角形', [], '\\triangle', '△'),
  formula('平行', [], '\\parallel', '∥'), formula('垂直', [], '\\perp', '⊥'),
  formula('属于', [], '\\in', '∈'), formula('空集', [], '\\emptyset', '∅'),
  formula('无穷', ['无限'], '\\infty', '∞'), formula('度', ['度数'], '^{\\circ}', '°'),
  formula('大于等于', ['≥'], '\\ge', '≥'), formula('乘', ['×', '乘号'], '\\times', '×'),
  formula('除', ['÷', '除号'], '\\div', '÷'),
  formula('阿尔法', ['希腊字母', 'α', 'alpha'], '\\alpha', 'α'),
  formula('贝塔', ['希腊字母', 'β', 'beta'], '\\beta', 'β'),
  formula('西塔', ['希腊字母', 'θ', 'theta'], '\\theta', 'θ'),
]
export const formulaCommonTools: readonly FormulaTool[] = [...formulaQuickTools, ...formulaTools.slice(9, 16)]
export function searchFormulaTools(query: string): readonly FormulaTool[] {
  const term = query.trim().toLocaleLowerCase()
  return term ? formulaTools.filter(item => [item.label, ...item.aliases].some(name => name.toLocaleLowerCase().includes(term))) : formulaCommonTools
}
