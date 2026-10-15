# 标尺密度调整验证

2026-10-15，基线 a36acadade4068a21f5bc9a0336d9714a812450f，Windows / Node.js 24.14.0。

## 设计与范围

- BlueprintSheet 的蓝图外框标尺由18px / 12px调整为14px / 10px，行高1；尺寸用rem，内容padding保持48px 40px 40px。内框、四边厚度和端点统一。
- 仅blueprint作用域，排除嵌套核心主题预览；小字号还要求aria-hidden=true。用户本轮明确授权自行决定尺寸；字号检查只放行精确完整的这一条规则，没有整文件或通用字号豁免。
- 新增检查器边界测试在独立临时最小仓库中执行真实脚本：批准声明通过，移除主题、隔离或aria-hidden、逗号追加选择器、换元素/字号/文件、额外局部字号均拒绝。
- 不改冻结coss、核心主题令牌、依赖或轻量Blueprint v0.4实验。规范和STATUS原位更新，生成正文与下载资产。

## 实际检查

| 命令 | 结果 |
| --- | --- |
| node scripts/check-math-font.mjs | 通过，退出0 |
| node scripts/check-typography.mjs | 306 owned TSX通过，退出0；装饰字号例外按上述边界验证 |
| node node_modules/vinext/dist/cli.js build | 通过，退出0 |
| node node_modules/typescript/bin/tsc --noEmit | 通过，无诊断，退出0 |
| node --test tests/blueprint*.test.mjs | 39/39通过，退出0；[日志](targeted-tests.log) |
| node --test tests/*.test.mjs | 1949项，1688通过、261失败、0 skipped，退出1 |

全量失败描述集合与本次输入基线a36acad的同步记录一致，无新增或消失的失败；见[差异](failure-delta.json)。历史Windows路径、CRLF与ESM代表性复现见[v9分析](../v9/windows-test-analysis.md)。不宣称261项已逐一修复或全量通过。构建及原始全量日志保存在本地 `.sites-runtime/ruler-20261015/`。

## 浏览器

Chrome / Playwright真实浏览器，模拟桌面视口1280×960及320×800。[测量](browser-results.json)、[复验脚本](browser-qa.js)，截图为 `docs/blueprint/screens/ruler-20261015/`。

- 四主题各320/1280共8组，无页面横向溢出；蓝图桌面四边14px、字体10px，四张图纸坐标字形无裁切；核心三主题桌面保持18/12px。
- 两层核心主题DOM预览夹具保留18/12px；这只证明CSS隔离，不代替React Theme Context或读屏器验证。
- 窄屏保留现有隐藏策略。根字号增至20px时蓝图标尺17.5px、数字12.5px，字形无裁切；没有把根字号放大称为浏览器缩放或真机测试。
- 调整前后截图目视检查：外圈更轻，内框四边连续，正文、按钮、标题、SHEET编号与内容留白保持原比例。页面错误0。
- 未验：真机、读屏器、实体打印及全站像素回归。本轮维持第四主题候选状态。

发布以合入main后的精确提交构建并同步Site，实际版本以原生部署记录与会话终态为准。
