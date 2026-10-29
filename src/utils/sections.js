// 章节数据通用工具：把章节树（顶层 + children）展平为按 key 索引的 map。
// 页面取数无需关心层级，子章节 key 也能直接取（s['sub-key']）。
// dev 环境下 map 是 Proxy：访问不存在的 key（数据改名后页面没同步）会在控制台
// 打印"哪个页面访问了哪个不存在的 key"并返回占位章节，页面其余部分照常渲染。
export function createSectionMap(sections) {
  const map = Object.fromEntries(
    sections.flatMap((sec) => [sec, ...(sec.children ?? [])]).map((sec) => [sec.key, sec]),
  )
  if (import.meta.env.DEV) {
    return new Proxy(map, {
      /**
       * 拦截 map 访问，若不存在 key 则打印警告并返回占位章节
       * @param {Object} target 章节数据 map
       * @param {string} prop 访问的 key
       * @returns {Object} 访问结果
       */
      get(target, prop) {
        // 放行 Vue 响应式内部探测（__v_isRef / __v_raw 等）：模板渲染时会对 s 反复做
        // isRef 检查，若当成业务 key 警告会刷屏，把真正的错误淹没
        if (typeof prop === 'string' && !prop.startsWith('__v_') && !(prop in target)) {
          console.warn(
            `[sections] 页面访问了不存在的章节 key "${prop}"（调用点 ${callSite()}）` +
              `—— 章节数据里没有这个 key（key 改名后页面未同步？）`,
          )
          return { key: String(prop), title: `[缺失章节: ${prop}]`, children: [] }
        }
        return target[prop]
      },
    })
  }
  return map
}

// 从 Error.stack 提取第一个业务调用点（跳过本文件与内部帧），如 "views/ElementTheme.vue:51:22"
function callSite() {
  const line = (new Error().stack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('at') && !l.includes('sections.js'))
  const m = line?.match(/src\/[^\s?:]+:\d+:\d+/)?.[0]
  return m ? m.replace(/^src\//, '') : '未知位置'
}
