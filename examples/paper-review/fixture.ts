// SVG is the scanned document artwork, not UI typography. Its palette reuses
// the light paper's existing Prism semantic values from theme.css.
export type Question = {
  id: string; number: number; page: number; type: string; score: number; max: number
  prompt: string; answer: string[]; points: { label: string; score: number; max: number; reason?: string }[]
  knowledge: string; evidence: string; rate: number; affected: number; rect: [number, number, number, number]
}
const shortPrompts = [
  '集合 A = {1, 2, 3}，B = {2, 4}，求 A ∩ B。', '已知 f(x) = x² − 2x，求 f(3)。',
  '求函数 y = √(x − 1) 的定义域。', '若 sin α = 3/5，且 α 为锐角，求 cos α。',
  '等差数列首项为 2，公差为 3，求第 5 项。', '求直线 y = 2x + 1 的斜率。',
  '若向量 a = (1, 2)，b = (2, 1)，求 a · b。', '求函数 f(x) = x² 在实数集上的单调区间。',
  '若 log₂ x = 3，求 x。', '求抛物线 y² = 4x 的焦点坐标。',
  '求等比数列 1, 2, 4, … 的前 4 项和。', '求点 (1, 2) 到直线 x = 4 的距离。',
  '求不等式 x² − 3x + 2 ＜ 0 的解集。', '求函数 y = 1/(x − 2) 的定义域。',
  '若随机事件 A 的概率为 0.3，求其对立事件的概率。', '计算：sin² 30° + cos² 30°。',
]
const answers = ['{2}', '3', '[1, +∞)', '4/5', '14', '2', '4', '在 R 上递增', '8', '(1, 0)', '15', '3', '(1, 2)', 'R', '0.7', '1']
export const questions: Question[] = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1, max = n <= 12 ? 5 : n <= 16 ? 6 : n <= 18 ? 12 : n === 19 ? 18 : 24
  const score = n === 8 || n === 14 ? 0 : n === 17 ? 6 : n === 19 ? 3 : max
  return { id: `q${n}`, number: n, page: n <= 16 ? 0 : 1, type: n <= 12 ? '选择' : n <= 16 ? '填空' : '解答', max, score,
    prompt: shortPrompts[i] ?? '', answer: [answers[i] ?? ''],
    points: [{ label: '结果与条件', score, max, ...(score === 0 ? { reason: n === 8 ? '未区分零点两侧的单调区间。' : '未排除使分母为零的 x = 2。' } : {}) }],
    knowledge: n === 8 ? '函数单调性' : n === 14 ? '函数定义域' : '基础运算与条件判断',
    evidence: score === 0 ? '作答未处理题目中的必要限制条件，结论与条件不一致。' : '作答结果与条件一致，关键步骤完整。',
    rate: score === 0 ? 61 : 86, affected: score === 0 ? 14 : 5,
    rect: n <= 16 ? [5 + Math.floor(i / 8) * 47, 17 + (i % 8) * 9.4, 43, 8.8] : [5, 17 + (n - 17) * 19, 90, 17.5],
  }
})
Object.assign(questions[16], {
  prompt: '已知椭圆 C 过点 P，求椭圆的离心率与焦点坐标。',
  answer: ['解：由题设可得 e = c/a = √3 / 2。', '故椭圆的离心率为 √3 / 2。', '取 c = 1，焦点为 F₁(−1, 0)，F₂(1, 0)。'],
  points: [{ label: '离心率', score: 6, max: 6 }, { label: '焦点坐标', score: 0, max: 6, reason: '缺少 a² = b² + c² 与点 P 条件的联立过程。' }],
  knowledge: '椭圆焦距关系', evidence: '离心率推导成立。焦点坐标直接取 c = 1，未使用 a² = b² + c² 与点 P 的条件联立求解，评分点 2 缺失。', rate: 47, affected: 30,
})
Object.assign(questions[17], { prompt: '在四面体 A–BCD 中，证明直线 AB 与平面 ACD 垂直。', answer: ['证明：AB ⊥ AC，AB ⊥ AD，', '且 AC ∩ AD = A，', '所以 AB ⊥ 平面 ACD。'], knowledge: '直线与平面垂直', points: [{ label: '线线垂直', score: 6, max: 6 }, { label: '判定定理', score: 6, max: 6 }] })
Object.assign(questions[18], { prompt: '从 10 个球中不放回抽取两次，求事件 A 发生的概率。', answer: ['解：P(A) = 1 − 3/10 = 7/10。', '所以所求概率为 7/10。'], knowledge: '条件概率', points: [{ label: '事件识别', score: 3, max: 3 }, { label: '条件概率计算', score: 0, max: 15, reason: '未考虑第一次抽取后剩余球的数量变化。' }], evidence: '已识别对立事件，但第二次抽取的条件概率未随第一次结果更新。', rate: 38, affected: 27 })
Object.assign(questions[19], { prompt: '已知 f(x) = x³ − 3x，求函数的极值并讨论零点个数。', answer: ['解：f′(x) = 3x² − 3 = 3(x − 1)(x + 1)。', 'x = −1 时取极大值 2；x = 1 时取极小值 −2。', '由 f(x) = x(x² − 3) 得三个零点：−√3，0，√3。'], knowledge: '导数与函数极值', points: [{ label: '求导与极值', score: 12, max: 12 }, { label: '零点讨论', score: 12, max: 12 }] })

export const students = ['张雨桐', '李思远', '陈语安', '周子墨', '林书宁', '王予辰']
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
export function paperImage(page: number, student: string, annotations: boolean) {
  const ink = '#1F2328', blue = '#1769AA', red = '#B4233D', green = '#216440', white = '#FFFFFF'
  const text = (x: number, y: number, content: string, size = 16, color = ink, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escape(content)}</text>`
  const content = questions.filter(q => q.page === page).map(q => {
    const y = q.rect[1] * 11.23, compact = page === 0
    const left = q.rect[0] * 7.94
    const promptLines = compact ? (`${q.number}. ${q.prompt}`.match(/.{1,22}/gu) ?? []) : [`${q.number}. ${q.prompt}`]
    const prompt = promptLines.map((line, i) => text(left + 12, y + 20 + i * 21, line, compact ? 15 : 17)).join('')
    const writing = q.answer.map((line, i) => text(compact ? left + 22 : 72, y + (compact ? 76 : 66) + i * 33, line, compact ? 16 : 19, blue, 'font-family="KaiTi, STKaiti, serif" font-style="italic"')).join('')
    const correct = q.score === q.max
    const mark = annotations ? text(compact ? left + q.rect[2] * 7.94 - 12 : 705, y + (compact ? 76 : 70), `${correct ? '✓' : '×'} ${q.score}/${q.max}`, compact ? 16 : 20, correct ? green : red, 'text-anchor="end"') + (!compact && !correct ? text(72, y + 165, q.number === 17 ? '焦距关系未联立，焦点坐标缺少依据。' : '第二次抽取条件发生变化，需重新计算。', 15, red) : '') : ''
    return prompt + writing + mark
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123"><rect width="794" height="1123" fill="${white}"/><g font-family="Songti SC, STSong, serif">${text(397, 63, '高一数学期中测试', 30, ink, 'text-anchor="middle"')}${text(397, 95, '2026—2027 学年度 · 第一学期', 16, ink, 'text-anchor="middle"')}${text(52, 132, `姓名：${student}　　班级：高一（3）班　　满分：150 分`, 16)}<path d="M52 147 H742" stroke="${ink}" stroke-width="1"/>${content}${text(397, 1090, `第 ${page + 1} 页 / 共 2 页`, 15, ink, 'text-anchor="middle"')}</g></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
