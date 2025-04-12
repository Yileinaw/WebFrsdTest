<template>
  <el-dialog
    :model-value="visible"
    title="编辑帖子"
    width="600px"
    @close="closeModal"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form v-if="editForm" ref="formRef" :model="editForm" :rules="rules" label-position="top">
      <el-form-item label="标题" prop="title">
        <el-input v-model="editForm.title" placeholder="请输入帖子标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="editForm.content"
          type="textarea"
          :rows="5"
          placeholder="请输入帖子内容"
        />
      </el-form-item>
       <el-form-item label="图片 URL (可选)" prop="imageUrl">
         <el-input v-model="editForm.imageUrl" placeholder="输入图片 URL 或留空" />
         <el-image v-if="editForm.imageUrl" :src="resolveStaticAssetUrl(editForm.imageUrl)" fit="contain" style="max-height: 100px; margin-top: 10px;"/>
       </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeModal">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="isSubmitting">
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive, nextTick } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElImage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { Post } from '@/types/models';
import { PostService } from '@/services/PostService';
import { resolveStaticAssetUrl } from '@/utils/urlUtils';

interface Props {
  visible: boolean;
  post: Post | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible', 'postUpdated']);

const formRef = ref<FormInstance>();
const isSubmitting = ref(false);
const editForm = ref<Partial<Post> & { id: number } | null>(null); // Ensure ID is present when not null

// Initialize form when post prop changes
watch(() => props.post, (newPost) => {
  if (newPost) {
    // Create a shallow copy for editing
    editForm.value = {
        id: newPost.id,
        title: newPost.title || '',
        content: newPost.content || '',
        imageUrl: newPost.imageUrl || null
    };
     // Reset validation state when form data changes
     nextTick(() => {
       formRef.value?.clearValidate();
     });
  } else {
    editForm.value = null;
  }
}, { immediate: true });

const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
});

const closeModal = () => {
  emit('update:visible', false);
};

const submitForm = () => { // Removed async from here
  if (!formRef.value || !editForm.value) return; // Guard against null editForm
  const currentForm = editForm.value; // Capture non-null value

  formRef.value.validate(async (valid) => { // Keep async here for await
    if (valid) {
      isSubmitting.value = true;
      try {
         // Prepare data for update
         const updateData: { title?: string; content?: string | null; imageUrl?: string | null } = {
             title: currentForm.title,
             content: currentForm.content,
         };
         if (currentForm.imageUrl) {
            updateData.imageUrl = currentForm.imageUrl;
         } else {
            updateData.imageUrl = null;
         }

        // Use type assertion to bypass stubborn Linter error
        await PostService.updatePost(currentForm.id, updateData as any);
        ElMessage.success('帖子更新成功');
        emit('postUpdated');
        closeModal();
      } catch (error: any) {
        console.error('Failed to update post:', error);
        ElMessage.error(error.response?.data?.message || '更新帖子失败');
      } finally {
        isSubmitting.value = false;
      }
    } else {
      console.log('Form validation failed');
      // return false; // No need to return false from async void callback
    }
  });
};

</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style> 