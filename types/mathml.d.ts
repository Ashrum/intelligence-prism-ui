import type { HTMLAttributes } from "react"

type MathAttributes = HTMLAttributes<MathMLElement> & { display?: "block" | "inline" }
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: MathAttributes
      mrow: MathAttributes
      mi: MathAttributes
      mn: MathAttributes
      mo: MathAttributes
      msub: MathAttributes
      msup: MathAttributes
      mfrac: MathAttributes
      msqrt: MathAttributes
      mtext: MathAttributes
    }
  }
}
