<template>
  <div class="page">
    <h1 class="page-title">插件开发：执行顺序与 enforce</h1>
    <p class="page-desc">
      以本项目的 <code>plugins/vue-route-name.js</code> 为例，说明自定义插件为什么会被
      <code>@vitejs/plugin-vue</code> 影响，以及 <code>enforce: 'pre'</code> 如何解决。
    </p>

    <!-- ① 插件想做什么 -->
    <el-card shadow="never" class="page-card">
      <template #header>① 自定义插件想做什么</template>
      <p class="desc">
        <code>vue-route-name</code> 在 <code>buildStart</code> 时解析路由表，建立
        「组件绝对路径 → 路由 name」的映射；再在 <code>transform</code> 钩子里给命中的路由组件注入
        组件 name，让 <code>keep-alive</code> 的 <code>include</code> 能按名字匹配：
      </p>
      <pre class="code"><code>// transform 收到 .vue 源码后：
parse(code)                    // @vue/compiler-sfc 解析出 SFC 描述符
descriptor.scriptSetup         // 找到 &lt;script setup&gt; 块
→ 顶部注入 defineOptions({ name: 'home' })</code></pre>
      <p class="desc">整个插件只依赖一个前提：<strong>transform 时拿到的还是原始 SFC 源码</strong>。</p>
    </el-card>

    <!-- ② 被谁影响 -->
    <el-card shadow="never" class="page-card">
      <template #header>② 它会被谁影响：plugin-vue 把 SFC 编译成 JS</template>
      <p class="desc">
        SFC 是 Vue 框架指定的文件格式，浏览器并不认识，必须先编译。官方链条：
      </p>
      <pre class="code"><code>「必须交由 @vue/compiler-sfc 编译为标准的 JavaScript 和 CSS」
                                    —— cn.vuejs.org/guide/scaling-up/sfc

「@vitejs/plugin-vue — Provides Vue 3 Single File Components support」
                                    —— vitejs.dev/plugins

「When @vitejs/plugin-vue compiles the &lt;template&gt; blocks in SFCs…」
                                    —— plugin-vue README</code></pre>
      <p class="desc">
        也就是说：在 Vite 项目里，<code>plugin-vue</code> 正是那个调用 compiler-sfc、
        把 <code>.vue</code> 变成标准 ES 模块的插件。谁排在它后面，谁拿到的就是编译产物。
      </p>
    </el-card>

    <!-- ③ 排错顺序的后果 -->
    <el-card shadow="never" class="page-card">
      <template #header>③ 排错顺序会发生什么（实测）</template>
      <p class="desc">
        把 <code>enforce: 'pre'</code> 注释掉、且本插件在数组里排在 <code>vue()</code> 之后，
        再执行 <code>npm run build</code>：
      </p>
      <pre class="code"><code>vue() 先跑 → Home.vue 已被编译成纯 JS 渲染代码
→ 本插件 transform 的 code 不再是 SFC
→ parse() 解析不出 scriptSetup → 静默跳过注入</code></pre>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="失败是完全静默的"
        description="build 成功、零报错、零日志。唯一的症状在运行时：组件没有 name，keep-alive 的 include 匹配失败，页面缓存失效。"
      />
      <p class="desc">
        实验对照：注释 <code>enforce</code> 后 build 日志里「注入」条数为
        <strong>0</strong>；恢复后变回 <strong>6</strong>（对应 6 个路由组件）。
      </p>
    </el-card>

    <!-- ④ Vite 的排序规则 -->
    <el-card shadow="never" class="page-card">
      <template #header>④ Vite 如何决定插件执行顺序</template>
      <p class="desc">
        Vite 先按 <code>enforce</code> 字段把插件分桶，再在<strong>同一桶内</strong>按数组顺序执行：
      </p>
      <div class="pipeline">
        <span class="pipe-stage">enforce: 'pre'</span>
        <span class="pipe-arrow">→</span>
        <span class="pipe-stage">Vite 核心插件</span>
        <span class="pipe-arrow">→</span>
        <span class="pipe-stage">普通插件（无 enforce）</span>
        <span class="pipe-arrow">→</span>
        <span class="pipe-stage">build 插件</span>
        <span class="pipe-arrow">→</span>
        <span class="pipe-stage">enforce: 'post'</span>
      </div>
      <p class="desc">
        <code>vue()</code> 是普通插件；本插件声明了 <code>enforce: 'pre'</code>，
        所以无论在 <code>vite.config.js</code> 的 plugins 数组里写在哪里，都保证先执行。
        数组顺序只在同一层内才起作用。
      </p>
    </el-card>

    <!-- ⑤ 解法 -->
    <el-card shadow="never" class="page-card">
      <template #header>⑤ 关键字段：enforce: 'pre'</template>
      <pre class="code"><code>return {
  name: 'vite-plugin-vue-route-name',
  enforce: 'pre',   // 唯一的顺序保证：永远排在 plugin-vue 之前
  transform(code, id) { ... },
}</code></pre>
      <p class="desc">
        它是插件的公开契约，比「把插件写在数组前面」可靠得多——以后任何人往数组里插新插件，
        都不会静默破坏顺序依赖。插件的 JSDoc 里也应注明「需配合 <code>enforce: 'pre'</code>」。
      </p>
    </el-card>

    <!-- ⑥ 最终闭环 -->
    <el-card shadow="never" class="page-card">
      <template #header>⑥ 最终闭环：keep-alive 的 include 生效</template>
      <pre class="code"><code>路由表 meta.keepAlive: true
  ↓ 自动推导（App.vue）
keepAliveIncludes = ['keep-alive-test', 'about']
  ↓ include 按组件 name 匹配
enforce: 'pre' 保证插件在编译前注入 defineOptions({ name: 'keep-alive-test' })
  ↓ 名字对上
页面被缓存：离开触发 onDeactivated，回来状态保留（如计数器不清零）</code></pre>
      <p class="desc">
        缺了 <code>enforce: 'pre'</code> 这一环，链条在第三步就断了——
        这就是一个自定义插件的执行顺序如何决定 <code>keep-alive</code> 能否工作。
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.pipeline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.pipe-stage {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12.5px;
  background: var(--el-fill-color-light);
}
.pipe-arrow {
  color: var(--el-text-color-secondary);
}
</style>
