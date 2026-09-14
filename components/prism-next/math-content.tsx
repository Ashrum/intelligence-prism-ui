export function RootFormula() {
  return <math className="prism-math" display="block" aria-label="x一、二等于负b加减根号下b平方减四ac，整体除以二a">
    <msub><mi>x</mi><mrow><mn>1</mn><mo>,</mo><mn>2</mn></mrow></msub><mo>=</mo><mfrac><mrow><mo>−</mo><mi>b</mi><mo>±</mo><msqrt><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac>
  </math>
}
export function MathContent({title="二次方程的实数根"}:{title?:string}) {
  return <article className="prism-copy" aria-labelledby="reading-title">
    <p className="!mb-3 text-sm !text-muted-foreground">数学 / 函数与方程 / § 2.3</p>
    <h1 id="reading-title" className="mb-6 break-words text-2xl leading-snug font-semibold text-(--heading)">{title}</h1>
    <p>对于一元二次方程 <math className="prism-math"><mi>a</mi><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mi>b</mi><mi>x</mi><mo>+</mo><mi>c</mi><mo>=</mo><mn>0</mn></math>，其中 <math className="prism-math"><mi>a</mi><mo>≠</mo><mn>0</mn></math>，当判别式非负时，可以使用求根公式。</p>
    <div className="prism-equation"><RootFormula/></div>
    <h2>先判断，再求解</h2>
    <p>判别式 <math className="prism-math"><mi>Δ</mi><mo>=</mo><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></math> 决定实数根的情况：</p>
    <ul><li>大于零：有两个不相等的实数根。</li><li>等于零：有两个相等的实数根。</li><li>小于零：没有实数根。</li></ul>
    <h2>例题</h2>
    <p>求方程 <math className="prism-math"><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>3</mn><mi>x</mi><mo>+</mo><mn>2</mn><mo>=</mo><mn>0</mn></math> 的实数根。代入 <math className="prism-math"><mi>a</mi><mo>=</mo><mn>1</mn><mo>,</mo><mi>b</mi><mo>=</mo><mo>−</mo><mn>3</mn><mo>,</mo><mi>c</mi><mo>=</mo><mn>2</mn></math>，得到判别式为 1。</p>
    <dl className="prism-numeric mt-5 grid grid-cols-2 gap-6 border-t pt-5 text-sm"><div><dt className="text-muted-foreground">较小根</dt><dd className="mt-1 text-xl font-medium">1.000</dd></div><div><dt className="text-muted-foreground">较大根</dt><dd className="mt-1 text-xl font-medium">2.000</dd></div></dl>
  </article>
}
