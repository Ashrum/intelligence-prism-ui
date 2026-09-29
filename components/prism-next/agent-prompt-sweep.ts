import { accentChain, ACCENTS, createShader, playSweep } from "glimm"

/** Beautiful UI Prompt Bar sweep; MIT, Copyright (c) 2026 Shane Levine.
 * Full notice: docs/third-party/beautifului-LICENSE.txt. No task-state callbacks.
 */
const palette = accentChain([ACCENTS.red, ACCENTS.orange, ACCENTS.yellow, ACCENTS.green, ACCENTS.cyan, ACCENTS.blue, ACCENTS.purple])
export function createPromptSweep(canvas: HTMLCanvasElement, media: MediaQueryList,
  engine = { createShader, playSweep }) {
  let dispose: (() => void) | undefined
  let disposed = false
  const stop = () => { const cleanup = dispose; dispose = undefined; cleanup?.() }
  const motionChanged = () => { if (media.matches) stop() }
  media.addEventListener("change", motionChanged)
  return {
    play() {
      if (disposed || media.matches || dispose) return
      let shader: ReturnType<typeof createShader> = null
      try {
        shader = engine.createShader({ canvas, palette, direction: "ltr", bandTight: 10, swellAmount: .85 })
        if (!shader) return
        const current = shader
        const sweep = engine.playSweep(current, { palette, direction: "ltr", sweepMs: 570, outroMs: 80, peakAlpha: 1.3, bandTight: 10, brightness: 1.4, swellAmount: 1, waveSpeed: 1.8, easing: "easeOutExpo" })
        const cleanup = () => { sweep.cancel(); current.setAlpha(0); current.destroy() }
        dispose = cleanup
        void sweep.done.then(() => { if (dispose === cleanup) stop() }, () => { if (dispose === cleanup) stop() })
      } catch { shader?.destroy() /* WebGL unavailable: input and intents remain usable. */ }
    },
    destroy() { disposed = true; stop(); media.removeEventListener("change", motionChanged) },
  }
}
