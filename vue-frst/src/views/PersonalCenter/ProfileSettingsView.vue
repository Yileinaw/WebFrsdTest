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

      <!-- Avatar Upload - Keep outside modal for simplicity -->
      <div class="setting-item avatar-upload">
         <label>上传新头像</label>
         <el-upload
            class="avatar-uploader"
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
      
      <!-- Profile Form -->
      <div class="setting-item profile-form">
         <label>修改昵称</label>
         <el-input v-model="editableName" placeholder="输入新昵称"></el-input>
         <el-button type="primary" @click="updateName" :loading="isUpdatingName">保存昵称</el-button>
      </div>

    </div>
    <el-empty v-else description="无法加载用户信息" />

    <!-- Avatar Edit Dialog -->
    <el-dialog v-model="avatarDialogVisible" title="修改头像" width="500px" class="avatar-dialog">
        <div class="dialog-content">
            <!-- Preview of pending avatar -->
            <div class="preview-section">
                <label>预览</label>
                <el-avatar :size="120" :src="resolveStaticAssetUrl(pendingAvatarUrl)" />
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
                    @click="pendingAvatarUrl = presetUrl"  
                    class="preset-avatar"
                    :class="{ 'selected': pendingAvatarUrl === presetUrl }"
                    />
                    <!-- Button to select removing avatar -->
                    <el-button text @click="pendingAvatarUrl = null" class="preset-avatar remove-avatar-btn" :class="{ 'selected': pendingAvatarUrl === null }">移除头像</el-button>
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/modules/user';
import { ElAvatar, ElUpload, ElButton, ElInput, ElMessage, ElEmpty, ElDialog, ElIcon } from 'element-plus';
import type { UploadProps, UploadRawFile } from 'element-plus'
import { UserService } from '@/services/UserService';
import http from '@/http'; // 导入 http 实例以获取 baseUrl
import { EditPen, User } from '@element-plus/icons-vue';

const userStore = useUserStore();

const editableName = ref('');
const isUpdatingName = ref(false);
const avatarDialogVisible = ref(false);
const pendingAvatarUrl = ref<string | null>(null);

// --- Remove hardcoded defaultAvatars ---
// const defaultAvatars = ref([...]); 

// --- Add ref for dynamically loaded preset avatars ---
const presetAvatarUrls = ref<string[]>([]);

// --- Fetch preset avatars on mount ---
const fetchPresetAvatars = async () => {
    try {
        presetAvatarUrls.value = await UserService.getDefaultAvatars();
        console.log('[ProfileSettingsView] Fetched preset avatars:', presetAvatarUrls.value);
    } catch (error) {
        console.error('[ProfileSettingsView] Failed to fetch preset avatars:', error);
        ElMessage.error('加载预设头像失败');
    }
};

// 计算上传 URL
const uploadUrl = computed(() => UserService.getUploadAvatarUrl());
        
// 获取上传请求头（携带 token）
const uploadHeaders = computed(() => ({
     Authorization: `Bearer ${userStore.token}`
}));

// Function to resolve static asset URLs (like presets or uploaded avatars)
const resolveStaticAssetUrl = (url: string | null | undefined): string => {
    console.log(`[resolveStaticAssetUrl] Resolving URL: ${url}`);
    if (!url) {
        console.log('[resolveStaticAssetUrl] URL is null or undefined, returning empty string.');
        return ''; 
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('[resolveStaticAssetUrl] URL is absolute, returning as is:', url);
        return url;
    }
    
    const apiBaseUrl = http.defaults.baseURL || '';
    const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, ''); 
    const relativeUrl = url.startsWith('/') ? url : '/' + url;
    const finalUrl = `${staticBaseUrl}${relativeUrl}`;
    console.log(`[resolveStaticAssetUrl] Original: ${url}, API Base: ${apiBaseUrl}, Static Base: ${staticBaseUrl}, Final URL: ${finalUrl}`);
    return finalUrl;
};

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
    userStore.updateAvatarUrl(response.avatarUrl);
    ElMessage.success('头像上传成功!');
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
  pendingAvatarUrl.value = userStore.currentUser?.avatarUrl || null;
  // Ensure presets are loaded before opening, or show loading state
  if (presetAvatarUrls.value.length === 0) {
      // Optionally fetch again or show loading inside dialog
      // fetchPresetAvatars(); 
  }
  avatarDialogVisible.value = true;
};

// Save avatar selection
const saveAvatarSelection = async () => {
  const currentStoredUrl = userStore.currentUser?.avatarUrl || null;
  
  // Use null to represent removing the avatar if pendingAvatarUrl is null
  const urlToSave = pendingAvatarUrl.value;

  if (urlToSave === currentStoredUrl) {
    avatarDialogVisible.value = false;
    return; // No change
  }
  
  console.log('[ProfileSettingsView] Saving avatar selection with URL:', urlToSave);
  try {
      const { user: updatedUser } = await UserService.updateUserProfile({ avatarUrl: urlToSave ?? undefined }); // Send null if pending is null, otherwise the URL
      userStore.setUser(updatedUser); // Update user store with the complete updated user object
      ElMessage.success('头像更新成功!');
      avatarDialogVisible.value = false;
  } catch (error: any) {
      console.error('Failed to update avatar:', error);
      ElMessage.error(error.response?.data?.message || '头像更新失败');
  }
};

// Update name
const updateName = async () => {
    if (!userStore.currentUser || !editableName.value.trim() || editableName.value === userStore.currentUser.name) {
         return; 
    }
    isUpdatingName.value = true;
    try {
         const response = await UserService.updateUserProfile({ name: editableName.value });
         console.log('[ProfileSettingsView] Update Profile Response (Name):', response);
         userStore.updateUserInfo(response.user);
         ElMessage.success('昵称更新成功!');
     } catch (error: any) {
         console.error('[ProfileSettingsView] Error updating name:', error);
         ElMessage.error(error.response?.data?.message || '昵称更新失败');
     } finally {
        isUpdatingName.value = false;
     }
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
    display: grid;
    grid-template-columns: 120px 1fr; /* Label and control */
    align-items: center;
    gap: 15px;

    label {
        font-weight: 500;
        color: #606266;
        text-align: right;
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
   .avatar-uploader {
     // Style the uploader if needed
   }
   .el-upload__tip {
     color: #909399;
     font-size: 12px;
     margin-top: 5px;
   }
}

.profile-form {
    grid-template-columns: 120px auto auto; /* Label, Input, Button */
    align-items: center; /* Align items vertically */
    .el-input {
        // Input width can be adjusted if needed
    }
    .el-button {
        // Button style if needed
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
</style> 