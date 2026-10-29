import { ref, computed, reactive } from 'vue'

/**
 * 多组件共享的组合式函数（模块级单例状态）。
 * count / double / increment / reset 定义在模块作用域：无论多少个组件调用，
 * 拿到的都是同一份数据源，更新一律通过导出的 increment / reset 进行。
 * 两个导出共享同一份单例，唯一差异是 return 的包装方式，把变量隔离到唯一差异点。
 */

// ---- 模块级单例数据源 ----
const count = ref(0)
const double = computed(() => count.value * 2)

function increment() {
  count.value++
}
function reset() {
  count.value = 0
}

// ✅ 正确写法：返回 ref 集合 —— 每个组件解构后拿到的都是同一个 ref 对象本身，
// 读写都落在同一个 .value 上，多少组件解构、何时解构都指向同一数据源 → 多组件永远一致
export function useCounterRef() {
  return { count, double, increment, reset }
}

// ❌ 反面教材：把同一份单例包成 reactive 返回 —— 解构取出的是「解构那一刻的值」拷贝，
// 与数据源断开；不同组件在不同时刻解构，各拿到各的快照 → 组件之间互不一致（静默失联）
export function useCounterReactive() {
  return reactive({ count, double, increment, reset })
}
