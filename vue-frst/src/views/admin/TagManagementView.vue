<template>
  <div class="tag-management-view">
    <el-card>
        <template #header>
            <div class="card-header">
            <span>标签管理</span>
            <el-button type="primary" @click="openCreateDialog">
                <el-icon style="margin-right: 5px;"><Plus /></el-icon>
                新增标签
            </el-button>
            </div>
        </template>

        <el-table :data="tags" v-loading="isLoading" style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="name" label="标签名称" sortable />

            <el-table-column label="类型" width="120">
                <template #default="{ row }">
                    <el-tag :type="row.isFixed ? 'info' : 'success'">
                        {{ row.isFixed ? '固定' : '自定义' }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="180">
                <template #default="{ row }">
                    <el-button
                        v-if="!row.isFixed"
                        size="small"
                        @click="handleEdit(row)"
                    >
                        编辑
                    </el-button>
                    <el-button
                        v-if="!row.isFixed"
                        size="small"
                        type="danger"
                        @click="handleDelete(row)"
                    >
                        删除
                    </el-button>
                    <span v-if="row.isFixed" style="color: #909399;">-</span>
                </template>
            </el-table-column>
        </el-table>

        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

        <!-- Edit Tag Dialog -->
        <el-dialog v-model="editDialogVisible" title="编辑标签" width="30%" :close-on-click-modal="false">
            <el-form :model="editFormData" ref="editFormRef" label-width="80px">
                <el-form-item label="标签名称" prop="name" :rules="[{ required: true, message: '标签名称不能为空', trigger: 'blur' }]">
                    <el-input v-model="editFormData.name" placeholder="请输入新的标签名称" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                <el-button @click="editDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmEdit">确定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- Create Tag Dialog -->
        <el-dialog v-model="createDialogVisible" title="新增标签" width="30%" :close-on-click-modal="false">
            <el-form :model="createFormData" ref="createFormRef" label-width="80px">
                <el-form-item label="标签名称" prop="name" :rules="[{ required: true, message: '标签名称不能为空', trigger: 'blur' }]">
                    <el-input v-model="createFormData.name" placeholder="请输入新标签名称" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                <el-button @click="createDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmCreate" :loading="isCreating">确定</el-button>
                </span>
            </template>
        </el-dialog>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { 
    ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElAlert, ElMessageBox, 
    ElMessage, ElDialog, ElForm, ElFormItem, ElInput, ElIcon 
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue'; // Import Plus icon
import type { FormInstance } from 'element-plus' 
import { AdminService } from '@/services/AdminService';
import type { Tag } from '@/types/models'; 

const tags = ref<Tag[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// --- State for Edit Dialog ---
const editDialogVisible = ref(false);
const editFormData = reactive({ id: null as number | null, name: '' });
const editingTag = ref<Tag | null>(null);
const editFormRef = ref<FormInstance>();

// --- State for Create Dialog ---
const createDialogVisible = ref(false);
const createFormData = reactive({ name: '' });
const createFormRef = ref<FormInstance>();
const isCreating = ref(false); // Loading state for create button

// --- Data Fetching ---
const fetchTags = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    tags.value = await AdminService.getAllTags();
  } catch (err) {
    console.error('[TagManagementView] Failed to fetch tags:', err);
    error.value = '加载标签列表失败';
    tags.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- Action Handlers ---
const handleEdit = (tag: Tag) => {
  editingTag.value = tag;
  editFormData.id = tag.id ?? null;
  editFormData.name = tag.name;
  editDialogVisible.value = true;
  editFormRef.value?.clearValidate('name'); 
};

const confirmEdit = async () => {
    if (!editFormRef.value) return;
    try {
        await editFormRef.value.validate(); 
        if (editingTag.value && typeof editingTag.value.id === 'number' && editFormData.name !== editingTag.value.name) {
            try {
                await AdminService.updateTag(editingTag.value.id, { name: editFormData.name }); 
                ElMessage.success(`标签 "${editingTag.value.name}" 更新为 "${editFormData.name}" 成功`);
                editDialogVisible.value = false;
                await fetchTags();
            } catch (apiError) {
                console.error('[TagManagementView] Failed to update tag:', apiError);
                const message = (apiError instanceof Error) ? apiError.message : '未知错误';
                ElMessage.error(`更新标签失败: ${message}`);
            }
        } else if (editFormData.name === editingTag.value?.name) {
            ElMessage.info('标签名称未更改');
            editDialogVisible.value = false;
        } else {
            ElMessage.error('无法更新标签，缺少必要信息或 ID 无效');
        }
    } catch (validationError) {
        console.log('Edit form validation failed:', validationError);
    }
};

const handleDelete = async (tag: Tag) => {
  console.log('Attempting to delete tag:', tag);
  try {
    await ElMessageBox.confirm(
        `确定要删除自定义标签 "${tag.name}" 吗？此操作不可逆。`,
        '警告',
        {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
        }
    );
    if (typeof tag.id === 'undefined' || tag.id === null) {
         ElMessage.error('标签 ID 无效，无法删除');
         return;
    }
    await AdminService.deleteTag(tag.id);
    ElMessage.success(`标签 "${tag.name}" 删除成功`);
    await fetchTags();
  } catch (error) {
      if (error === 'cancel') {
          ElMessage.info('已取消删除');
      } else {
          console.error(`[TagManagementView] Failed to delete tag "${tag.name}":`, error);
          const message = (error instanceof Error) ? error.message : '未知错误';
          ElMessage.error(`删除标签 "${tag.name}" 失败: ${message}`);
      }
  }
};

// --- Create Tag Handlers ---
const openCreateDialog = () => {
    createFormData.name = ''; // Reset name
    createDialogVisible.value = true;
    createFormRef.value?.clearValidate('name');
};

const confirmCreate = async () => {
    if (!createFormRef.value) return;
    try {
        // Validate form
        await createFormRef.value.validate();
        
        // Proceed if validation is successful
        isCreating.value = true;
        console.log(`Creating tag with name: ${createFormData.name}`);
        
        try {
            // --- Call API to create --- 
            const newTag = await AdminService.createTag({ name: createFormData.name }); 
            
            ElMessage.success(`标签 "${newTag.name}" 创建成功`); // Use name from response
            createDialogVisible.value = false;
            await fetchTags(); // Refresh list
        
        } catch (apiError) {
             // --- Catch API errors ---
             console.error('[TagManagementView] Failed to create tag:', apiError);
             const message = (apiError instanceof Error) ? apiError.message : '未知错误';
             ElMessage.error(`创建标签失败: ${message}`);
        }

    } catch (validationError) {
        // Catch validation errors
        console.log('Create form validation failed:', validationError);
        // ElMessage might not be needed as form shows errors
    } finally {
        isCreating.value = false;
    }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchTags();
});
</script>

<style scoped lang="scss">
.tag-management-view {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 