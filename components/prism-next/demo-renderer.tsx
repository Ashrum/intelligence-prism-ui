"use client"

import { actionDemos } from "./demos/actions"
import { formDemos } from "./demos/forms"
import { contentDemos } from "./demos/content"
import { feedbackDemos } from "./demos/feedback"
import { navigationDemos } from "./demos/navigation"
import { overlayDemos } from "./demos/overlays"
import { SelectParticles, ComboboxParticles } from "./demos/selection-particles"
import { DatePickerDemo } from "./demos/date-particles"
import { SearchInputParticle, NumberRangeParticle } from "./demos/input-particles"
import { MaterialTableParticle } from "./demos/table-particle"
import { DialogParticles } from "./demos/dialog-particles"

import { TreeDirectoryDemo } from "./demos/tree-directory"
import { QuestionsDemo } from "./demos/questions"

export const demos:Record<string,React.ComponentType>={...actionDemos,...formDemos,...contentDemos,...feedbackDemos,...navigationDemos,...overlayDemos,'date-picker':DatePickerDemo,tree:TreeDirectoryDemo,question:QuestionsDemo}
const particles:Record<string,React.ComponentType>={select:SelectParticles,combobox:ComboboxParticles,'input-group':SearchInputParticle,'number-field':NumberRangeParticle,table:MaterialTableParticle,dialog:DialogParticles}
export function DemoRenderer({id}:{id:string}) { const Demo=demos[id];const Particles=particles[id];return Demo?<><Demo/>{Particles&&<Particles/>}</>:<p>未找到此组件。</p> }
