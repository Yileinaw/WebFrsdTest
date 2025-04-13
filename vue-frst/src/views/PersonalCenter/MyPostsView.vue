<template>
  <div class="personal-center-view">
    <h2 class="view-title">
      <el-icon><Document /></el-icon> 我的帖子
    </h2>

    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    <el-alert v-else-if="error" :title="error" type="error" show-icon :closable="false" />
    <div v-else>
      <div v-if="myPosts.length > 0" class="posts-grid">
        <!-- Use ShareCard in a grid -->
        <div v-for="post in myPosts" :key="post.id" class="post-card-item">
           <ShareCard :post="post as any" @update:post="handlePostUpdateLocally" />
           <!-- Add Manage Buttons specific to this view -->
           <div class="post-actions-manage">
              <el-button type="primary" link :icon="Edit" @click="openEditModal(post)">编辑</el-button>
              <el-popconfirm
                title="确定要删除这篇帖子吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleDeletePost(post.id)"
              >
                <template #reference>
                  <el-button type="danger" link :icon="Delete">删除</el-button>
                </template>
              </el-popconfirm>
           </div>
        </div>
      </div>
      <el-empty description="你还没有发布任何帖子" v-else />

      <!-- Pagination -->
      <section class="pagination-section" v-if="!isLoading && !error && pagination.total > pagination.pageSize">
         <el-pagination
              background
              layout="prev, pager, next"
              :total="pagination.total"
              :page-size="pagination.pageSize"
              v-model:current-page="pagination.currentPage"
              @current-change="handlePageChange"
          />
      </section>
    </div>

    <!-- Edit Post Modal -->
    <el-dialog 
        v-model="isEditModalVisible"
        title="编辑帖子"
        width="60%"
        :close-on-click-modal="false"
     >
        <el-form v-if="editingPost" :model="editForm" label-width="80px" ref="editFormRef">
            <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '标题不能为空', trigger: 'blur' }]">
                <el-input v-model="editForm.title"></el-input>
            </el-form-item>
            <el-form-item label="内容" prop="content">
                <el-input type="textarea" :rows="5" v-model="editForm.content"></el-input>
            </el-form-item>
            
            <!-- Image Upload Section -->
            <el-form-item label="图片">
                 <!-- Display current image -->
                 <div v-if="editForm.imageUrl" class="current-image-preview">
                     <el-image 
                         :src="resolveStaticAssetUrl(editForm.imageUrl)" 
                         fit="contain" 
                         style="width: 100px; height: 100px; margin-bottom: 10px; border: 1px solid #eee;"
                         :preview-src-list="[resolveStaticAssetUrl(editForm.imageUrl)]"
                         preview-teleported
                         hide-on-click-modal
                     />
                     <el-button type="danger" link @click="removeEditImage">移除图片</el-button>
                 </div>
                 <!-- Upload component -->
                 <el-upload
                    v-else
                    class="image-uploader"
                    action="" 
                    :show-file-list="false"
                    :http-request="handleEditUpload"
                    :before-upload="beforeImageUpload"
                    name="postImage" 
                  >
                     <el-button type="primary">上传图片</el-button>
                     <template #tip>
                       <div class="el-upload__tip">
                         仅限jpg/png格式，大小不超过5MB
                       </div>
                     </template>
                  </el-upload>
                  <!-- Upload progress/error display if needed -->
                  <div v-if="uploadError" style="color: red; font-size: 12px; margin-top: 5px;">{{ uploadError }}</div>
            </el-form-item>

        </el-form>
        <template #footer>
            <span class="dialog-footer">
            <el-button @click="isEditModalVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveEdit" :loading="isSavingEdit">
                保存
            </el-button>
            </span>
        </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { Document, Edit, Delete, Picture } from '@element-plus/icons-vue';
import { ElEmpty, ElSkeleton, ElAlert, ElPagination, ElButton, ElPopconfirm, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElIcon, ElUpload, ElImage } from 'element-plus';
import { PostService } from '@/services/PostService';
import type { Post, PaginatedResponse } from '@/types/models';
import ShareCard from '@/components/common/ShareCard.vue'; // Ensure ShareCard is imported
import { useUserStore } from '@/stores/modules/user'; // For auth token
import http from '@/http'; // For base URL
import { resolveStaticAssetUrl } from '@/utils/urlUtils'; // For image URL
import type { UploadProps, UploadRequestOptions, FormInstance } from 'element-plus'; // Added types

const userStore = useUserStore();
const myPosts = ref<Post[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10, // Adjust as needed
  total: 0
});

// --- Modal States --- 
const isEditModalVisible = ref(false);
const editingPost = ref<Post | null>(null);
const editFormRef = ref<FormInstance>();
const editForm = reactive({
  id: 0,
  title: '',
  content: '',
  imageUrl: null as string | null // Add imageUrl to form
});
const isSavingEdit = ref(false);
const uploadError = ref<string | null>(null); // To show upload errors
// --- End Modal States ---

const fetchMyPosts = async (page: number = 1) => {
    isLoading.value = true;
    error.value = null;
    try {
        const response = await PostService.getMyPosts({ page, limit: pagination.pageSize });

        // Directly assign posts, type assertion will happen in template
        myPosts.value = response.posts || [];

        // Removed attempts to access total count from response due to type errors.
        // TODO: Replace with the correct property from API response (e.g., response.meta.totalCount)
        pagination.total = 0; // Set to 0 temporarily
        pagination.currentPage = page; // Set current page based on request

    } catch (err: any) {
        console.error('Error fetching my posts:', err);
        error.value = err.response?.data?.message || '加载我的帖子列表失败';
        myPosts.value = []; // Ensure posts are empty on error
        pagination.total = 0; // Reset total on error
    } finally {
        isLoading.value = false;
    }
};

const formatTime = (isoString: string): string => {
  if (!isoString) return '未知时间';
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handlePageChange = (newPage: number) => {
    fetchMyPosts(newPage);
};

const handleDeletePost = async (postId: number) => {
    try {
        await PostService.deletePost(postId);
        ElMessage.success('帖子删除成功');
        // Refresh the list after deletion
        // Option 1: Remove from local array (might be tricky with pagination)
        // Option 2: Fetch current page again
        fetchMyPosts(pagination.currentPage);
    } catch (err: any) {
        console.error('Error deleting post:', err);
        ElMessage.error(err.response?.data?.message || '删除帖子失败');
    }
};

// --- Edit Logic --- 
const openEditModal = (post: Post) => {
    editingPost.value = post;
    editForm.id = post.id;
    editForm.title = post.title;
    editForm.content = post.content || '';
    editForm.imageUrl = post.imageUrl || null; // Populate image URL
    uploadError.value = null; // Clear previous upload errors
    isEditModalVisible.value = true;
};

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/');
  const isLt5M = rawFile.size / 1024 / 1024 < 5;
  if (!isImage) {
    ElMessage.error('请上传图片格式文件!');
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!');
  }
  uploadError.value = null; // Clear errors before new upload attempt
  return isImage && isLt5M;
};

const handleEditUpload = async (options: UploadRequestOptions) => {
    const formData = new FormData();
    formData.append('image', options.file); // Use generic 'image' field name
    uploadError.value = null; 
    
    try {
        // Define a separate upload endpoint URL (modify if needed)
        const uploadUrl = `${http.defaults.baseURL}/posts/upload-image`; 
        const response = await http.post<{ message: string; imageUrl: string }>(uploadUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                 Authorization: `Bearer ${userStore.token}`
            }
        });
        editForm.imageUrl = response.data.imageUrl; // Set the received URL to the form
        ElMessage.success('图片上传成功');
    } catch (err: any) {
        console.error("Upload error:", err);
        const errorMsg = err.response?.data?.message || '图片上传失败';
        uploadError.value = errorMsg;
        ElMessage.error(errorMsg); // Use the non-null errorMsg string
        // Manually call onError if el-upload expects it
        // options.onError?.(err);
    }
};

const removeEditImage = () => {
    editForm.imageUrl = null;
    // Optionally, call backend to delete the actual file if needed upon saving
};

const handleSaveEdit = async () => {
    if (!editFormRef.value) return;
    await editFormRef.value.validate(async (valid) => {
        if (valid) {
            isSavingEdit.value = true;
            try {
                const updateData = {
                    title: editForm.title,
                    content: editForm.content,
                    imageUrl: editForm.imageUrl // Send null if image was removed
                };
                const response = await PostService.updatePost(editForm.id, updateData);
                
                // Find the post in the local list and update it
                const index = myPosts.value.findIndex(p => p.id === editForm.id);
                if (index !== -1) {
                    myPosts.value[index] = { ...myPosts.value[index], ...response.post };
                }
                
                ElMessage.success('帖子更新成功');
                isEditModalVisible.value = false;
            } catch (error: any) {
                console.error('Save edit error:', error);
                ElMessage.error(error.response?.data?.message || '更新失败');
            } finally {
                isSavingEdit.value = false;
            }
        }
    });
};

// This function might still be needed if ShareCard emits update even on navigation
// Or if updates happen *within* this view (unlikely now)
const handlePostUpdateLocally = (updatedPost: Post) => {
  const index = myPosts.value.findIndex(p => p.id === updatedPost.id);
  if (index !== -1) {
      myPosts.value[index] = { ...myPosts.value[index], ...updatedPost };
  }
};
// --- End Detail Logic ---

onMounted(() => {
    fetchMyPosts(pagination.currentPage);
});

</script>

<script lang="ts">
export default {
  name: 'MyPostsView'
}
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
    // Optional: Specific icon color
     color: var(--el-color-primary); 
  }
}

.loading-state, .error-state, .el-alert, .el-empty {
  padding: 20px;
  margin-top: 20px; 
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: 20px; 
}

.post-card-item {
  position: relative; 
  border: 1px solid var(--el-border-color-lighter); 
  border-radius: 8px; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column; 

  .share-card { 
      flex-grow: 1; 
      border: none; 
  }

  .post-actions-manage {
      padding: 5px 15px; 
      background-color: #f8f9fa; 
      border-top: 1px solid var(--el-border-color-lighter); 
      display: flex;
      justify-content: flex-end; 
      gap: 10px; 
      flex-shrink: 0; 

      
  }
}

.pagination-section {
    margin-top: 30px;
    display: flex;
    justify-content: center;
}

.image-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.image-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}
.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 7px;
}
.current-image-preview {
    display: flex;
    align-items: center;
    gap: 10px;
}

</style> 