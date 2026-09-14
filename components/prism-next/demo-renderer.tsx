"use client"

import { actionDemos } from "./demos/actions"
import { formDemos } from "./demos/forms"
import { contentDemos } from "./demos/content"
import { feedbackDemos } from "./demos/feedback"
import { navigationDemos } from "./demos/navigation"
import { overlayDemos } from "./demos/overlays"

export const demos:Record<string,React.ComponentType>={...actionDemos,...formDemos,...contentDemos,...feedbackDemos,...navigationDemos,...overlayDemos}
export function DemoRenderer({id}:{id:string}) { const Demo=demos[id];return Demo?<Demo/>:<p>未找到此组件。</p> }
