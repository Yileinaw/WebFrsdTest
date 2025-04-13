<template>
  <el-dialog
    :model-value="visible"
    title="编辑帖子"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
    @closed="resetForm"
    :close-on-click-modal="false"
  >
    <el-form 
      v-if="internalPostData" 
      ref="editFormRef" 
      :model="editFormData" 
      :rules="formRules" 
      label-width="80px"
      v-loading="loading"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="editFormData.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input 
          v-model="editFormData.content" 
          type="textarea" 
          :rows="5" 
          placeholder="请输入内容" 
        />
      </el-form-item>
      <!-- 可以在这里添加标签编辑等 -->
      <!-- 显示当前图片 (暂不支持修改) -->
       <el-form-item label="图片" v-if="internalPostData.imageUrl">
         <el-image 
            style="width: 100px; height: 100px" 
            :src="resolveStaticAssetUrl(internalPostData.imageUrl)" 
            fit="cover"
          />
       </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { PropType } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElImage, vLoading } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { PostService } from '@/services/PostService';
import type { Post } from '@/types/models';
import { resolveStaticAssetUrl } from '@/utils/urlUtils'; // Assuming you have this helper

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  postData: {
    type: Object as PropType<Post | null>,
    default: null,
  },
});

const emit = defineEmits(['update:visible', 'post-updated']);

const editFormRef = ref<FormInstance>();
const loading = ref(false);
const internalPostData = ref<Post | null>(null); // Internal copy to avoid modifying prop directly initially

// Form data needs separate ref for editing
const editFormData = ref({
  title: '',
  content: '',
});

const formRules = ref<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
});

// Watch for the modal becoming visible and the postData changing
watch(() => props.visible, (newVal) => {
  if (newVal && props.postData) {
    internalPostData.value = { ...props.postData }; // Make a copy when modal opens
    editFormData.value.title = props.postData.title || '';
    editFormData.value.content = props.postData.content || '';
     // Reset validation state when modal opens
     nextTick(() => {
        editFormRef.value?.clearValidate();
     });
  }
});

const resetForm = () => {
  internalPostData.value = null;
  editFormData.value.title = '';
  editFormData.value.content = '';
  editFormRef.value?.resetFields(); // Reset form validation and values
};

const submitForm = async () => {
  if (!editFormRef.value || !internalPostData.value) return;

  try {
    const valid = await editFormRef.value.validate();
    if (valid) {
      loading.value = true;
      const postId = internalPostData.value.id;
      const updateData = {
        title: editFormData.value.title,
        content: editFormData.value.content,
        // Add other fields like tagNames if needed
      };

      try {
        const updatedPost = await PostService.updatePost(postId, updateData);
        ElMessage.success('帖子更新成功');
        emit('post-updated', updatedPost); // Emit event with updated data
        emit('update:visible', false); // Close the modal
      } catch (error: any) {
        console.error('Failed to update post:', error);
        ElMessage.error(error.response?.data?.message || '更新帖子失败');
      } finally {
        loading.value = false;
      }
    } else {
      console.log('Form validation failed');
      return false;
    }
  } catch (validationError) {
      // Form validation can reject promise if rules fail async validation
      console.log('Form validation error (catch):', validationError);
  }
};

</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style> 