<template>
  <div class="edit-post-view">
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <h1>编辑帖子</h1>
          <div class="actions">
            <el-button @click="goBack">取消</el-button>
            <el-button type="primary" @click="submitPost" :loading="isSubmitting">保存</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="post-editor-container" v-loading="loading">
        <el-form
          v-if="!loading && postForm"
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
            <el-input
              v-if="inputVisible"
              ref="tagInputRef"
              v-model="inputValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput">
              + 添加标签
            </el-button>
            <div class="tag-tip">添加标签可以让更多人发现你的帖子</div>
          </el-form-item>
        </el-form>

        <el-empty v-if="!loading && !postForm" description="找不到帖子或无权编辑">
          <el-button type="primary" @click="goBack">返回</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import {
  ElForm, ElFormItem, ElInput, ElButton, ElMessage,
  ElUpload, ElImage, ElTag, ElIcon, ElEmpty
} from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps, UploadRawFile } from 'element-plus'
import { PostService } from '@/services/PostService'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { resolveStaticAssetUrl } from '@/utils/urlUtils'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const postId = Number(route.params.id)

// 表单相关
const postFormRef = ref<FormInstance>()
const postForm = ref<{
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
} | null>(null)

// 图片上传相关
const selectedFile = ref<UploadRawFile | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const uploadError = ref<string | null>(null)

// 标签相关
const selectedTags = ref<string[]>([])
const inputVisible = ref(false)
const inputValue = ref('')
const tagInputRef = ref<InstanceType<typeof ElInput>>()

// 其他状态
const isSubmitting = ref(false)
const loading = ref(true)

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

// 加载帖子数据
const loadPostData = async () => {
  loading.value = true
  try {
    const response = await PostService.getPostById(postId)

    // 检查是否是帖子作者
    if (response.post.authorId !== userStore.currentUser?.id) {
      ElMessage.error('您没有权限编辑此帖子')
      postForm.value = null
      return
    }

    // 设置表单数据
    postForm.value = {
      id: response.post.id,
      title: response.post.title,
      content: response.post.content ?? '', // Use ?? to provide '' if null
      imageUrl: response.post.imageUrl
    }

    // 设置图片预览
    if (response.post.imageUrl) {
      imagePreviewUrl.value = resolveStaticAssetUrl(response.post.imageUrl)
    }

    // 设置标签
    if (response.post.tags && Array.isArray(response.post.tags)) {
      selectedTags.value = response.post.tags.map(tag => tag.name)
    }
  } catch (error: any) {
    console.error('Failed to load post:', error)
    ElMessage.error(error.response?.data?.message || '加载帖子失败')
    postForm.value = null
  } finally {
    loading.value = false
  }
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
  if (imagePreviewUrl.value && selectedFile.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  selectedFile.value = null
  imagePreviewUrl.value = null

  // 如果是编辑模式且原来有图片，设置imageUrl为null表示要删除图片
  if (postForm.value) {
    postForm.value.imageUrl = null
  }
}

// 标签相关方法
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.input?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value) {
    if (selectedTags.value.length >= 5) {
      ElMessage.warning('最多添加5个标签')
    } else if (selectedTags.value.includes(inputValue.value)) {
      ElMessage.warning('标签已存在')
    } else {
      selectedTags.value.push(inputValue.value)
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

const removeTag = (tag: string) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

// 提交帖子
const submitPost = async () => {
  if (!postFormRef.value || !postForm.value) return

  try {
    const valid = await postFormRef.value.validate()
    if (!valid) return

    isSubmitting.value = true

    // 如果有新上传的图片，使用FormData
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('title', postForm.value.title)
      formData.append('content', postForm.value.content)
      formData.append('image', selectedFile.value)

      // 添加标签
      if (selectedTags.value.length > 0) {
        formData.append('tags', selectedTags.value.join(','))
      }

      await PostService.updatePostWithImage(postForm.value.id, formData)
    } else {
      // 否则使用普通JSON请求
      const updateData = {
        title: postForm.value.title,
        content: postForm.value.content,
        imageUrl: postForm.value.imageUrl,
        tagNames: selectedTags.value
      }

      await PostService.updatePost(postForm.value.id, updateData)
    }

    ElMessage.success('更新成功!')

    // 跳转到帖子详情页
    router.push({
      name: 'PostDetail',
      params: { id: postForm.value.id }
    })
  } catch (error: any) {
    console.error('Failed to update post:', error)
    ElMessage.error(error.response?.data?.message || '更新失败')
  } finally {
    isSubmitting.value = false
  }
}

// 检查用户登录状态并加载帖子数据
onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (isNaN(postId)) {
    ElMessage.error('无效的帖子ID')
    router.push('/')
    return
  }

  loadPostData()
})
</script>

<style scoped lang="scss">
.edit-post-view {
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
  min-height: 400px;
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

.tag-input {
  width: 100px;
  margin-right: 10px;
  vertical-align: bottom;
}

.button-new-tag {
  margin-bottom: 10px;
}

.tag-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
