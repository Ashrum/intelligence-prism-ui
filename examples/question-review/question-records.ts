import { createElement as h, Fragment, type ReactNode } from 'react'
import mathMarkup from './question-math.json' with { type: 'json' }
import type { QuestionRecord } from '../../components/prism-next/question-content'

// Trusted, fixed mathematical content, pre-rendered with pinned temml 0.13.4.
// Keep parsing out of the Worker/browser runtime; tests verify every MathML entry.
// No student input, scan text or execution state enters this path.
function fixedMath(source:string):string {
 const markup=mathMarkup[source as keyof typeof mathMarkup]
 if(!markup)throw new Error(`Missing fixed review MathML: ${source}`)
 return markup
}
export function reviewText(source:string):ReactNode {
 return h(Fragment,null,...source.split(/(\$[^$]+\$)/g).filter(Boolean).map((part,i)=>part.startsWith('$')
  ? h('span',{key:i,className:'inline-block max-w-full overflow-x-auto align-middle',dangerouslySetInnerHTML:{__html:fixedMath(part.slice(1,-1))}})
  : h(Fragment,{key:i},part)))
}
const p=(text:string)=>h('p',null,reviewText(text))
const seeds: {title:string;stem:string;answer:string;explanation:string;options?:string[];parts?:string[]}[] = [
 {title:'充分必要条件',stem:'设 $x\\in\\mathbb R$，命题 $p:x>1$，命题 $q:x>0$。则 $p$ 是 $q$ 的什么条件？',options:['充分不必要条件','必要不充分条件','充要条件','既不充分也不必要条件'],answer:'A：充分不必要条件。',explanation:'由 $x>1$ 可得 $x>0$，但 $x>0$ 不能推出 $x>1$，例如 $x=\\frac12$。'},
 {title:'命题的推出关系',stem:'设 $x\\in\\mathbb R$，命题 $p:x>2$，命题 $q:x>1$。则 $p$ 是 $q$ 的什么条件？',options:['充分不必要条件','必要不充分条件','充要条件','既不充分也不必要条件'],answer:'A。',explanation:'$x>2\\Rightarrow x>1$；反向推理不成立。'},
 {title:'集合的交集',stem:'已知集合 $A=\\{1,2,3\\}$，$B=\\{2,4\\}$，求 $A\\cap B$。',options:['$\\{2\\}$','$\\{1,3,4\\}$','$\\{1,2,3,4\\}$','$\\varnothing$'],answer:'A：$\\{2\\}$。',explanation:'交集由同时属于两个集合的元素组成。'},
 {title:'根式函数的定义域',stem:'函数 $y=\\sqrt{x-1}$ 的定义域是（　）。',options:['$[1,+\\infty)$','$(1,+\\infty)$','$(-\\infty,1]$','$\\mathbb R$'],answer:'A：$[1,+\\infty)$。',explanation:'被开方数满足 $x-1\\ge0$，故 $x\\ge1$。'},
 {title:'同角三角函数',stem:'若 $\\sin\\alpha=\\frac35$，且 $\\alpha$ 为锐角，则 $\\cos\\alpha=$（　）。',options:['$\\frac45$','$-\\frac45$','$\\frac35$','$\\frac54$'],answer:'A：$\\frac45$。',explanation:'锐角的余弦为正，且 $\\sin^2\\alpha+\\cos^2\\alpha=1$。'},
 {title:'导数与单调区间',stem:'已知函数 $f(x)$ 在 $\\mathbb R$ 上可导，且 $f^{\\prime}(x)=2x-2$。填写其单调递减区间和单调递增区间：________，________。',answer:'递减区间为 $(-\\infty,1)$，递增区间为 $(1,+\\infty)$。',explanation:'当 $x<1$ 时，$f^{\\prime}(x)<0$；当 $x>1$ 时，$f^{\\prime}(x)>0$。导数符号决定对应区间上的单调性。'},
 {title:'等差数列的通项',stem:'等差数列的首项 $a_1=2$，公差 $d=3$，则 $a_5=$（　）。',options:['$14$','$11$','$17$','$15$'],answer:'A：$14$。',explanation:'$a_5=a_1+4d=2+4\\times3=14$。'},
 {title:'平面向量的数量积',stem:'已知 $\\boldsymbol a=(1,2)$，$\\boldsymbol b=(2,1)$，则 $\\boldsymbol a\\cdot\\boldsymbol b=$（　）。',options:['$4$','$5$','$2$','$0$'],answer:'A：$4$。',explanation:'对应坐标相乘后相加：$1\\times2+2\\times1=4$。'},
 {title:'对数与指数',stem:'若 $\\log_2x=3$，则 $x=$（　）。',options:['$8$','$6$','$9$','$\\frac18$'],answer:'A：$8$。',explanation:'由对数定义，$x=2^3=8$。'},
 {title:'条件概率的乘法公式',stem:'已知 $P(A)=\\frac12$，$P(B\\mid A)=\\frac13$，则 $P(A\\cap B)=$（　）。',options:['$\\frac16$','$\\frac23$','$\\frac56$','$\\frac12$'],answer:'A：$\\frac16$。',explanation:'$P(A\\cap B)=P(A)P(B\\mid A)=\\frac16$。'},
 {title:'抛物线的焦点',stem:'抛物线 $y^2=4x$ 的焦点坐标是（　）。',options:['$(1,0)$','$(2,0)$','$(0,1)$','$(0,2)$'],answer:'A：$(1,0)$。',explanation:'对照 $y^2=2px$，得 $p=2$，焦点为 $(\\frac p2,0)$。'},
 {title:'参数方程与椭圆焦点',stem:'曲线由参数方程 $x=2\\cos t$，$y=\\sin t$（$0\\le t<2\\pi$）给出。',parts:['消去参数，求曲线的普通方程。','求该曲线的两个焦点坐标。'],answer:'普通方程为 $\\frac{x^2}{4}+y^2=1$；焦点为 $(-\\sqrt3,0)$、$(\\sqrt3,0)$。',explanation:'由 $\\cos^2t+\\sin^2t=1$ 消去参数。半轴平方为 $a^2=4$、$b^2=1$，所以 $c^2=a^2-b^2=3$。'},
 {title:'组合计数',stem:'从 $4$ 名同学中选出 $2$ 人参加活动，不区分顺序，共有________种选法。',answer:'$6$。',explanation:'$\\binom42=\\frac{4\\times3}{2\\times1}=6$。'},
 {title:'椭圆的焦距',stem:'已知椭圆 $\\frac{x^2}{25}+\\frac{y^2}{9}=1$，求焦距并说明理由。',answer:'焦距为 $8$。',explanation:'$c^2=a^2-b^2=25-9=16$，故 $c=4$，焦距为 $2c=8$。'},
 {title:'一元二次不等式',stem:'求不等式 $x^2-3x+2<0$ 的解集，并写出依据。',answer:'$(1,2)$。',explanation:'因式分解为 $(x-1)(x-2)<0$，两根之间乘积为负。'},
 {title:'导数、单调性与零点',stem:'已知函数 $f(x)=x^3-3x$。',parts:['求函数的单调区间。','求函数的所有零点。'],answer:'递增区间为 $(-\\infty,-1)$、$(1,+\\infty)$，递减区间为 $(-1,1)$；零点为 $-\\sqrt3$、$0$、$\\sqrt3$。',explanation:'$f^{\\prime}(x)=3(x-1)(x+1)$，按临界点划分区间判断符号。解 $x(x^2-3)=0$ 得到零点。'},
 {title:'椭圆标准方程与焦点',stem:'已知椭圆 $C:\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$（$a>b>0$），离心率为 $\\frac{\\sqrt3}{2}$，经过点 $P(2,1)$。',parts:['求椭圆的标准方程。','求椭圆的两个焦点坐标。'],answer:'$\\frac{x^2}{8}+\\frac{y^2}{2}=1$；焦点为 $F_1(-\\sqrt6,0)$、$F_2(\\sqrt6,0)$。',explanation:'由 $\\frac ca=\\frac{\\sqrt3}{2}$ 及 $a^2=b^2+c^2$ 得 $b^2=\\frac{a^2}{4}$。代入点 $P(2,1)$：$\\frac4{a^2}+\\frac1{b^2}=1$，解得 $a^2=8$、$b^2=2$，于是 $c^2=6$。'},
 {title:'线面垂直的判定',stem:'已知 $AB\\perp AC$，$AB\\perp AD$，直线 $AC$、$AD$ 均在平面 $ACD$ 内且相交。证明 $AB\\perp$ 平面 $ACD$。',answer:'$AB\\perp$ 平面 $ACD$。',explanation:'因为 $AC\\cap AD=\\{A\\}$，且 $AB$ 垂直于平面内的两条相交直线，所以由线面垂直判定定理得证。'},
 {title:'条件概率与事件',stem:'已知 $P(A)=0.6$，$P(B\\mid A)=0.4$。求 $P(A\\cap B)$，并解释条件事件。',answer:'$P(A\\cap B)=0.24$。',explanation:'条件事件为 $A$。由乘法公式，$P(A\\cap B)=P(A)P(B\\mid A)=0.6\\times0.4=0.24$。'},
 {title:'极值与实根个数',stem:'已知 $f(x)=x^3-3x$。',parts:['求函数的极值。','讨论方程 $f(x)=m$ 的不同实根个数。'],answer:'极大值为 $2$，极小值为 $-2$。当 $|m|<2$ 时有 $3$ 个实根；当 $|m|=2$ 时有 $2$ 个；当 $|m|>2$ 时有 $1$ 个。',explanation:'由 $f^{\\prime}(x)=3(x^2-1)$ 得极值点 $x=-1$、$x=1$。结合三个单调区间，比较水平直线 $y=m$ 与函数图象的交点数。'},
]
function ellipseFigure(number:number) {
 const q17=number===17, a=q17?Math.sqrt(8):2,b=q17?Math.sqrt(2):1,c=Math.sqrt(a*a-b*b),unit=70,cx=240,cy=132
 const label=(x:number,y:number,latex:string)=>h('foreignObject',{x,y,width:100,height:32},h('div',{className:'text-read-body'},reviewText(`$${latex}$`)))
 return h('figure',{className:'my-5 max-w-full'},h('svg',{viewBox:'0 0 480 280',role:'img','aria-label':q17?'椭圆与点 P(2,1)，横轴为长轴':'参数方程对应的椭圆，横轴为长轴',className:'mx-auto w-full max-w-md text-foreground'},
 h('g',{stroke:'currentColor',fill:'none'},h('path',{d:`M12 ${cy}H468 M${cx} 12V264`}),h('ellipse',{cx,cy,rx:a*unit,ry:b*unit})),
 h('g',{fill:'currentColor'},...[cx-c*unit,cx+c*unit].map((x,i)=>h('circle',{key:i,cx:x,cy,r:3})),q17&&h('circle',{cx:cx+2*unit,cy:cy-unit,r:3})),
 label(454,cy+4,'x'),label(cx+6,4,'y'),label(cx+5,cy+5,'O'),label(cx-c*unit-12,cy+8,'F_1'),label(cx+c*unit-12,cy+8,'F_2'),q17&&label(cx+2*unit+6,cy-unit-26,'P(2,1)')))
}
const partSolutions: Record<number,[string,string][]> = {
 12:[['$\\frac{x^2}{4}+y^2=1$。','将参数方程分别平方，利用同角三角函数关系相加。'],['$(-\\sqrt3,0)$、$(\\sqrt3,0)$。','由 $a^2=4$、$b^2=1$，得 $c^2=3$。']],
 16:[['递增区间为 $(-\\infty,-1)$、$(1,+\\infty)$；递减区间为 $(-1,1)$。','根据 $f^{\\prime}(x)=3(x-1)(x+1)$ 的符号确定。'],['$-\\sqrt3$、$0$、$\\sqrt3$。','解 $x(x^2-3)=0$。']],
 17:[['$\\frac{x^2}{8}+\\frac{y^2}{2}=1$。','由离心率得 $b^2=\\frac{a^2}{4}$，代入经过点后解得 $a^2=8$、$b^2=2$。'],['$F_1(-\\sqrt6,0)$、$F_2(\\sqrt6,0)$。','$c=\\sqrt{a^2-b^2}=\\sqrt6$，焦点在横轴上。']],
 20:[['极大值为 $2$，极小值为 $-2$。','$f(-1)=2$，$f(1)=-2$；结合导数两侧符号判定极值。'],['当 $|m|<2$ 时有 $3$ 个实根；当 $|m|=2$ 时有 $2$ 个；当 $|m|>2$ 时有 $1$ 个。','比较水平直线与三个单调区间的交点数。']],
}
export const questionExcerpts = ['判断两个不等式命题的充分必要关系','判断两个命题的推出关系','求两个给定集合的交集','求根式函数的定义域','由锐角的正弦求余弦','根据导数填写函数的单调区间','求等差数列的第五项','求两个平面向量的数量积','由对数等式求未知数','由条件概率求交事件概率','求抛物线的焦点坐标','消去参数并求椭圆焦点','从四名同学中选出两人','求椭圆焦距并说明理由','求一元二次不等式的解集','求函数的单调区间与零点','已知椭圆的离心率与经过点，求方程与焦点','利用两组线线垂直证明线面垂直','求交事件概率并解释条件事件','求函数的极值并讨论实根个数']
export function makeQuestionRecord(number:number,kind:string,points:number):QuestionRecord {
 const s=seeds[number-1]
 return {id:`q${number}`,title:s.title,kind,points,response:kind==='选择题'?'single':kind==='填空题'?'fill':'long',stem:p(s.stem),optionColumns:1,
  options:s.options?.map((content,i)=>({id:'ABCD'[i],content:reviewText(content)})),
  figure:[12,17].includes(number)?ellipseFigure(number):undefined,
  parts:s.parts?.map((content,i)=>({id:String(i+1),content:p(content),answer:p(partSolutions[number][i][0]),explanation:p(partSolutions[number][i][1])})),answer:p(s.answer),explanation:p(s.explanation)}
}
