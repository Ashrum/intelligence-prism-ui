import ts from 'typescript'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function fieldSourceFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? fieldSourceFiles(join(root, entry.name)) : entry.name.endsWith('.tsx') ? [join(root, entry.name)] : [])
}

/** Parse JSX, including fragments, conditional controls and imported aliases. No file allowlist. */
export function fieldLayoutViolations(source, file = 'fixture.tsx') {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const names = new Map(), variables = new Map(), issues = []
  const tag = node => {
    const value = ts.isJsxElement(node) ? node.openingElement.tagName.getText(sf) : ts.isJsxSelfClosingElement(node) ? node.tagName.getText(sf) : ''
    return names.get(value) ?? value
  }
  function index(node) {
    if (ts.isImportSpecifier(node)) names.set(node.name.text, node.propertyName?.text ?? node.name.text)
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) variables.set(node.name.text, node.initializer)
    ts.forEachChild(node, index)
  }
  index(sf)
  const fields = new Set(['Field', 'FieldRow'])
  const controls = new Set(['Input', 'InputGroup', 'InputGroupInput', 'InputGroupTextarea', 'Textarea', 'Select', 'QuestionSelect', 'PointsField', 'NumberField', 'NumberFieldGroup', 'Combobox', 'Autocomplete', 'Slider', 'ConstraintNumber', 'Switch', 'input', 'textarea', 'select'])
  function control(node, visited = new Set()) {
    if (fields.has(tag(node))) return false
    if (controls.has(tag(node))) return true
    if (ts.isIdentifier(node) && variables.has(node.text) && !visited.has(node.text)) {
      return control(variables.get(node.text), new Set([...visited, node.text]))
    }
    let found = false
    ts.forEachChild(node, child => { if (control(child, visited)) found = true })
    return found
  }
  const issue = (node, rule) => issues.push({ file, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, rule })
  function text(node) {
    if (tag(node) === 'Kbd' || tag(node) === 'KbdGroup') return ''
    if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    let result = ''; ts.forEachChild(node, child => { result += text(child) }); return result
  }
  // Only statically proven visual hiding is exempt. aria-hidden alone does not
  // remove visible layout; dynamic/conditional classes stay subject to the rule.
  function visuallyHidden(node) {
    for (let current = node; current && !ts.isFunctionLike(current); current = current.parent) {
      const opening = ts.isJsxElement(current) ? current.openingElement : ts.isJsxSelfClosingElement(current) ? current : undefined
      for (const attr of opening?.attributes.properties ?? []) {
        if (!ts.isJsxAttribute(attr)) continue
        const name = attr.name.getText(sf), value = attr.initializer
        if (name === 'hidden' && (!value || ts.isStringLiteral(value) || (ts.isJsxExpression(value) && value.expression?.kind === ts.SyntaxKind.TrueKeyword))) return true
        const literal = ts.isStringLiteral(value ?? {}) ? value.text : value && ts.isJsxExpression(value) && value.expression && (ts.isStringLiteral(value.expression) || ts.isNoSubstitutionTemplateLiteral(value.expression)) ? value.expression.text : ''
        if (name === 'className' && /(?:^|\s)(sr-only|hidden)(?:\s|$)/.test(literal) && !/(?:^|\s)(?:\S+:)?not-sr-only(?:\s|$)/.test(literal)) return true
      }
    }
    return false
  }
  // A compact key/action legend is not a sentence of shortcut instructions.
  // Every segment must match; a prose sentence containing a middle dot is not exempt.
  const keyLegend = value => value.split('·').length > 1 && value.split('·').every(part => /^(?:↑↓|Enter|Esc)\s+(?:选择|确认|关闭)$/.test(part.trim()))
  function walk(node) {
    if (ts.isJsxElement(node) && ['Label', 'FieldLabel', 'label'].includes(tag(node))) {
      // A label containing its choice control is a valid coss choice pattern, not naked siblings.
      const containsChoice = node.children.some(child => /<(?:Checkbox|Radio|Switch)\b/.test(child.getText(sf)))
      if (!containsChoice && !visuallyHidden(node)) {
        let parent = node.parent, enclosed = false
        while (parent && !ts.isFunctionLike(parent)) {
          if (fields.has(tag(parent))) { enclosed = true; break }
          parent = parent.parent
        }
        if (!enclosed) {
          let siblings = node.parent
          while (siblings && !ts.isJsxElement(siblings) && !ts.isJsxFragment(siblings)) siblings = siblings.parent
          if (siblings?.children.some(child => child !== node && control(child))) issue(node, 'bare-label-control')
        }
      }
    }
    if (ts.isJsxElement(node) && tag(node) === 'p' && !visuallyHidden(node) && !keyLegend(node.children.map(text).join('').trim()) && /⌘|Ctrl\s*(?:\/|\+)|\bEsc(?:ape)?\b/i.test(text(node))) issue(node, 'shortcut-prose')
    ts.forEachChild(node, walk)
  }
  walk(sf)
  return issues
}

export function scanFieldLayouts(roots) {
  return roots.flatMap(fieldSourceFiles).flatMap(file => fieldLayoutViolations(readFileSync(file, 'utf8'), file))
}
