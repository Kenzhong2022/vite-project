// plugins/vue-route-name.js
import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@vue/compiler-sfc'
import MagicString from 'magic-string'

/**
 * 将路径中的反斜杠统一为正斜杠，保证 Windows 下与 Vite 的模块 id 一致。
 * @param {string} p
 * @returns {string}
 */
function normalizePath(p) {
  return p.replace(/\\/g, '/')
}

/**
 * 解析 import 说明符为完整绝对路径，分两步：
 * 去掉前缀：'@/xxx' 砍掉前 2 个字符得 'xxx'；'./xxx'、'../xxx' 原样保留
 * 拼接：把结果交给 path.resolve 拼成绝对路径
 *    - '@/' 开头的基于 src 目录（vite.config.js 里配置的别名指向 src）
 *    - './'、'../' 开头的基于路由文件所在目录
 *    - 其余（vue、element-plus 等裸模块）返回 null，由调用方跳过
 * @param {string} spec import 语句里的模块说明符，如 '@/views/Home.vue'
 * @param {string} projectRoot 项目根目录
 * @param {string} routesDir 路由文件所在目录
 * @returns {string | null} 绝对路径（未归一化），无法解析时为 null
 */
function resolveSpec(spec, projectRoot, routesDir) {
  let rel // 去掉前缀后的相对路径
  let baseDir // 拼接所用的基准目录
  if (spec.startsWith('@/')) {
    rel = spec.slice(2)
    baseDir = path.resolve(projectRoot, 'src')
  } else if (spec.startsWith('.')) {
    rel = spec
    baseDir = routesDir
  } else {
    return null
  }
  return path.resolve(baseDir, rel)
}

/**
 * 从路由文件中提取「组件绝对路径 -> 路由 name」的映射。
 * 同时支持静态 import 的组件变量和 `() => import('...')` 动态导入。
 * @param {string} routesFile 路由文件的绝对路径
 * @returns {Map<string, string>} key 为归一化后的组件绝对路径，value 为路由 name
 */
function buildRouteNameMap(routesFile) {
  const routeNameMap = new Map()
  if (!fs.existsSync(routesFile)) {
    console.warn(`[vue-route-name] 路由文件未找到: ${routesFile}`)
    return routeNameMap
  }

  const source = fs.readFileSync(routesFile, 'utf-8')
  const routesDir = path.dirname(routesFile)
  const projectRoot = process.cwd()

  const importMap = new Map()
  // 正则表达式，匹配 `import X from '...'` 形式的默认导入
  // 捕获组 1：变量名（X）
  // 捕获组 2：组件绝对路径（'...'）
  const importRe = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"`]([^'"`]+)['"`]/g
  let m
  // 扫出所有 `import X from '...'` 形式的默认导入，建立「变量名 -> 组件绝对路径」映射。
  //
  // importRe.exec(source) 是 RegExp.prototype.exec，在 source 中查找匹配：
  //   · 匹配成功 → 返回数组 [完整匹配文本, 捕获组1, 捕获组2, ...]（另带 index / input / groups 属性）
  //   · 匹配失败 → 返回 null，所以用 `!== null` 判断循环是否结束
  //   · 正则带 g 标志时，exec 用 lastIndex 记录「上次匹配结束的位置」，下次从该位置继续，
  //     因此同一个正则反复调用即可依次遍历全部匹配；彻底找不到时 lastIndex 会自动归零
  //   · while 的条件位置不允许直接写赋值语句，外层括号把赋值整体包成一个表达式
  //
  // 注意：lastIndex 挂在正则对象上，而非循环内的临时变量。若循环中途 break / return，
  //      游标会停在半路，下次复用该正则时会漏匹配；本项目在函数内新建正则对象，
  //      每次调用都从 0 开始，因此不受影响。
  while ((m = importRe.exec(source)) !== null) {
    // 跳过 m[0]（完整匹配文本），只取两个捕获组
    const [, varName, spec] = m
    // 去前缀 + 拼接为完整绝对路径；裸模块（vue、element-plus 等）不可能是路由组件，跳过
    const resolved = resolveSpec(spec, projectRoot, routesDir)
    if (!resolved) continue
    // 统一成正斜杠，与 Vite transform 钩子传入的模块 id 格式保持一致（Windows 下 id 也是正斜杠）
    importMap.set(varName, normalizePath(resolved))
  }

  const nameRe = /\bname:\s*['"`]([^'"`]+)['"`]/g
  const compRe =
    /\bcomponent:\s*(?:\(\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)|([A-Za-z_$][\w$]*))/g

  const names = []
  while ((m = nameRe.exec(source)) !== null) {
    names.push({ name: m[1], index: m.index })
  }

  const comps = []
  while ((m = compRe.exec(source)) !== null) {
    comps.push({
      literalPath: m[1],
      varName: m[2],
      index: m.index,
    })
  }

  console.log(
    `[vue-route-name] 找到 name: ${names.length} 个, component: ${comps.length} 个, import 映射: ${importMap.size} 个`,
  )

  for (const comp of comps) {
    let matched = null
    for (const n of names) {
      if (n.index < comp.index) matched = n
      else break
    }
    if (!matched) continue

    let resolvedPath = null
    if (comp.literalPath) {
      // 动态导入的字面量路径，同样走「去前缀 + 拼接」流程
      resolvedPath = resolveSpec(comp.literalPath, projectRoot, routesDir)
    } else if (comp.varName && importMap.has(comp.varName)) {
      // 静态导入的变量名，反查 importMap
      resolvedPath = importMap.get(comp.varName)
    }
    if (!resolvedPath) continue

    routeNameMap.set(normalizePath(resolvedPath), matched.name)
  }

  return routeNameMap
}

/**
 * 若目标 SFC 是路由组件且尚未声明 name，则在 <script setup> 顶部注入
 * `defineOptions({ name })`。非路由组件或已显式声明 name 的组件原样返回。
 * @param {string} code SFC 源码
 * @param {string} id Vite 传入的模块 id，可能带 `?vue&type=...` 查询参数
 * @param {Map<string, string>} routeNameMap 路由映射表
 * @returns {string | { code: string, map: any }} 原始字符串或带 sourcemap 的转换结果
 */
function injectNameToSFC(code, id, routeNameMap) {
  if (!id.endsWith('.vue')) return code

  const filePath = normalizePath(id.split('?')[0])
  const routeName = routeNameMap.get(filePath)
  if (!routeName) return code

  const { descriptor } = parse(code)
  if (!descriptor.scriptSetup) return code

  const scriptSetupContent = descriptor.scriptSetup.content
  if (/defineOptions\s*\(\s*\{[^}]*\bname\b/.test(scriptSetupContent)) {
    console.log(`[vue-route-name] 组件 ${path.basename(filePath)} 已有 name，跳过。`)
    return code
  }

  const injection = `defineOptions({ name: '${routeName}' });\n`
  const newScriptSetupContent = injection + scriptSetupContent

  const s = new MagicString(code)
  s.overwrite(
    descriptor.scriptSetup.loc.start.offset,
    descriptor.scriptSetup.loc.end.offset,
    newScriptSetupContent,
  )
  console.log(`[vue-route-name] 注入 ${path.basename(filePath)} -> ${routeName}`)
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  }
}

/**
 * Vite 插件：按路由配置为路由组件自动注入与路由 name 一致的组件 name。
 * 需配合 `enforce: 'pre'` 在 @vitejs/plugin-vue 之前修改 SFC 源码。
 * @param {{ routesFile?: string }} [options]
 * @returns {import('vite').Plugin}
 */
export default function vueRouteNamePlugin(options = {}) {
  const { routesFile = path.resolve(process.cwd(), 'src/router/index.js') } = options

  let routeNameMap = new Map()

  return {
    name: 'vite-plugin-vue-route-name',
    // enforce: 'pre' 是注入生效的唯一顺序保证，它让本插件永远排在 plugin-vue 之前，
    // 与本插件在 vite.config.js plugins 数组中的位置无关（Vite 先按 enforce 分层，再在同层内按数组序执行）。
    // 若去掉它、且本插件恰好排在 vue() 之后：transform 拿到的已经是 plugin-vue 编译后的纯 JS，
    // parse() 解析不出 scriptSetup → 静默跳过注入。build 不会报错，但组件没有 name，
    // 运行时 <keep-alive :include="[...]"> 按组件 name 匹配失败 → 页面缓存直接失效。
    enforce: 'pre',
    /**
     * 构建开始时加载路由映射表
     */
    buildStart() {
      routeNameMap = buildRouteNameMap(routesFile)
      console.log(`[vue-route-name] 已加载 ${routeNameMap.size} 条路由名称映射。`)
    },

    transform(code, id) {
      return injectNameToSFC(code, id, routeNameMap)
    },
  }
}
