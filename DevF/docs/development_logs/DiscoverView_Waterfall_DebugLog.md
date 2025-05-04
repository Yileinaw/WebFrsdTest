# 2025-04-11: 瀑布流布局与图片加载调试日志 (DiscoverView)

## 目标

在"发现美食"页面 (`DiscoverView.vue`) 实现多列瀑布流/类 Pinterest 布局，并确保图片正常加载。

## 尝试过程与问题

### 1. 布局库选型与初步尝试 (`vue-masonry-css`)

*   **尝试 1:** 安装并配置 `vue-masonry-css`。
    *   在 `main.ts` 中全局注册插件。
    *   **问题:** 页面白屏，控制台报错 `Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/vue-masonry-css.js?v=...' does not provide an export named 'VueMasonryPlugin'`。
    *   **解决:** 修改 `main.ts`，使用默认导入 `import VueMasonry from 'vue-masonry-css'` 并 `app.use(VueMasonry)`。
*   **问题:** 白屏解决，但布局仍然是单列。
*   **尝试 2 (CSS 与 `:key`):**
    *   简化 `DiscoverView.vue` 中 `.masonry-container` 和 `.masonry-item` 的 CSS 规则 (设置百分比宽度, `box-sizing`)。
    *   为 `v-masonry` 容器添加 `:key="discoverPosts.length"` 尝试强制重新布局。
    *   注释掉响应式 CSS `@media` 查询。
    *   **结果:** 布局依旧单列。
*   **问题:** 控制台出现 `[Vue warn]: Failed to resolve directive: masonry-tile` 和 `[Vue warn]: Failed to resolve directive: masonry` 错误。
*   **尝试 3 (指令用法):**
    *   移除瀑布流子项 (`.masonry-item`) 上的 `v-masonry-tile` 指令，只保留父容器上的 `v-masonry` 及 `item-selector`。
    *   **结果:** `masonry-tile` 错误消失，但 `Failed to resolve directive: masonry` 错误**仍然存在**，布局依然单列。
    *   尝试在组件内局部注册 `masonry` 指令，未成功。
    *   重启 Vite 开发服务器、清除浏览器缓存均无效。
*   **结论:** `vue-masonry-css` 可能与当前 Vue 3 / Vite 环境存在兼容性或 HMR 问题，或者其注册机制有问题。决定更换库。

### 2. 更换布局库 (失败尝试)

*   **尝试 4 (`vue-masonry-wall`):**
    *   卸载 `vue-masonry-css` (遇到 PowerShell `&&` 问题，需分步执行 `cd` 和 `npm uninstall`)。
    *   安装 `vue-masonry-wall` 失败，因其依赖 Vue 2 (`peer vue@"^2.6.10"` )。
    *   尝试安装 `vue-masonry-wall@next` 失败 (npm 包不存在)。
*   **尝试 5 (`vue-masonry-next`):**
    *   尝试安装 `vue-masonry-next` 失败 (npm 包 404 Not Found)。

### 3. 更换布局库 (`vue-waterfall-plugin-next`) - 成功

*   **尝试 6:**
    *   安装 `vue-waterfall-plugin-next` 成功。
    *   清理 `main.ts` 中旧库的 `app.use()`。
    *   修改 `DiscoverView.vue`：
        *   导入 `Waterfall` 组件及其 CSS。
        *   使用 `<waterfall>` 组件替换旧布局，绑定 `:list`, `:breakpoints`, `:gutter`, `:width` 等属性。
        *   使用 `#item` 插槽渲染 `FoodCard`。
    *   **结果: 瀑布流布局正常显示！**

### 4. 图片加载问题

*   **问题:** 瀑布流布局正常，但 `FoodCard` 中的图片显示为灰色占位符 ("加载中...")。
*   **检查 1 (数据与 URL 解析):**
    *   确认后端 `/backend/public/images/post` 目录下图片文件存在。
    *   检查 `FoodCard.vue` 使用的 `resolveStaticAssetUrl` 工具函数逻辑，确认其能正确拼接基础 URL 和相对路径。
    *   在 `FoodCard.vue` 添加日志，打印原始 `imageUrl` 和解析后的 `Resolved URL`。
    *   **发现:** 很多帖子的 `imageUrl` 本身就是 `null`，导致 `Resolved URL` 为空。对于非 `null` 的 URL，解析结果 (`http://localhost:3001/static/...`) 看起来正确。
*   **尝试 7 (占位符):**
    *   修改 `FoodCard.vue`，在 `el-image` 和 `el-avatar` 的 `:src` 绑定中添加逻辑：如果 `resolveStaticAssetUrl` 结果为空，则使用本地的默认占位图片。
    *   **问题:** 页面白屏，Vite 报错 `Failed to resolve import "@/assets/images/default-food-placeholder.png"`。
    *   **解决:** 检查发现 `assets/images` 目录下只有 `default-food.png`。修改 `FoodCard.vue` 中 `defaultPlaceholderImage` 的导入路径为 `@/assets/images/default-food.png`。
    *   **问题:** 刷新后依然白屏，Vite 报错 `Failed to resolve import "@/assets/images/default-avatar.png"`。
    *   **解决:** 修改 `FoodCard.vue` 中 `defaultAvatarPlaceholder` 的导入路径也为 `@/assets/images/default-food.png`。
*   **问题:** 导入错误解决，页面不再白屏，但图片仍然显示为"加载中..."占位符。点击卡片进入详情页，图片**可以**正常加载。
*   **检查 2 (直接 URL):**
    *   暂时修改 `FoodCard.vue`，跳过 `resolveStaticAssetUrl`，直接手动拼接 `http://localhost:3001` 和相对路径绑定给 `:src`。
    *   **结果:** 图片**短暂出现**后又变回"加载中..."状态。
*   **推断:** URL 解析和后端服务正常。问题可能在于瀑布流库更新/重排布局时，与 `el-image` 的 `lazy` 属性发生冲突，导致 `el-image` 状态异常。
*   **尝试 8 (移除 lazy):**
    *   恢复 `FoodCard.vue` 中使用 `resolveStaticAssetUrl` 的逻辑。
    *   移除 `el-image` 组件的 `lazy` 属性。
    *   **结果: 图片稳定正常显示！**

### 5. 性能卡顿问题

*   **问题:** 移除 `lazy` 后，页面虽然图片正常，但滚动或加载时感觉"卡卡的"。
*   **原因:** 所有图片（在已加载数据范围内）同时开始加载，可能造成网络和渲染瓶颈。
*   **优化 1 (占位符样式):**
    *   修改 `FoodCard.vue` 中 `.image-slot-placeholder` 的 CSS，移除 `min-height`，确保 `height: 100%`，使其能更好地利用父级 `.food-image` 的 `aspect-ratio` 来稳定布局，减少图片加载时的跳动感。

## 当前状态与后续建议

*   Discover 页面的瀑布流布局已使用 `vue-waterfall-plugin-next` 实现并正常工作。
*   图片加载问题已通过移除 `el-image` 的 `lazy` 属性解决，并添加了本地图片作为加载失败或 `imageUrl` 为 `null` 时的占位符。
*   **遗留问题:** 页面加载和滚动时可能存在卡顿感。
*   **核心建议:**
    *   **后端图片优化 (优先级最高):** 对存储的图片进行压缩、提供不同尺寸的缩略图、使用 WebP 等现代格式。这是解决卡顿问题的最有效方法。
    *   **前端持续观察:** 如果后端优化后仍有卡顿，可进一步研究 `vue-waterfall-plugin-next` 的性能相关配置或考虑其他更高级的优化手段（如虚拟滚动，但可能增加复杂度）。
