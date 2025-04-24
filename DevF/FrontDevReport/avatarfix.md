# 头像上传功能调试记录

## 初始问题

用户在个人设置中上传新头像时遇到以下问题：
1.  上传新头像后，预设头像选项全部变灰，无法选择。
2.  点击保存后，提示"头像更新成功！"，但实际头像并未更新（无论是新上传的还是选择的预设）。
3.  后续发现预设头像文件被从 Supabase 存储中删除。
4.  后端项目目录下反复出现空的 `storage` 文件夹。

## 调试过程与解决方案

通过一系列排查，定位并解决了多个层面的问题：

1.  **前端状态冲突 (`ProfileSettingsView.vue`)**
    *   **问题：** 修改头像模态框使用同一个 Vue ref (`pendingAvatarUrl`) 来管理"新上传图片的预览 URL"和"最终选中的头像 URL（预设或移除）"，导致上传新图后状态混乱，影响了预设头像的选中样式。
    *   **解决：** 引入两个独立的 ref：`selectedAvatarUrlInModal` 用于跟踪最终选中的 URL，`uploadedAvatarPreviewUrl` 用于存储新上传的预览 URL。修改了相关事件处理函数 (`handleAvatarSuccess`, `selectPresetOrRemove`) 和模板绑定逻辑，分离状态管理。

2.  **预设头像被误删 (`UserController.ts` - `uploadAvatar` 函数)**
    *   **问题：** 后端处理头像上传 (`uploadAvatar`) 的函数中，包含删除旧头像的逻辑。该逻辑在解析旧头像 URL 时，未能区分用户上传的头像 (`user-avatars/`) 和预设头像 (`preset-avatars/`)，导致当用户从预设头像切换到新头像时，旧的预设头像文件被错误删除。
    *   **解决：** 在 `uploadAvatar` 函数的删除逻辑中添加检查，确保从旧 URL 解析出的 `oldSupabasePath` 是以 `user-avatars/` 开头时，才执行 `supabase.storage.remove()` 操作。

3.  **本地 `storage` 目录生成 (`multerConfig.ts`)**
    *   **问题：** 发现后端存在一个旧的 `multer` 配置文件 (`backend/src/config/multerConfig.ts`)，它使用了 `diskStorage` 并包含调用 `fs.mkdirSync` 创建本地 `./storage` 目录的代码。即使实际路由使用的是配置在 `uploadMiddleware.ts` 中的 `memoryStorage`，这个旧配置文件的存在或被意外导入执行，导致了空目录反复出现。
    *   **解决：** 确认所有上传均使用 `memoryStorage` 后，直接删除了不再需要的 `multerConfig.ts` 文件。

4.  **Supabase 存储上传权限 (`Supabase Policies`)**
    *   **问题：** Supabase `frsd-file` 存储桶策略中，没有明确授予后端使用的服务角色（在此项目中为 `service_role`）执行 `INSERT` 操作的权限。虽然存储桶是公开读的，但写入操作必须有策略授权。
    *   **解决：** 通过 Supabase SQL Editor 执行了 `CREATE POLICY` 命令，为 `service_role` 角色添加了针对 `frsd-file` 存储桶的 `INSERT` 和 `SELECT` 权限。

5.  **前端状态与后端不同步 (`user.ts` Store)**
    *   **问题：** `userStore` 中的 `updateAvatarUrl` action 只更新了 Pinia 的本地状态和 `localStorage`，没有调用后端 API 来持久化用户的头像选择（特别是选择预设或移除时）。
    *   **解决：** 修改了 `updateAvatarUrl` action，使其内部调用 `UserService.updateMyProfile` 将最终选择的 `avatarUrl` (可以是新 URL、预设 URL 或 `null`) 发送到后端。并在后端成功响应后，使用返回的最新用户信息调用 `setUser` 来更新本地 Store，确保状态一致。

6.  **新头像上传后立即被删除 (`UserController.ts` - `updateMe` 函数)**
    *   **问题:** 发现通用的个人资料更新接口 (`updateMe`，处理 `PUT /api/users/me/profile`) 也包含了删除 Supabase 头像文件的逻辑。当前端 `updateAvatarUrl` action 调用此接口同步最终头像选择时，该接口会错误地将刚刚上传的新头像 URL 当作"旧头像"并删除。
    *   **解决:** 从 `updateMe` 函数中彻底移除了所有与删除 Supabase 文件相关的逻辑，将其职责限定为只更新数据库记录。删除旧头像的逻辑保留在专门的 `uploadAvatar` 函数中。

7.  **UI 未即时更新**
    *   **问题：** 即使后端和 Store 状态更新，有时前端头像显示组件未响应变化。
    *   **解决：** 通过确保 `updateAvatarUrl` action 在后端成功后，使用 `setUser` action（传入从后端返回的完整、最新的用户信息）来更新 `currentUser` 状态，保证了 Vue 的响应式系统能够侦测到变化并触发相关 UI 组件（如依赖 `resolvedAvatarUrl` 计算属性的头像显示）的重新渲染。

## 最终结果

经过以上步骤，头像上传、预设选择、移除头像功能恢复正常。文件能正确上传到 Supabase 的 `user-avatars` 目录，数据库记录正确更新，前端 UI 也能即时反映更改，并且预设头像不再被误删，本地 `storage` 目录也不再生成。
