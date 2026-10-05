import type { StudentControlItem } from '../components/prism-next/student-control-bar'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type Expect<T extends true> = T
export type ScoreIsNullableNumber = Expect<Equal<StudentControlItem['score'], number | null>>
export type RatioIsNullableNumber = Expect<Equal<StudentControlItem['ratio'], number | null>>
export const ungraded: Pick<StudentControlItem, 'score' | 'ratio'> = { score: null, ratio: null }
export const graded: Pick<StudentControlItem, 'score' | 'ratio'> = { score: 0, ratio: 0 }
