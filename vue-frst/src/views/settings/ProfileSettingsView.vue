<template>
  <div class="personal-center-view">
    <h2 class="view-title">
       <el-icon><User /></el-icon> 个人资料
    </h2>
    <div v-if="userStore.currentUser" class="settings-content">

      <!-- Current Avatar - Make it clickable -->
      <div class="setting-item current-avatar">
        <label>当前头像</label>
        <div class="avatar-container" @click="openAvatarDialog">
          <el-avatar :size="100" :src="userStore.resolvedAvatarUrl" />
          <div class="edit-icon-overlay">
             <el-icon><EditPen /></el-icon>
          </div>
        </div>
      </div>

      <!-- Avatar Upload - REMOVED from here -->
      <!-- <div class="setting-item avatar-upload"> ... </div> -->

      <!-- Profile Actions Section -->
      <div class="setting-item profile-actions">
         <label>账号操作</label>
         <div class="action-group">
             <!-- Nickname Form -->
            <el-form @submit.prevent="updateName" class="inline-form nickname-form">
                <el-input v-model="editableName" placeholder="输入新昵称" size="default"></el-input>
                <el-button type="primary" @click="updateName" :loading="isUpdatingName" size="default">保存昵称</el-button>
            </el-form>
            <!-- Change Password Button -->
            <el-button type="danger" plain @click="showPasswordModal = true" size="default" class="password-button">修改密码</el-button>
         </div>
      </div>

    </div>
    <el-empty v-else description="无法加载用户信息" />

    <!-- Avatar Edit Dialog -->
    <el-dialog v-model="avatarDialogVisible" title="修改头像" width="500px" class="avatar-dialog">
        <div class="dialog-content">
            <!-- Preview of pending avatar -->
            <div class="preview-section">
                <label>预览</label>
                <el-avatar :size="120" :src="resolveStaticAssetUrl(uploadedAvatarPreviewUrl || selectedAvatarUrlInModal)" />
            </div>

            <!-- Upload New Avatar - MOVED HERE -->
            <div class="setting-item avatar-upload-dialog">
                <label>上传新头像</label>
                <el-upload
                    class="avatar-uploader-dialog"
                    :action="uploadUrl"
                    :show-file-list="false"
                    :headers="uploadHeaders"
                    :on-success="handleAvatarSuccess"
                    :before-upload="beforeAvatarUpload"
                    name="avatar"
                >
                    <el-button type="primary">点击上传</el-button>
                    <template #tip>
                    <div class="el-upload__tip">
                        只能上传 jpg/png 文件，且不超过 5MB
                    </div>
                    </template>
                </el-upload>
            </div>

            <!-- Default Avatars Selection - Use presetAvatarUrls -->
            <div class="setting-item default-avatars">
                <label>选择预设头像</label>
                <div class="avatar-options">
                    <el-avatar
                    v-for="presetUrl in presetAvatarUrls"
                    :key="presetUrl"
                    :size="60"
                    :src="resolveStaticAssetUrl(presetUrl)"
                    @click="selectPresetOrRemove(presetUrl)"
                    class="preset-avatar"
                    :class="{ 'selected': selectedAvatarUrlInModal === presetUrl }"
                    />
                    <!-- Button to select removing avatar -->
                    <el-button text @click="selectPresetOrRemove(null)" class="preset-avatar remove-avatar-btn" :class="{ 'selected': selectedAvatarUrlInModal === null }">移除头像</el-button>
                </div>
            </div>
        </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="avatarDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAvatarSelection">保存</el-button>
        </span>
      </template>
    </el-dialog>

  <!-- Password Change Modal -->
  <PasswordChangeModal v-model:visible="showPasswordModal" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/modules/user';
import { ElAvatar, ElUpload, ElButton, ElInput, ElMessage, ElEmpty, ElDialog, ElIcon, ElForm } from 'element-plus';
import type { UploadProps, UploadRawFile } from 'element-plus'
import { UserService } from '@/services/UserService';
import { EditPen, User, Setting } from '@element-plus/icons-vue';
import PasswordChangeModal from '@/components/modal/PasswordChangeModal.vue'; // <-- Import modal

const userStore = useUserStore();

const editableName = ref('');
const isUpdatingName = ref(false);
const avatarDialogVisible = ref(false);
const selectedAvatarUrlInModal = ref<string | null>(null);
const uploadedAvatarPreviewUrl = ref<string | null>(null);
const presetAvatarUrls = ref<string[]>([]);
const showPasswordModal = ref(false); // <-- Define state for modal

// --- Remove hardcoded defaultAvatars ---
// const defaultAvatars = ref([...]);

// --- Fetch preset avatars on mount ---
const fetchPresetAvatars = async () => {
    try {
        const response = await UserService.getDefaultAvatars();
        console.log('[ProfileSettingsView] Raw response:', response);

        // 确保我们得到的是数组
        const avatars = Array.isArray(response) ? response :
                       Array.isArray(response.avatarUrls) ? response.avatarUrls : [];

        if (avatars.length > 0) {
            presetAvatarUrls.value = avatars;
            console.log('[ProfileSettingsView] Set preset avatars:', presetAvatarUrls.value);
        } else {
            console.warn('[ProfileSettingsView] No preset avatars found in response');
            ElMessage.warning('没有可用的预设头像');
        }
    } catch (error) {
        console.error('[ProfileSettingsView] Failed to fetch preset avatars:', error);
        ElMessage.error('获取预设头像失败');
    }
};

// 计算上传 URL
const uploadUrl = computed(() => UserService.getUploadAvatarUrl());

// 获取上传请求头（携带 token）
const uploadHeaders = computed(() => ({
     Authorization: `Bearer ${userStore.token}`
}));

// 使用公共的 URL 解析工具
import { resolveStaticAssetUrl } from '@/utils/urlUtils';

// 挂载时和用户信息变化时同步输入框名字
const syncName = () => {
    if (userStore.currentUser) {
        editableName.value = userStore.currentUser.name || '';
    }
};

onMounted(() => {
    syncName();
    fetchPresetAvatars(); // Fetch presets when component mounts
});
watch(() => userStore.currentUser?.name, syncName); // Watch for changes in user name

// Watch the resolved avatar URL from the store for debugging
watch(() => userStore.resolvedAvatarUrl, (newUrl) => {
  console.log('[ProfileSettingsView] Resolved Avatar URL in Store:', newUrl);
}, { immediate: true });

// 上传成功处理
const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile
) => {
  console.log('[ProfileSettingsView] Avatar Upload Success Response:', response);
  if (response && response.avatarUrl) {
    const newUrl = response.avatarUrl;
    uploadedAvatarPreviewUrl.value = newUrl; // Set preview for newly uploaded
    selectedAvatarUrlInModal.value = newUrl; // Also select it automatically
    console.log(`[ProfileSettingsView] Avatar Upload Success: uploadedAvatarPreviewUrl=${uploadedAvatarPreviewUrl.value}, selectedAvatarUrlInModal=${selectedAvatarUrlInModal.value}`); // Log state after upload
    ElMessage.success('头像上传成功! 请点击保存以应用更改。');
  } else {
     ElMessage.error(response?.message || '头像上传失败，响应无效');
  }
}

// 上传前检查
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  const isImage = rawFile.type.startsWith('image/');
  const isLt5M = rawFile.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!');
  }
  return isImage && isLt5M;
}

// Open avatar dialog
const openAvatarDialog = () => {
  selectedAvatarUrlInModal.value = userStore.currentUser?.avatarUrl || null;
  uploadedAvatarPreviewUrl.value = null; // Clear upload preview
  console.log(`[ProfileSettingsView] Opening Dialog: initial selectedAvatarUrlInModal=${selectedAvatarUrlInModal.value}`); // Log initial state
  if (presetAvatarUrls.value.length === 0) {
      fetchPresetAvatars();
  }
  avatarDialogVisible.value = true;
};

// 保存头像选择 (包括上传的、预设的或移除)
const saveAvatarSelection = async () => {
  const currentStoredUrl = userStore.currentUser?.avatarUrl || null;
  const urlToSave = selectedAvatarUrlInModal.value; // The final choice in modal

  if (urlToSave === currentStoredUrl) {
    ElMessage.info('头像未更改');
    avatarDialogVisible.value = false;
    return;
  }

  console.log('[ProfileSettingsView] Saving avatar selection. Final URL chosen in modal:', urlToSave); // Log URL to be saved

  // Remove assumption about upload endpoint handling DB update.
  // Always call the store action which now handles the backend update.
  console.log(`[ProfileSettingsView] Calling userStore.updateAvatarUrl with:`, urlToSave);
  try {
      await userStore.updateAvatarUrl(urlToSave);

      ElMessage.success('头像已更新!');
      avatarDialogVisible.value = false;
  } catch (error) {
      console.error('[ProfileSettingsView] Failed to save avatar selection:', error);
      ElMessage.error('保存头像失败，请重试。');
      // Consider fetching profile again to ensure sync on error
      // await userStore.fetchUserProfile();
  }
};

// Update name
const updateName = async () => {
    if (!userStore.currentUser || !editableName.value.trim() || editableName.value === userStore.currentUser.name) {
         return;
    }
    isUpdatingName.value = true;
    try {
         // Call the unified update method
         const response = await UserService.updateMyProfile({ name: editableName.value });
         console.log('[ProfileSettingsView] Update Profile Response (Name):', response);
         if (response && response.user) {
             userStore.setUser(response.user);
             ElMessage.success('昵称更新成功!');
         } else {
             throw new Error('Invalid response after updating profile');
         }
    } catch (error: any) {
         console.error('Failed to update name:', error);
         ElMessage.error(error.response?.data?.message || error.message || '昵称更新失败');
    } finally {
         isUpdatingName.value = false;
    }
};

const selectPresetOrRemove = (url: string | null) => {
    console.log(`[ProfileSettingsView] Preset/Remove Clicked: url=${url}`); // Log clicked URL
    selectedAvatarUrlInModal.value = url;
    uploadedAvatarPreviewUrl.value = null; // Clear upload preview when preset is chosen
    console.log(`[ProfileSettingsView] State after Preset/Remove Click: selectedAvatarUrlInModal=${selectedAvatarUrlInModal.value}, uploadedAvatarPreviewUrl=${uploadedAvatarPreviewUrl.value}`); // Log state after click
};

</script>

<style scoped lang="scss">
/* Add styles for the unified view container */
.personal-center-view {
  padding: 25px;
  background-color: #fff;
  border-radius: 4px;
  min-height: 400px;
}

/* Styles for the unified view title */
.view-title {
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  color: #303133;
  margin-bottom: 25px;
  .el-icon {
    margin-right: 10px;
    // You might want a specific icon color here, e.g.:
    // color: var(--el-color-primary);
  }
}

.settings-content {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 30px; /* Spacing between setting items */
}

.setting-item {
    display: flex;
    align-items: flex-start; // Align label top
    margin-bottom: 25px;
    label {
        width: 100px; // Consistent label width
        margin-right: 20px;
        padding-top: 6px; // Align label with input/button text
        color: var(--el-text-color-regular);
        font-weight: 500;
        text-align: right;
        flex-shrink: 0; // Prevent label shrinking
    }
}

.current-avatar {
   .avatar-container {
        position: relative;
        cursor: pointer;
        width: 100px; // Match avatar size
        height: 100px;
        border-radius: 50%; // Ensure container is also round for overlay
        overflow: hidden;

        .el-avatar {
            display: block; // Remove extra space below avatar
        }

        .edit-icon-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.3);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: 50%;
            font-size: 24px;
        }

        &:hover .edit-icon-overlay {
            opacity: 1;
        }
   }
}

.avatar-upload {
   .el-upload__tip {
     color: #909399;
     font-size: 12px;
     margin-top: 5px;
   }
}

.profile-actions {
  .action-group {
    display: flex;
    flex-wrap: wrap; // Allow wrapping on smaller screens
    gap: 15px; // Space between items
    align-items: center; // Align items vertically
  }
  .inline-form {
    display: inline-flex; // Keep input and button together
    align-items: center;
    gap: 10px;
    .el-input {
      width: 200px; // Adjust width as needed
    }
  }
}

/* Dialog Styles */
.avatar-dialog {
    .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 25px;
    }

    .preview-section {
        text-align: center;
        label {
            display: block;
            margin-bottom: 10px;
            font-weight: 500;
        }
    }

    .setting-item {
        display: block; // Override grid for dialog items
        label {
           display: block;
           margin-bottom: 10px;
           font-weight: 500;
           text-align: left;
        }
    }

    .avatar-options {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center; // Align button with avatars

        .preset-avatar {
            cursor: pointer;
            border: 2px solid transparent;
            transition: border-color 0.2s;
            border-radius: 50%; // Make sure border follows shape

            &.selected {
                border-color: var(--el-color-primary);
            }
            &:hover {
                border-color: var(--el-color-primary-light-3);
            }
        }
        .remove-avatar-btn {
            // Specific styles for remove button if needed
            border: 1px dashed var(--el-border-color);
            padding: 5px 10px;
             &.selected {
                 border-style: solid;
                 border-color: var(--el-color-primary);
                 background-color: var(--el-color-primary-light-9);
             }
        }
    }
}

// Add styles for elements inside the dialog if needed
.avatar-dialog {
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .preview-section {
    text-align: center;
    margin-bottom: 10px;
    label {
      display: block;
      margin-bottom: 8px;
      color: var(--el-text-color-secondary);
      font-size: 0.9rem;
    }
  }

  .avatar-upload-dialog {
      display: flex;
      flex-direction: column; // Align button and tip vertically
      align-items: flex-start; // Align items to the left
       .el-upload__tip {
          margin-top: 8px;
          font-size: 0.85rem;
      }
  }

  .setting-item {
     label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
        color: var(--el-text-color-regular);
     }
  }

  .default-avatars {
    .avatar-options {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    .preset-avatar {
        cursor: pointer;
        border: 2px solid transparent;
        transition: border-color 0.2s ease;
        &.selected {
           border-color: var(--el-color-primary);
        }
        &:hover {
            opacity: 0.8;
        }
    }
     .remove-avatar-btn {
         height: 60px; // Match avatar size
         width: 60px; // Match avatar size
         display: flex;
         align-items: center;
         justify-content: center;
         border: 1px dashed var(--el-border-color);
          &.selected {
            border-style: solid;
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
         }
     }
  }
}

// General setting item styles (if not already defined well)
.setting-item {
    margin-bottom: 25px;
    label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600; // Make labels slightly bolder
        color: var(--el-text-color-primary);
        font-size: 0.95rem;
    }
}

.current-avatar {
  .avatar-container {
    position: relative;
    width: 100px; // Match avatar size
    height: 100px;
    cursor: pointer;
    border-radius: 50%; // Make container round
    overflow: hidden; // Hide overflow for overlay effect

    .edit-icon-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3); // Darker overlay
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      font-size: 24px; // Larger icon
    }

    &:hover .edit-icon-overlay {
      opacity: 1;
    }
  }
}

// Adjust profile actions layout if needed
.profile-actions {
  .action-group {
      display: flex;
      flex-direction: column; // Stack actions vertically
      gap: 15px;
      align-items: flex-start;
  }
  .inline-form {
      display: flex;
      gap: 10px;
      align-items: center;
  }
}

</style>



