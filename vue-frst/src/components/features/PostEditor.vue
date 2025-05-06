<template>
  <el-dialog
    :model-value="visible"
    title="发布新分享"
    width="60%"
    @update:model-value="$emit('update:visible', $event)"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="post-editor-dialog"
  >
    <el-form
      ref="postFormRef"
      :model="postForm"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="postForm.title" placeholder="给你的分享起个响亮的标题吧"></el-input>
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input
          type="textarea"
          :rows="6"
          v-model="postForm.content"
          placeholder="分享你的美食故事、食谱或探店心得..."
        ></el-input>
      </el-form-item>
      <el-form-item label="标签">
        <el-tag
          v-for="tag in postForm.tags"
          :key="tag"
          closable
          :disable-transitions="false"
          @close="handleTagClose(tag)"
          style="margin-right: 5px; margin-bottom: 5px;"
        >
          {{ tag }}
        </el-tag>
        <!-- 使用 el-select 替换之前的输入方式 -->
        <el-select
          v-if="postForm.tags.length < 5" 
          v-model="postForm.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="选择或创建标签 (最多5个)"
          size="small"
          style="width: 240px; margin-left: 10px; vertical-align: top;"
          class="tag-select"
        >
          <el-option
            v-for="item in allAvailableTags"
            :key="item.id"
            :label="item.name"
            :value="item.name" 
          />
        </el-select>
        <span v-else style="font-size: 12px; color: #909399; margin-left: 10px; vertical-align: top;">最多添加5个标签</span>
      </el-form-item>

      <!-- Image Upload Section -->
      <el-form-item label="图片">
        <!-- Display uploaded image preview -->
        <div v-if="imagePreviewUrl" class="image-preview">
          <el-image
            :src="imagePreviewUrl"
            fit="contain"
            style="width: 150px; height: 150px; border: 1px solid #eee;"
            :preview-src-list="[imagePreviewUrl]"
            preview-teleported
            hide-on-click-modal
          />
          <el-button type="danger" link @click="removeImage">移除图片</el-button>
        </div>
        <!-- Upload component -->
        <el-upload
          v-else
          class="image-uploader"
          action=""
          :show-file-list="false"
          @change="handleFileChange"
          accept="image/*"
          :auto-upload="false"
        >
          <el-button type="primary">选择图片</el-button>
          <template #tip>
            <div class="el-upload__tip">
              可选，仅限jpg/png格式，大小不超过5MB
            </div>
          </template>
        </el-upload>
        <!-- Upload progress/error display -->
        <div v-if="uploadError" style="color: red; font-size: 12px; margin-top: 5px;">{{ uploadError }}</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="submitPost" :loading="isSubmitting">
          发布
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElUpload, ElImage, ElTag, ElSelect, ElOption } from 'element-plus'
import type { FormInstance, FormRules, UploadProps, UploadRequestOptions, UploadRawFile } from 'element-plus'
import { PostService } from '@/services/PostService'
import { useUserStore } from '@/stores/modules/user';
import http from '@/http';
import { resolveStaticAssetUrl } from '@/utils/urlUtils';

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible', 'post-created'])

const postFormRef = ref<FormInstance>()
const postForm = reactive({
  title: '',
  content: '',
  tags: [] as string[], // Add tags property
})
const selectedFile = ref<UploadRawFile | null>(null); // Store the selected file object
const imagePreviewUrl = ref<string | null>(null); // For previewing the selected image
const isSubmitting = ref(false)
const uploadError = ref<string | null>(null)
const userStore = useUserStore()

// --- 新增：标签获取逻辑 ---
interface Tag {
  id: number;
  name: string;
  isFixed?: boolean; // 假设标签对象可能包含这些属性
}

const allAvailableTags = ref<Tag[]>([]); // 存储所有可用标签

const fetchAvailableTags = async () => {
  try {
    // console.log('[PostEditor] Fetching available tags via http...');
    const response = await http.get<{ tags: Tag[], totalCount: number }>('/tags'); 
    allAvailableTags.value = response.data.tags || [];
    // console.log('[PostEditor] Available tags fetched:', allAvailableTags.value);
  } catch (error) {
    console.error('Failed to fetch available tags:', error);
    ElMessage.error('获取标签列表失败'); 
  }
};

onMounted(() => {
  fetchAvailableTags(); // 组件挂载后获取标签
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm();
    fetchAvailableTags(); // 每次对话框打开时也重新获取一下标签，确保最新
  }
})

const formRules = reactive<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
})

const resetForm = () => {
  postForm.title = ''
  postForm.content = ''
  postForm.tags = []; // Reset tags
  // postForm.imageUrl = null // Remove
  selectedFile.value = null; // Reset file
  imagePreviewUrl.value = null; // Reset preview
  uploadError.value = null
  postFormRef.value?.resetFields()
}

const handleClose = (done: () => void) => {
  // Optionally add confirm dialog if form is dirty
  resetForm()
  emit('update:visible', false)
  done()
}

const handleCancel = () => {
  resetForm()
  emit('update:visible', false)
}

// --- Image Upload Logic --- 
const handleFileChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  console.log('[PostEditor] handleFileChange triggered. File:', uploadFile.name, uploadFile.status);
  // Only process newly added files (status is ready)
  if (uploadFile.status === 'ready') {
      const rawFile = uploadFile.raw;
      if (!rawFile) {
          console.error('[PostEditor] No raw file found in uploadFile.');
          return;
      }
      console.log('[PostEditor] Raw file details:', rawFile.name, rawFile.type, rawFile.size);

      const isImage = rawFile.type.startsWith('image/');
      const isLt5M = rawFile.size / 1024 / 1024 < 5;
      uploadError.value = null; // Reset error

      if (!isImage) {
          console.log('[PostEditor] Validation Failed: Not an image.');
          ElMessage.error('请上传图片格式文件!');
          return; // Stop processing
      }
      if (!isLt5M) {
          console.log('[PostEditor] Validation Failed: Size limit exceeded.');
          ElMessage.error('图片大小不能超过 5MB!');
          return; // Stop processing
      }

      // Validation Passed
      console.log('[PostEditor] Validation Passed. Setting state...');
      selectedFile.value = rawFile;
      console.log('[PostEditor] selectedFile.value set:', selectedFile.value ? selectedFile.value.name : 'null');

      try {
          // Revoke previous URL if exists
          if (imagePreviewUrl.value) {
              URL.revokeObjectURL(imagePreviewUrl.value);
          }
          const newPreviewUrl = URL.createObjectURL(rawFile);
          imagePreviewUrl.value = newPreviewUrl;
          console.log('[PostEditor] imagePreviewUrl.value set:', imagePreviewUrl.value);
      } catch (e) {
          console.error('[PostEditor] Error creating object URL:', e);
          uploadError.value = '生成图片预览失败';
          selectedFile.value = null; // Clear selected file if preview fails
          imagePreviewUrl.value = null;
      }
  } else if (uploadFile.status === 'fail') {
      console.error('[PostEditor] Upload file status failed:', uploadFile.name);
      ElMessage.error('文件选择失败，请重试');
  }
  // We don't need to return anything here for onChange
};

const removeImage = () => {
    if (imagePreviewUrl.value) {
        URL.revokeObjectURL(imagePreviewUrl.value); // Clean up object URL first
    }
    selectedFile.value = null;
    imagePreviewUrl.value = null;
};
// --- End Image Upload Logic ---

const submitPost = async () => {
  // console.log('[PostEditor] submitPost called'); // Remove log
  if (!postFormRef.value) return
  await postFormRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true
      try {
        // Create FormData
        const formData = new FormData();
        formData.append('title', postForm.title);
        formData.append('content', postForm.content);

        // Append tags if any
        if (postForm.tags.length > 0) {
          postForm.tags.forEach(tag => {
            formData.append('tags', tag); // Backend expects 'tags' as field name for array
          });
        }
        
        // --- Remove File and FormData Logs --- 
        // console.log('[PostEditor] selectedFile.value:', selectedFile.value);
        if (selectedFile.value) {
            formData.append('image', selectedFile.value);
            // console.log('[PostEditor] Appended file to FormData with key \'image\'');
        } else {
            // console.log('[PostEditor] No file selected to append.');
        }
        // console.log('[PostEditor] FormData entries (before send):');
        // for (let [key, value] of formData.entries()) { 
        //     console.log(`  ${key}: ${value}`); 
        // }
        // --- End Remove Log ---

        // Call the service with FormData
        // console.log('[PostEditor] Calling PostService.createPost...'); // Remove log
        await PostService.createPost(formData); 
        // console.log('[PostEditor] PostService.createPost successful'); // Remove log

        ElMessage.success('发布成功!')
        emit('post-created')
        handleCancel() // Close and reset form
      } catch (error: any) {
        console.error('Failed to create post (Refactored):', error)
        ElMessage.error(error.response?.data?.message || '发布失败')
      } finally {
        isSubmitting.value = false
      }
    }
  })
}

const handleTagClose = (tag: string) => {
  postForm.tags.splice(postForm.tags.indexOf(tag), 1)
}
</script>

<style scoped lang="scss">
.post-editor-dialog {
  // Add specific styles for the dialog if needed
}

.el-form-item .el-tag + .el-tag {
  margin-left: 10px;
}
.el-form-item .button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.el-form-item .el-input--small { 
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}

.tag-select .el-select__tags .el-tag { 
  margin-right: 5px;
  margin-bottom: 2px; 
}

.image-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  width: 150px; /* Match preview size */
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: var(--el-transition-duration-fast);
  &:hover {
    border-color: var(--el-color-primary);
  }
}
.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 7px;
  line-height: normal;
  text-align: center; /* Center tip text below button */
  width: 150px;
}

.image-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 150px; /* Container width */
}
</style>