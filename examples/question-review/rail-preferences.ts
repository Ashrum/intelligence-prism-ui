import { railBand, railCollapsedForWidth, PAPER_REVIEW_BEST_WIDTH, type RailPreferences } from '../../components/prism-next/review-workspace-layout.ts'
export { railBand, railCollapsedForWidth, PAPER_REVIEW_BEST_WIDTH, type RailPreferences }
export const railPreferenceKeys={best:'prism-question-review-rail-collapsed-best',compact:'prism-question-review-rail-collapsed-compact'}
export function readRailPreferences(){const result:RailPreferences={};for(const band of ['best','compact'] as const){try{const value=localStorage.getItem(railPreferenceKeys[band]);if(value==='true'||value==='false')result[band]=value==='true'}catch{/* Optional preference. */}}return result}
