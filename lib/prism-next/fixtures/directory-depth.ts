import {createDirectory, type DirectoryBranch, type DirectoryKind} from "../textbook-directory.ts"

// Independent UI fixtures; do not change the textbooks used by question metadata.
export const directoryDepthExamples=Object.fromEntries([2,3,4,5].map(depth=>{
 const id=`depth-${depth}`
 function branches(kind:DirectoryKind):DirectoryBranch[]{
  return [
   {id:"functions",titles:kind==="course"?["函数与图像","函数的表示","图像表示专题","分段函数图像"]:["函数","表示方法","图像法","分段函数"],leaves:kind==="course"?["绘制函数图像","分析图像变化"]:["图像描点","区间与端点"]},
   {id:"geometry",titles:kind==="course"?["空间几何","位置关系","平行关系专题","线面平行"]:["立体几何","位置关系","平行关系","线面关系"],leaves:kind==="course"?["识别空间关系","说明判断依据"]:["判定条件","性质应用"]},
  ].map(group=>{
   let children:DirectoryBranch[]=group.leaves.map((title,index)=>({id:`${group.id}-leaf-${index}`,title}))
   for(let level=depth-2;level>=0;level--)children=[{id:`${group.id}-level-${level}`,title:group.titles[level],children}]
   return children[0]
  })
 }
 return [String(depth),[{id,title:`${depth} 级目录 · 独立演示`,directories:{course:createDirectory(`${id}:course`,branches("course")),knowledge:createDirectory(`${id}:knowledge`,branches("knowledge"))}}]]
}))
