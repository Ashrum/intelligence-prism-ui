import type { MathfieldElement } from 'mathlive'
import temmlModuleUrl from 'temml/dist/temml.mjs?url'
import { previewFormula } from './draft-math.ts'

export type MathFieldRuntime = typeof import('mathlive') & { sourceIsValid: (source: string) => boolean }
let pending: Promise<MathFieldRuntime> | undefined

/** Called only after the user opens a formula field. Never run during SSR. */
export function loadMathFieldRuntime(): Promise<MathFieldRuntime> {
  return pending ??= Promise.all([import('mathlive'), import(/* @vite-ignore */ temmlModuleUrl) as Promise<typeof import('temml')>]).then(([runtime, temml]) => {
    return { ...runtime, sourceIsValid: (source: string) => !source.trim() || previewFormula(source, temml.default.renderToString)[0].kind === 'math' }
  }).catch(error => { pending = undefined; throw error })
}

export function configureMathFieldRuntime(element: typeof MathfieldElement) {
  element.fontsDirectory = '/mathlive/fonts'
  element.soundsDirectory = null
  element.keypressVibration = false
  element.computeEngine = null
  element.locale = 'zh-cn'
  element.textToSpeechRules = 'mathlive'
  element.speechEngine = 'local'
  element.speakHook = () => {}
  element.readAloudHook = () => {}
}
