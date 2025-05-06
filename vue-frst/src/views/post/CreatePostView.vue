<template>
  <div class="create-post-view">
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <h1>发布新帖子</h1>
          <div class="actions">
            <el-button @click="goBack">取消</el-button>
            <el-button type="primary" @click="submitPost" :loading="isSubmitting">发布</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="post-editor-container">
        <el-form
          ref="postFormRef"
          :model="postForm"
          :rules="formRules"
          label-position="top"
          class="post-form"
        >
          <el-form-item label="标题" prop="title">
            <el-input
              v-model="postForm.title"
              placeholder="给你的分享起个响亮的标题吧"
              maxlength="100"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item label="内容" prop="content">
            <el-input
              type="textarea"
              :rows="10"
              v-model="postForm.content"
              placeholder="分享你的美食故事、食谱或探店心得..."
              maxlength="5000"
              show-word-limit
            ></el-input>
          </el-form-item>

          <!-- Image Upload Section -->
          <el-form-item label="封面图片">
            <!-- Display uploaded image preview -->
            <div v-if="imagePreviewUrl" class="image-preview">
              <el-image
                :src="imagePreviewUrl"
                fit="contain"
                style="width: 100%; max-height: 300px; border: 1px solid #eee;"
                :preview-src-list="[imagePreviewUrl]"
                preview-teleported
                hide-on-click-modal
              />
              <el-button type="danger" @click="removeImage">移除图片</el-button>
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
              drag
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">拖拽图片到此处，或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  可选，仅限jpg/png格式，大小不超过5MB
                </div>
              </template>
            </el-upload>
            <!-- Upload progress/error display -->
            <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
          </el-form-item>

          <!-- 标签选择 -->
          <el-form-item label="标签">
            <el-tag
              v-for="tag in selectedTags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            
            <!-- Updated tag input using el-select -->
            <el-select
              v-if="selectedTags.length < 5"
              v-model="selectedTags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="选择预设标签或创建新标签"
              size="small"
              style="width: 240px; margin-left: 10px; vertical-align: top;"
              class="tag-select-create-view"
            >
              <el-option
                v-for="item in presetTags"
                :key="item.id" 
                :label="item.name"
                :value="item.name"
              />
            </el-select>
            <span v-else style="font-size: 12px; color: #909399; margin-left: 10px; vertical-align: top;">最多添加5个标签</span>

            <div class="tag-tip">添加标签可以让更多人发现你的帖子</div>
          </el-form-item>
        </el-form>

        <!-- 预览区域 -->
        <div class="preview-section" v-if="showPreview">
          <h2>预览</h2>
          <div class="preview-content">
            <h3>{{ postForm.title || '标题预览' }}</h3>
            <div class="preview-image" v-if="imagePreviewUrl">
              <el-image :src="imagePreviewUrl" fit="cover" />
            </div>
            <div class="preview-text">
              {{ postForm.content || '内容预览' }}
            </div>
            <div class="preview-tags" v-if="selectedTags.length > 0">
              <el-tag v-for="tag in selectedTags" :key="tag" size="small">{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, computed } from 'vue'
import {
  ElForm, ElFormItem, ElInput, ElButton, ElMessage,
  ElUpload, ElImage, ElTag, ElIcon, ElSelect, ElOption
} from 'element-plus'
import type { FormInstance, FormRules, UploadFile, UploadRawFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { PostService } from '@/services/PostService'
import http from '@/http';

const router = useRouter()
const userStore = useUserStore()

const postFormRef = ref<FormInstance>()
const postForm = reactive({
  title: '',
  content: '',
})

// Image upload state
const selectedFile = ref<UploadRawFile | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const uploadError = ref<string | null>(null)

// Tag related state
const selectedTags = ref<string[]>([])
interface Tag {
  id: number;
  name: string;
  isFixed?: boolean;
}
const allAvailableTags = ref<Tag[]>([]);
const presetTags = computed(() => {
  return allAvailableTags.value.filter(tag => tag.isFixed === true);
});

const fetchAvailableTags = async () => {
  try {
    const response = await http.get<Tag[]>('/tags'); 
    allAvailableTags.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    ElMessage.error('获取可用标签列表失败');
  }
};

// 其他状态
const isSubmitting = ref(false)
const showPreview = ref(false)

// 表单验证规则
const formRules = reactive<FormRules>({
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在1-100个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 1, max: 5000, message: '内容长度应在1-5000个字符之间', trigger: 'blur' }
  ],
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 图片上传处理
const handleFileChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.status === 'ready') {
    const rawFile = uploadFile.raw
    if (!rawFile) {
      console.error('No raw file found in uploadFile.')
      return
    }

    const isImage = rawFile.type.startsWith('image/')
    const isLt5M = rawFile.size / 1024 / 1024 < 5
    uploadError.value = null // 重置错误

    if (!isImage) {
      ElMessage.error('请上传图片格式文件!')
      return
    }
    if (!isLt5M) {
      ElMessage.error('图片大小不能超过 5MB!')
      return
    }

    // 验证通过
    selectedFile.value = rawFile

    try {
      // 如果存在之前的预览URL，释放它
      if (imagePreviewUrl.value) {
        URL.revokeObjectURL(imagePreviewUrl.value)
      }
      const newPreviewUrl = URL.createObjectURL(rawFile)
      imagePreviewUrl.value = newPreviewUrl
    } catch (e) {
      console.error('Error creating object URL:', e)
      uploadError.value = '生成图片预览失败'
      selectedFile.value = null
      imagePreviewUrl.value = null
    }
  } else if (uploadFile.status === 'fail') {
    ElMessage.error('文件选择失败，请重试')
  }
}

// 移除图片
const removeImage = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  selectedFile.value = null
  imagePreviewUrl.value = null
}

const removeTag = (tag: string) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

// 提交帖子
const submitPost = async () => {
  if (!postFormRef.value) return

  try {
    const valid = await postFormRef.value.validate()
    if (!valid) return

    isSubmitting.value = true

    // 创建FormData
    const formData = new FormData()
    formData.append('title', postForm.title)
    formData.append('content', postForm.content)

    // 添加标签
    if (selectedTags.value.length > 0) {
      selectedTags.value.forEach(tag => {
        formData.append('tags', tag); 
      });
    }

    // 添加图片
    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }

    // 调用服务
    const response = await PostService.createPost(formData)

    ElMessage.success('发布成功!')

    // 跳转到帖子详情页
    router.push({
      name: 'PostDetail',
      params: { id: response.post.id }
    })
  } catch (error: any) {
    console.error('Failed to create post:', error)
    ElMessage.error(error.response?.data?.message || '发布失败')
  } finally {
    isSubmitting.value = false
  }
}

// 检查用户登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录再发布帖子')
    router.push('/login')
  }
  fetchAvailableTags();
})
</script>

<style scoped lang="scss">
.create-post-view {
  padding-bottom: 60px;
}

.page-header {
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  padding: 15px 0;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      font-size: 1.5rem;
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 10px;
    }
  }
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 15px;
}

.post-editor-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.post-form {
  margin-bottom: 30px;
}

.image-uploader {
  width: 100%;

  .el-upload {
    width: 100%;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  .el-icon--upload {
    font-size: 28px;
    color: #8c939d;
    width: 100%;
    height: 100%;
    text-align: center;
  }

  .el-upload__text {
    color: #8c939d;
    font-size: 14px;
    text-align: center;
    margin: 10px 0;

    em {
      color: var(--el-color-primary);
      font-style: normal;
    }
  }
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 7px;
  line-height: normal;
  text-align: center;
}

.image-preview {
  margin-bottom: 20px;

  .el-button {
    margin-top: 10px;
  }
}

.upload-error {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 5px;
}

.tag-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.tag-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.preview-section {
  margin-top: 40px;
  border-top: 1px solid var(--el-border-color-light);
  padding-top: 20px;

  h2 {
    font-size: 1.2rem;
    margin-bottom: 20px;
  }

  .preview-content {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 20px;

    h3 {
      font-size: 1.5rem;
      margin-top: 0;
      margin-bottom: 15px;
    }

    .preview-image {
      margin-bottom: 15px;

      .el-image {
        max-height: 300px;
        width: 100%;
        border-radius: 4px;
      }
    }

    .preview-text {
      white-space: pre-wrap;
      line-height: 1.6;
      margin-bottom: 15px;
    }

    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}
</style>
