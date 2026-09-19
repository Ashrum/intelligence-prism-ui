import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/coss/button'
import { Badge } from '@/components/prism-next/badge'
export const metadata = { title: '页面骨架' }
export default function Page() { return <div className="mx-auto max-w-5xl px-6 py-12"><p className="text-sm text-muted-foreground">组件库 → 页面骨架 → 标准页面 → Demo / Website</p><h1 className="mt-3 text-3xl font-semibold">页面骨架</h1><p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">骨架负责公共外壳、布局区域与组合接口。组织信息、导航数据和业务回调由应用传入；骨架与标准页面均不计入组件数量。</p><section className="mt-12 flex flex-wrap items-start justify-between gap-6 border-t pt-8"><div className="space-y-3"><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">教师工作台 · 总骨架</h2><Badge variant="outline">v0.1 候选</Badge></div><p className="max-w-xl text-sm text-muted-foreground leading-relaxed">顶部一级导航、按需上下文侧栏、全局搜索、通知、状态监视器、个人菜单与快捷设置。积分及 token 独立预留，兼容全局试题篮。</p><p className="text-sm text-muted-foreground">第1项待站点评审；第2—7项未启动。</p></div><Button render={<Link href="/next/skeletons/workbench" />}>打开骨架评审<ArrowUpRight /></Button></section></div> }
