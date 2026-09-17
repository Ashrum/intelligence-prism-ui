import test from 'node:test'
import assert from 'node:assert/strict'
import {heatmapColors,themePalette} from '../lib/prism-next/config.ts'
import {heatmapFill,heatmapLabelColor,colorLuminance} from '../lib/prism-next/chart-options.ts'

test('every heatmap theme is perceptually sequential and labels remain readable throughout its ramp',()=>{
 for(const [theme,stops] of Object.entries(heatmapColors)){
  let previous=colorLuminance(stops[0])
  for(let value=0;value<=100;value++){
   const fill=heatmapFill(value,0,100,stops),brightness=colorLuminance(fill)
   assert.ok(theme==='dark'?brightness>=previous:brightness<=previous,`${theme}: ${value} reverses the ramp`)
   const labelBrightness=colorLuminance(heatmapLabelColor(fill))
   assert.ok((Math.max(brightness,labelBrightness)+.05)/(Math.min(brightness,labelBrightness)+.05)>=4.5,`${theme}: label at ${value}`)
   previous=brightness
  }
  assert.notEqual(stops[0],themePalette[theme].secondary,`${theme}: missing must differ from minimum`)
 }
})
