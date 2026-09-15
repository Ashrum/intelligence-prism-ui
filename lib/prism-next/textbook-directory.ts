export type DirectoryKind = "course" | "knowledge"
export type DirectoryBranch = { id: string; title: string; code?: string; children?: DirectoryBranch[] }
export type DirectoryNode = { id: string; title: string; code?: string; children: string[] }
export type DirectoryData = { rootId: string; nodes: Record<string, DirectoryNode>; leafIds: string[]; folderIds: string[]; paths: Record<string, string[]> }

export function createDirectory(scope: string, branches: DirectoryBranch[]): DirectoryData {
  const rootId = `${scope}:root`
  const nodes: Record<string, DirectoryNode> = { [rootId]: { id: rootId, title: "目录", children: [] } }
  const paths: Record<string, string[]> = {}
  const leafIds: string[] = [], folderIds: string[] = []
  function visit(branch: DirectoryBranch, ancestors: string[]): string {
    const id = `${scope}:${branch.id}`
    if (nodes[id]) throw new Error(`Duplicate directory ID: ${id}`)
    nodes[id] = { id, title: branch.title, code: branch.code, children: [] }
    paths[id] = [...ancestors, id]
    nodes[id].children = (branch.children ?? []).map(child => visit(child, paths[id]))
    ;(nodes[id].children.length ? folderIds : leafIds).push(id)
    return id
  }
  nodes[rootId].children = branches.map(branch => visit(branch, []))
  return { rootId, nodes, leafIds, folderIds, paths }
}

export function projectDirectory(data: DirectoryData, query: string) {
  const normalized = query.trim().toLocaleLowerCase()
  const matchingIds = new Set<string>()
  const visibleIds = new Set<string>([data.rootId])
  const includeDescendants = (id: string) => { visibleIds.add(id); data.nodes[id].children.forEach(includeDescendants) }
  if (!normalized) Object.keys(data.nodes).forEach(id => visibleIds.add(id))
  else for (const [id, node] of Object.entries(data.nodes)) {
    if (id === data.rootId || !`${node.code ?? ""} ${node.title}`.toLocaleLowerCase().includes(normalized)) continue
    matchingIds.add(id)
    data.paths[id].forEach(parent => visibleIds.add(parent))
    includeDescendants(id)
  }
  const nodes = Object.fromEntries(Object.entries(data.nodes).map(([id, node]) => [id, { ...node, children: node.children.filter(child => visibleIds.has(child)) }]))
  return { nodes, visibleIds, matchingIds, normalized }
}

export function directoryLeaves(data: DirectoryData, id: string): string[] {
  const node = data.nodes[id]
  if (!node) return []
  return node.children.length ? node.children.flatMap(child => directoryLeaves(data, child)) : [id]
}

// Compact only complete subtrees. Canonical selection remains leaf IDs, so a
// partial branch never implies that its other children have been selected.
export function summarizeDirectory(data: DirectoryData, selectedIds: string[]) {
  const selected = new Set(selectedIds)
  const entries: { id: string; leafIds: string[] }[] = []
  function visit(id: string) {
    const leaves = directoryLeaves(data, id)
    if (leaves.length && leaves.every(leafId => selected.has(leafId))) entries.push({ id, leafIds: leaves })
    else data.nodes[id].children.forEach(visit)
  }
  data.nodes[data.rootId].children.forEach(visit)
  return entries
}

const leaf = (id: string, title: string, code?: string): DirectoryBranch => ({ id, title, code })
const branch = (id: string, title: string, children: DirectoryBranch[], code?: string): DirectoryBranch => ({ id, title, children, code })

export const textbooks = [
  { id: "math-1", title: "高中数学 · 必修第一册", note: "示例教材", directories: {
    course: createDirectory("math-1:course", [
      branch("c1", "集合与常用逻辑用语", [
        branch("c11", "集合的概念与运算", [leaf("c111", "集合的含义与表示", "1.1.1"), leaf("c112", "集合间的基本关系", "1.1.2"), leaf("c113", "集合的基本运算", "1.1.3")], "1.1"),
        branch("c12", "常用逻辑用语", [leaf("c121", "充分条件与必要条件", "1.2.1"), leaf("c122", "全称量词与存在量词", "1.2.2")], "1.2"),
      ], "第 1 章"),
      branch("c2", "函数的概念与性质", [
        branch("c21", "函数的概念", [leaf("c211", "函数的定义与定义域", "2.1.1"), leaf("c212", "函数的表示方法", "2.1.2")], "2.1"),
        branch("c22", "函数的基本性质", [leaf("c221", "单调性与最大（小）值", "2.2.1"), leaf("c222", "奇偶性", "2.2.2"), leaf("c223", "从图像与代数表达式两种角度理解函数性质及其实际应用", "2.2.3")], "2.2"),
        branch("c23", "函数性质的综合应用", [branch("c231", "图像与变化", [leaf("c2311", "分段函数图像分析", "2.3.1.1"), leaf("c2312", "函数图像的平移与伸缩", "2.3.1.2")], "2.3.1")], "2.3"),
      ], "第 2 章"),
      branch("c3", "指数函数与对数函数", [leaf("c31", "指数函数", "3.1"), leaf("c32", "对数函数", "3.2"), leaf("c33", "函数的应用", "3.3")], "第 3 章"),
    ]),
    knowledge: createDirectory("math-1:knowledge", [
      branch("k1", "集合与逻辑", [branch("k11", "集合", [leaf("k111", "元素与集合的关系"), leaf("k112", "子集与真子集"), leaf("k113", "交集、并集与补集")]), branch("k12", "命题与条件", [leaf("k121", "充分条件"), leaf("k122", "必要条件")])]),
      branch("k2", "函数", [branch("k21", "基本概念", [leaf("k211", "定义域"), leaf("k212", "值域"), leaf("k213", "对应关系")]), branch("k22", "基本性质", [leaf("k221", "单调性"), leaf("k222", "奇偶性"), leaf("k223", "最值")]), branch("k23", "基本初等函数", [leaf("k231", "指数函数"), leaf("k232", "对数函数")]), branch("k24", "函数图像", [branch("k241", "图像变换", [leaf("k2411", "平移变换"), leaf("k2412", "伸缩变换")])])]),
    ]),
  } },
  { id: "math-2", title: "高中数学 · 必修第二册", note: "示例教材", directories: {
    course: createDirectory("math-2:course", [
      branch("c1", "平面向量", [branch("c11", "向量的概念与运算", [leaf("c111", "向量的概念", "1.1.1"), leaf("c112", "向量的线性运算", "1.1.2"), leaf("c113", "平面向量的数量积", "1.1.3")], "1.1"), leaf("c12", "平面向量的应用", "1.2")], "第 1 章"),
      branch("c2", "立体几何", [branch("c21", "空间几何体", [leaf("c211", "基本立体图形", "2.1.1"), leaf("c212", "表面积与体积", "2.1.2")], "2.1"), branch("c22", "空间位置关系", [leaf("c221", "平行关系", "2.2.1"), leaf("c222", "垂直关系", "2.2.2")], "2.2")], "第 2 章"),
      branch("c3", "概率与统计", [leaf("c31", "随机抽样", "3.1"), leaf("c32", "用样本估计总体", "3.2"), leaf("c33", "随机事件与概率", "3.3")], "第 3 章"),
    ]),
    knowledge: createDirectory("math-2:knowledge", [
      branch("k1", "向量", [leaf("k11", "向量的模"), leaf("k12", "共线向量"), leaf("k13", "数量积")]),
      branch("k2", "空间几何", [branch("k21", "度量", [leaf("k211", "表面积"), leaf("k212", "体积")]), branch("k22", "位置关系", [leaf("k221", "线面平行"), leaf("k222", "线面垂直"), leaf("k223", "面面垂直")])]),
      branch("k3", "概率与统计", [leaf("k31", "简单随机抽样"), leaf("k32", "平均数与方差"), leaf("k33", "古典概型")]),
    ]),
  } },
]
