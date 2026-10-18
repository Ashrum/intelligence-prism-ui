import docs from "@/lib/prism-next/learning-analysis-docs.json"
import { GuideBlock, type Block } from "@/components/prism-next/blueprint-guide"

export const learningAnalysisDocuments = docs.documents

export function LearningAnalysisDoc({slug = "index"}:{slug?:string}) {
  const document = docs.documents.find(item=>item.slug===slug)!
  return <div className="prism-content min-w-0" data-learning-analysis-source={document.sourceSha256}>
    <header className="prism-page-heading"><p>OLE / LEARNING ANALYSIS / DESIGN</p><h1>{document.title}</h1><p className="text-ui-hint text-muted-foreground">v0.7 r2 · 正式设计发布 · Derived / Non-canonical</p></header>
    <nav aria-label="学情分析文档" className="mb-6 flex flex-wrap gap-x-6 gap-y-3 text-ui-action">
      {docs.documents.filter(item=>["index","main","specs","screens","impact","release"].includes(item.slug)).map(item=><a key={item.slug} href={item.route} className="prism-link" aria-current={item.slug===slug?"page":undefined}>{({index:"阅读入口",main:"整体主稿",specs:"六份规格",screens:"设计画面",impact:"分类影响",release:"发布记录"} as Record<string,string>)[item.slug]}</a>)}
      <a className="prism-link" href={document.sourceDownload} download>下载本篇 Markdown</a>
    </nav>
    {slug==="index" && <p className="mb-7 text-ui-hint text-muted-foreground">帮助教师与各级教育管理者找到有权、有资源改变的教学条件，以行动对照下一轮学习证据。此处为正式设计文档，功能与生产准入仍按门禁核验。</p>}
    {document.headings.length>3 && <details className="mb-8 border-y py-4"><summary className="cursor-pointer text-ui-action">本篇目录</summary><nav aria-label="本篇目录" className="mt-4 grid gap-3 text-ui-hint sm:grid-cols-2">{document.headings.filter(h=>h.level===2).map(h=><a className="prism-link" key={h.id} href={`#${h.id}`}>{h.text}</a>)}</nav></details>}
    <article aria-label={document.title} className="max-w-5xl min-w-0 text-read-body">{(document.blocks as Block[]).map((block,index)=><GuideBlock key={index} block={block} index={index}/>)}</article>
    <footer className="mt-10 border-t pt-5 text-ui-meta text-muted-foreground"><p>正文、图片与下载文件由仓库同一份源文档生成；原始影响报告与历史验证按各自版本解释。</p><p className="mt-2 break-all font-mono">来源 SHA-256：{document.sourceSha256}</p></footer>
  </div>
}
