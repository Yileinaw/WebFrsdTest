<template>
  <div class="p-4 md:p-6 bg-gray-50 min-h-screen">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="text-xl font-semibold">网站设置</span>
        </div>
      </template>

      <el-form :model="settings" label-width="120px" label-position="top" @submit.prevent="saveSettings">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="网站标题" prop="siteTitle" :rules="[{ required: true, message: '请输入网站标题', trigger: 'blur' }]">
              <el-input v-model="settings.siteTitle" placeholder="请输入网站标题"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版权信息" prop="copyright">
              <el-input v-model="settings.copyright" placeholder="例如：© 2024 您的网站名称"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="settings.contactEmail" type="email" placeholder="请输入联系邮箱地址"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="网站 Logo" prop="logoUrl">
          <el-upload
            ref="uploadRef"
            :action="'/api/settings/upload-logo'" 
            :headers="uploadHeaders"
            name="logo" 
            :show-file-list="false"
            :on-success="handleLogoUploadSuccess"
            :on-error="handleLogoUploadError"
            :before-upload="beforeLogoUpload"
            :limit="1"
            :auto-upload="true" 
            class="logo-uploader"
          >
            <el-image
              v-if="settings.logoUrl"
              :src="resolvedLogoUrl"
              class="logo-image"
              fit="contain"
              style="width: 178px; height: 178px;" 
            />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                点击上传 Logo。建议尺寸：200x200 像素，格式：PNG, JPG, GIF, WEBP，大小不超过 2MB。
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSettings" :loading="isSaving">{{ isSaving ? '保存中...' : '保存设置' }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import http from '@/http';
// import { useToast } from 'vue-toastification'; // Removed vue-toastification import as ElMessage is used now
import type { UploadProps, UploadInstance, UploadRawFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/modules/user';

// const toast = useToast(); // Removed vue-toastification initialization
const userStore = useUserStore();
const uploadRef = ref<UploadInstance>();

// --- State ---
const settings = reactive<Record<string, string>>({
  siteTitle: '',
  copyright: '',
  contactEmail: '',
  logoUrl: '', // Store the relative or absolute URL from backend
});
const loading = ref(false);
const isSaving = ref(false);
// uploadingLogo can likely be removed as el-upload handles its own state
// const uploadingLogo = ref(false); 
const logoUploadError = ref<string | null>(null); // Keep for potential custom error display

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${userStore.token}`
  };
});

// --- Methods ---

// Utility to resolve logo URL
const resolvedLogoUrl = computed(() => {
  const url = settings.logoUrl;
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Ensure baseURL ends with a slash if it exists, otherwise handle potentially empty baseURL
  const apiBaseUrl = (http.defaults.baseURL || '').endsWith('/') ? http.defaults.baseURL : `${http.defaults.baseURL || ''}/`;
  // Remove 'api/' part more robustly
  const staticBaseUrl = apiBaseUrl.replace(/api\/$/, ''); 
  const relativeUrl = url.startsWith('/') ? url.substring(1) : url; // Remove leading slash if present
  const finalUrl = `${staticBaseUrl}uploads/${relativeUrl}`; // Assuming uploads are served from /uploads relative to static base
  console.log('[resolvedLogoUrl] Original:', url, 'API Base:', apiBaseUrl, 'Static Base:', staticBaseUrl, 'Resolved:', finalUrl);
  return finalUrl;
});

/**
 * Fetch current website settings from the API
 */
async function fetchSettings() {
  loading.value = true;
  console.log("Fetching settings...");
  try {
    const response = await http.get('/settings');
    const knownKeys = Object.keys(settings);
    for (const key in response.data) {
      if (knownKeys.includes(key)) {
        settings[key] = response.data[key];
      }
    }
    console.log("Settings fetched:", JSON.parse(JSON.stringify(settings)));
  } catch (error) {
    console.error('Error fetching settings:', error);
    ElMessage.error('加载网站设置失败'); // Use ElMessage
  } finally {
    loading.value = false;
  }
}

/**
 * Save website settings via API
 */
async function saveSettings() {
  isSaving.value = true;
  console.log("Saving settings:", JSON.parse(JSON.stringify(settings)));
  try {
    await http.put('/settings', settings);
    ElMessage.success('网站设置已成功保存！'); // Use ElMessage
  } catch (error) {
    console.error('Error saving settings:', error);
    ElMessage.error('保存网站设置失败'); // Use ElMessage
  } finally {
    isSaving.value = false;
  }
}

/**
 * Handle successful logo upload from el-upload
 */
const handleLogoUploadSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile
) => {
  console.log('Logo upload success response:', response);
  if (response && response.logoUrl) {
    settings.logoUrl = response.logoUrl; // Update logo URL in state
    ElMessage.success('Logo 上传成功！');
    console.log("Logo uploaded, new URL:", settings.logoUrl);
    // Clear the upload list if needed (optional, good if limit=1)
    // uploadRef.value?.clearFiles(); 
  } else {
    console.error('Logo upload success but response missing logoUrl:', response);
    ElMessage.error('Logo 上传成功，但未能获取新 Logo 地址');
  }
  // uploadingLogo.value = false; // Reset custom loading state if used
}

/**
 * Handle logo upload error from el-upload
 */
const handleLogoUploadError: UploadProps['onError'] = (
  error,
  uploadFile,
  uploadFiles
) => {
  console.error('Logo upload error:', error);
  let errorMessage = 'Logo 上传失败';
  try {
    // Element Plus wraps the error response in the 'message' property of the Error object
    const parsedError = JSON.parse(error.message); 
    errorMessage = parsedError.message || errorMessage; 
  } catch (e) {
     // If parsing fails, use the raw message or default
     errorMessage = error.message || errorMessage; 
  }
  logoUploadError.value = errorMessage;
  ElMessage.error(errorMessage);
  // uploadingLogo.value = false; // Reset custom loading state if used
}

/**
 * Before logo upload validation (Element Plus hook)
 */
const beforeLogoUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('文件类型无效！请上传 PNG, JPG, GIF 或 WEBP 格式的图片。');
    return false;
  }
  const maxSizeInMB = 2;
  if (rawFile.size / 1024 / 1024 > maxSizeInMB) {
    ElMessage.error(`文件过大！请上传小于 ${maxSizeInMB}MB 的图片。`);
    return false;
  }
  // uploadingLogo.value = true; // Set custom loading state (optional)
  logoUploadError.value = null; // Clear previous error
  return true;
}

// --- Lifecycle Hook ---
onMounted(() => {
  fetchSettings();
});

</script>

<style scoped>
/* Styles for el-upload */
.logo-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 178px; /* Ensure container has size */
  height: 178px;
  display: flex; /* Center icon */
  align-items: center;
  justify-content: center;
}

.logo-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  /* Removed width/height/line-height as flex centering handles it */
}

.logo-image {
  /* width and height are set inline on el-image now */
  display: block;
}

.el-upload__tip {
  color: var(--el-text-color-regular);
  font-size: 12px;
  margin-top: 7px;
}
</style>