"use client"

import { createContext, useContext, useReducer, useState, type ReactNode, type Dispatch, type SetStateAction } from "react"
import { createLearningState, learningReducer, type LearningState, type LearningAction } from "@/lib/prism-next/learning-workflow"
import { createReviewEditor, type ReviewEditor } from "@/lib/prism-next/fixtures/review"

const LearningContext = createContext<{ state: LearningState; dispatch: Dispatch<LearningAction>; editor: ReviewEditor; setEditor: Dispatch<SetStateAction<ReviewEditor>> } | null>(null)
export function LearningProvider({ children, initialState }: { children: ReactNode; initialState?: LearningState }) {
  const [state, dispatch] = useReducer(learningReducer, initialState, value => value ?? createLearningState())
  const [editor, setEditor] = useState(() => {
    const review = initialState?.reviews.at(-1)
    return review ? { ...createReviewEditor(), scores: { ...review.scores }, saved: { ...review.scores }, record: review.reason } : createReviewEditor()
  })
  return <LearningContext.Provider value={{ state, dispatch, editor, setEditor }}>{children}</LearningContext.Provider>
}
export function useLearning() {
  const value = useContext(LearningContext)
  if (!value) throw new Error("LearningProvider is required")
  return value
}
