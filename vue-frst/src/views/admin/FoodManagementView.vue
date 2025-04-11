<template>
  <div class="food-management-view">
    <el-row :gutter="20">
      <!-- Left Column: Table and Filters -->
      <el-col :xs="24" :sm="24" :md="15" :lg="15" :xl="15">
        <el-card v-loading="loadingShowcases">
          <template #header>
            <div class="card-header">
              <span>美食图片列表</span>
            </div>
          </template>

          <!-- Filters, Search, and Bulk Actions -->
          <el-row :gutter="20" class="filters-row" style="margin-bottom: 20px;">
            <el-col :span="8">
              <el-input v-model="searchQuery" placeholder="搜索标题或描述" clearable @clear="fetchShowcases()" @keyup.enter="fetchShowcases()" />
            </el-col>
            <el-col :span="8">
              <el-select v-model="selectedTags" multiple filterable placeholder="筛选标签" style="width: 100%;" clearable @change="fetchShowcases()">
                <el-option
                  v-for="tag in availableTags" 
                  :key="tag.id || tag.name" 
                  :label="tag.name"
                  :value="tag.name"
                />
              </el-select>
            </el-col>
             <el-col :span="8" class="bulk-actions-col">
                 <el-button 
                   type="danger" 
                   :disabled="selectedRows.length === 0" 
                   @click="handleBulkDelete"
                 >
                   批量删除 ({{ selectedRows.length }})
                 </el-button>
             </el-col>
          </el-row>

          <!-- Table -->
          <el-table v-if="showcases.length > 0" :data="showcases" style="width: 100%; margin-bottom: 20px;" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="图片" width="100">
               <template #default="{ row }">
                 <el-popover placement="right" trigger="hover" width="auto">
                   <template #reference>
                     <el-image :src="getImageUrl(row.imageUrl)" style="width: 60px; height: 60px; object-fit: cover; display: block; cursor: pointer;" fit="cover" lazy preview-teleported :preview-src-list="[getImageUrl(row.imageUrl)]" />
                   </template>
                   <el-image :src="getImageUrl(row.imageUrl)" style="width: 200px; height: 200px; object-fit: cover;" fit="cover" />
                 </el-popover>
               </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" sortable />
            <el-table-column prop="description" label="描述" :show-overflow-tooltip="true" />
            <el-table-column label="标签">
               <template #default="{ row }">
                 <span v-if="!row.tags || row.tags.length === 0">无</span>
                 <el-popover v-else placement="top" trigger="hover" :width="250">
                   <!-- Content inside the popover: Full list of tags -->
                   <div class="tag-popover-content">
                      <el-tag
                        v-for="tag in row.tags"
                        :key="tag.id + '-popover'" 
                        type="info" 
                        size="small"
                        style="margin: 2px;"
                      >
                        {{ tag.name }}
                      </el-tag>
                   </div>
                   <!-- Reference element: Visible part in the table cell -->
                   <template #reference>
                     <div class="tag-cell-content">
                       <!-- Show first 2 tags -->
                       <el-tag
                         v-for="tag in row.tags.slice(0, 2)"
                         :key="tag.id"
                         type="info" 
                         size="small"
                         style="margin-right: 5px; cursor: pointer;"
                       >
                         {{ tag.name }}
                       </el-tag>
                       <!-- Show '+X' indicator if more than 2 tags -->
                       <el-tag
                         v-if="row.tags.length > 2"
                         type="info"
                         size="small"
                         style="cursor: pointer;"
                       >
                         +{{ row.tags.length - 2 }}
                       </el-tag>
                     </div>
                   </template>
                 </el-popover>
               </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="loadItemForEditing(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else-if="!loadingShowcases" description="暂无匹配的美食图片数据" style="margin-bottom: 20px;"></el-empty>

          <!-- Pagination -->
          <el-pagination
            v-if="totalItems > 0" 
            class="pagination-container"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalItems"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />

        </el-card>

        <!-- Statistics Chart Placeholder (Bottom) - Removed inner card -->
        <Transition name="fade">
          <div v-if="!shouldShowChartInSidebar" class="bottom-stats-container" style="margin-top: 20px;">
            <el-divider /> 
            <h4>统计信息</h4>
            <FoodStatsChart v-if="statsData" :stats-data="statsData" />
            <el-skeleton v-if="loadingStats" :rows="5" animated />
            <el-empty v-if="!loadingStats && !statsData" description="暂无统计数据"></el-empty>
          </div>
        </Transition>

      </el-col>

      <!-- Right Column: Form Panel -->
      <el-col :xs="24" :sm="24" :md="9" :lg="9" :xl="9">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ isEditing ? '编辑美食信息' : '新增美食' }}</span>
               <el-button v-if="isEditing" link @click="prepareNewForm">取消编辑</el-button>
            </div>
          </template>
          <!-- Moved Form Here -->
          <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="80px" label-position="top">
            <el-form-item label="图片" prop="imageFile">
              <el-upload
                 ref="uploadRef"
                 class="image-uploader"
                 action=""
                 :http-request="handleHttpRequest"
                 :show-file-list="false"
                 :auto-upload="false"
                 :on-change="handleFileChange"
                 :before-upload="beforeImageUpload"
               >
                 <img v-if="formModel.imageUrlPreview" :src="formModel.imageUrlPreview" class="preview-image" />
                 <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
                 <template #tip>
                   <div class="el-upload__tip">
                     {{ isEditing ? '点击更换图片 (可选)' : '点击上传图片 (必需)' }}
                     <br/>
                     只支持 jpg/png/gif/webp, 不超过 5MB
                   </div>
                 </template>
               </el-upload>
            </el-form-item>
            <el-form-item label="标题" prop="title">
              <el-input v-model="formModel.title" placeholder="请输入标题" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="formModel.description" type="textarea" placeholder="请输入描述" />
            </el-form-item>
            <el-form-item label="标签" prop="tagNames">
              <el-select
                 v-model="formModel.tagNames"
                 multiple
                 filterable
                 default-first-option
                 placeholder="选择已有标签"
                 style="width: 100%"
                 :loading="loadingTags"
                 placement="top-start"
               >
                 <el-option
                   v-for="tag in availableTags"
                   :key="tag.name"
                   :label="tag.name"
                   :value="tag.name"
                 />
               </el-select>
            </el-form-item>
             <el-form-item>
                <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
                  {{ isEditing ? '保存更新' : '确认新增' }}
                </el-button>
                <el-button @click="prepareNewForm">{{ isEditing ? '取消' : '重置' }}</el-button>
             </el-form-item>
          </el-form>

          <!-- Statistics Chart Placeholder (Sidebar) - Already no inner card -->
          <Transition name="fade">
            <div v-if="shouldShowChartInSidebar" style="margin-top: 30px;">
               <el-divider />
               <h4>统计信息</h4>
               <FoodStatsChart v-if="statsData" :stats-data="statsData" />
               <el-skeleton v-if="loadingStats" :rows="5" animated />
               <el-empty v-if="!loadingStats && !statsData" description="暂无统计数据"></el-empty>
            </div>
          </Transition>

        </el-card>
      </el-col>
    </el-row>

    <!-- Statistics Chart Placeholder (Bottom, outside main row) -->
    <Transition name="fade">
       <el-row v-if="!shouldShowChartInSidebar" style="margin-top: 20px;">
         <!-- This row is only shown when chart is at the bottom -->
         <!-- Consider if this needs responsive adjustment too, perhaps hide on xs/sm if space is tight -->
         <el-col :span="24">
           <el-card>
             <!-- ... bottom chart card content ... -->
           </el-card>
         </el-col>
       </el-row>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import {
    ElCard, ElButton, ElTable, ElTableColumn, ElImage, ElIcon, ElEmpty, ElDialog,
    ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElUpload, ElMessage, ElMessageBox,
    ElPagination, ElPopover, ElStatistic, ElSkeleton, ElDivider, ElTag
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance, FormRules, UploadInstance, UploadProps, UploadRawFile, UploadFile, UploadRequestHandler } from 'element-plus';
import { getImageUrl } from '@/utils/imageUrl';
import { AdminService } from '@/services/AdminService';
import type { FoodShowcasePreview, Tag } from '@/types/models';
import FoodStatsChart from '@/components/admin/FoodStatsChart.vue';
import { useWindowSize } from '@vueuse/core';

// Define types using the base types directly
// interface ShowcaseItem extends FoodShowcasePreview {}
// interface TagItem extends Tag {}

// --- State --- //
const loadingShowcases = ref(false);
const showcases = ref<FoodShowcasePreview[]>([]);
const isEditing = ref(false);
const isSubmitting = ref(false);
const currentEditId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const uploadRef = ref<UploadInstance>();
const availableTags = ref<Tag[]>([]);
const searchQuery = ref('');
const selectedTags = ref<string[]>([]);
const selectedRows = ref<FoodShowcasePreview[]>([]); // State for selected rows

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10); // Default page size
const totalItems = ref(0);

const loadingTags = ref(false); // Add loading state for tags
const statsData = ref<any>(null); // State for statistics data
const loadingStats = ref(false); // Loading state for stats

// Get reactive window size
const { height: windowHeight } = useWindowSize();

const formModel = reactive<{ 
    imageFile: UploadRawFile | null; 
    imageUrlPreview: string | null;
    title: string; 
    description: string; 
    tagNames: string[];
}> ({
    imageFile: null,
    imageUrlPreview: null,
    title: '',
    description: '',
    tagNames: []
});

const formRules = reactive<FormRules>({
  imageFile: [
    { required: true, message: '请选择图片文件', trigger: 'change', validator: (rule, value, cb) => !isEditing.value && !formModel.imageFile ? cb(new Error('请选择图片文件')) : cb() }
  ],
  title: [
    { required: false, message: '请输入标题', trigger: 'blur' }, // Title optional
  ],
   tagNames: [
     { type: 'array', message: '请选择或输入标签', trigger: 'change' }
   ],
});

// --- Updated Computed Property for Chart Position --- //
const shouldShowChartInSidebar = computed(() => {
    const formApproxHeight = 550; // Approximate height of the form section in pixels
    const chartHeight = 320;      // Approximate height of the chart section in pixels (including margins/padding)
    const requiredSidebarHeight = formApproxHeight + chartHeight + 60; // Total estimated height needed + buffer
    const tableBecomesTallThreshold = 20; // Page size when the table is considered tall

    // Move chart to sidebar if: 
    // 1. Page size is large (table is tall)
    // 2. AND Window height is sufficient to display form + chart comfortably in the sidebar
    const isTableTall = pageSize.value >= tableBecomesTallThreshold;
    const hasEnoughSidebarSpace = windowHeight.value > requiredSidebarHeight;

    // console.log(`pageSize: ${pageSize.value}, windowHeight: ${windowHeight.value}, requiredSidebarHeight: ${requiredSidebarHeight}, isTableTall: ${isTableTall}, hasEnoughSidebarSpace: ${hasEnoughSidebarSpace}`);

    return isTableTall && hasEnoughSidebarSpace;
});

// --- Methods --- //
// Fetch tags - Add loading state toggle
const fetchTags = async () => {
  loadingTags.value = true; // Start loading
  try {
    availableTags.value = await AdminService.getAllTags();
  } catch (error) {
    ElMessage.error('获取标签列表失败');
    console.error('[FoodManagementView] Error fetching tags:', error);
  } finally {
    loadingTags.value = false; // End loading
  }
};

// fetchShowcases - Now fetches paginated and filtered data from backend
const fetchShowcases = async () => {
  loadingShowcases.value = true;
  try {
    console.log(`Fetching showcases (page: ${currentPage.value}, limit: ${pageSize.value}, search: ${searchQuery.value || 'N/A'}, tags: ${selectedTags.value.join('|') || 'N/A'}`);
    
    // Call AdminService with current pagination and filter state
    const response = await AdminService.getFoodShowcases({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined, // Send undefined if empty
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined, // Send undefined if empty
      includeTags: true // Always include tags for display
    });
    
    showcases.value = response.items; // Update table data
    totalItems.value = response.totalCount; // Update total count for pagination

  } catch (error) {
    ElMessage.error('获取美食列表失败');
    console.error('[FoodManagementView] Error fetching showcases:', error);
    showcases.value = []; // Clear table on error
    totalItems.value = 0;
  } finally {
    loadingShowcases.value = false;
  }
};

// Reset form function
const resetForm = () => {
    formRef.value?.resetFields();
    formModel.imageFile = null;
    formModel.imageUrlPreview = null;
    formModel.title = '';
    formModel.description = '';
    formModel.tagNames = [];
    uploadRef.value?.clearFiles();
    isEditing.value = false;
    currentEditId.value = null;
};

// Prepare form for a new item
const prepareNewForm = () => {
    resetForm();
    // Optionally focus the first input field
    // nextTick(() => formRef.value?.querySelector('input')?.focus());
};

// Load existing item data into the form for editing
const loadItemForEditing = (row: FoodShowcasePreview) => {
    resetForm();
    isEditing.value = true;
    currentEditId.value = row.id;
    formModel.title = row.title || '';
    formModel.description = row.description || '';
    formModel.tagNames = row.tags ? row.tags.map(tag => tag.name) : [];
    formModel.imageUrlPreview = getImageUrl(row.imageUrl);
    formModel.imageFile = null;

    // Scroll the right panel to the top if necessary
    // This requires careful selector and might need adjustments
    const rightPanelBody = document.querySelector('.el-col:last-child .el-card .el-card__body');
    if (rightPanelBody) rightPanelBody.scrollTop = 0;
};

// Handle file changes in el-upload
const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    if (beforeImageUpload(uploadFile.raw)) {
        formModel.imageFile = uploadFile.raw;
        formModel.imageUrlPreview = URL.createObjectURL(uploadFile.raw);
        formRef.value?.validateField('imageFile');
    } else {
        uploadRef.value?.clearFiles();
    }
  } else {
      formModel.imageFile = null;
      if (!isEditing.value) {
           formModel.imageUrlPreview = null;
      } else {
          const originalItem = showcases.value.find(item => item.id === currentEditId.value);
          if (originalItem) {
              formModel.imageUrlPreview = getImageUrl(originalItem.imageUrl);
          }
      }
  }
};

// Before upload validation
const beforeImageUpload = (rawFile: UploadRawFile) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('图片格式错误! 只支持 JPG/PNG/GIF/WEBP.');
    return false;
  }
  if (rawFile.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB!');
    return false;
  }
  return true;
};

// Custom HTTP request handler
const handleHttpRequest: UploadRequestHandler = (options) => {
  return Promise.resolve();
};

// Handle form submission
const handleSubmit = async () => {
  if (!formRef.value) return;

  // Use try/catch around validate to handle potential promise rejection
  try {
      const valid = await formRef.value.validate(); // Validate returns a promise
      if (valid) {
          isSubmitting.value = true;
          const formData = new FormData();
          formData.append('title', formModel.title);
          formData.append('description', formModel.description);
          formModel.tagNames.forEach(tag => formData.append('tags[]', tag));
          if (formModel.imageFile) {
              formData.append('image', formModel.imageFile);
          }

          try {
              if (isEditing.value && currentEditId.value !== null) {
                  await AdminService.updateFoodShowcase(currentEditId.value, formData);
                  ElMessage.success('更新成功!');
              } else {
                  await AdminService.createFoodShowcase(formData);
                  ElMessage.success('上传成功!');
              }
              resetForm();
              await fetchShowcases(); // Refresh the list
              await fetchStats(); // Refresh stats
          } catch (error: any) {
              ElMessage.error(`操作失败: ${error.message || '请稍后重试'}`);
              console.error('[FoodManagementView] Submit error:', error);
          } finally {
              isSubmitting.value = false;
          }
      } else {
          // Validation failed (handled by form rules messages)
          console.log('Form validation failed');
          ElMessage.warning('请检查表单输入');
      }
  } catch (validationError) {
      // Catch potential promise rejection from validate() if needed
      console.log('Validation check failed or was cancelled', validationError);
      ElMessage.warning('请检查表单输入');
  }
};

// Handle deleting a single item
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个美食图片吗？此操作不可撤销。',
      '确认删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    );
    await AdminService.deleteFoodShowcase(id);
    ElMessage.success('删除成功!');
    await fetchShowcases(); 
    await fetchStats(); // Refresh stats
    if (isEditing.value && currentEditId.value === id) {
        prepareNewForm();
    }
  } catch (error: any) {
    if (typeof error === 'string' && error === 'cancel') { /* User cancelled */ } 
    else { ElMessage.error(`删除失败: ${error?.message || '请稍后重试'}`); }
  }
};

// --- Bulk Actions --- //
const handleSelectionChange = (val: FoodShowcasePreview[]) => {
  selectedRows.value = val;
};

const handleBulkDelete = async () => {
  if (selectedRows.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 项美食图片吗？此操作不可撤销。`,
      '确认批量删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    );
    const idsToDelete = selectedRows.value.map(row => row.id);
    const result = await AdminService.deleteFoodShowcasesBulk(idsToDelete);
    ElMessage.success(`成功批量删除 ${result.count} 项!`);
    await fetchShowcases();
    await fetchStats(); // Refresh stats
    if (isEditing.value && currentEditId.value && idsToDelete.includes(currentEditId.value)) {
        prepareNewForm();
    }
  } catch (error: any) {
      if (typeof error === 'string' && error === 'cancel') { /* User cancelled */ }
      else { ElMessage.error(`批量删除失败: ${error?.message || '请稍后重试'}`); }
  }
};

// --- Pagination Handlers - Now trigger fetchShowcases --- //
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  currentPage.value = 1; // Reset to page 1 when size changes
  fetchShowcases(); // Refetch data with new page size
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchShowcases(); // Refetch data for the new page
};

// --- Fetch Statistics Data --- //
const fetchStats = async () => {
  loadingStats.value = true;
  try {
    console.log('Fetching showcase stats...');
    // Assuming AdminService is updated or create a new method
    // For now, let's assume a method exists or add it to AdminService
    statsData.value = await AdminService.getShowcaseStats(); // Assuming this method exists
  } catch (error) {
    console.error('[FoodManagementView] Error fetching stats:', error);
    statsData.value = null; // Clear stats on error
    // Optionally show an error message
    // ElMessage.error('获取统计数据失败');
  } finally {
    loadingStats.value = false;
  }
};

// --- Lifecycle Hooks --- //
onMounted(() => {
  fetchShowcases(); // Initial fetch with default params
  fetchTags();
  fetchStats(); // Fetch stats on mount
});

// --- Expose methods/refs if needed (usually not necessary with <script setup>) ---

</script>

<style scoped lang="scss">
/* Make main container use flex and occupy viewport height */
.food-management-view {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 50px); /* Adjust 50px based on your header/nav height */
  padding: 20px;
}

/* Allow the main row to grow */
.food-management-view > .el-row {
  flex-grow: 1;
  display: flex; /* Ensure columns work correctly within flex */
}

/* Make right column a flex container */
.el-row > .el-col:nth-child(2) { /* Target the second column (right sidebar) */
  display: flex;
  flex-direction: column;
}

/* Make the card inside the right column grow */
.el-row > .el-col:nth-child(2) > .el-card {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Make the card body inside the right card grow and scroll */
.el-row > .el-col:nth-child(2) > .el-card ::v-deep(.el-card__body) {
  flex-grow: 1;
  overflow-y: auto;
  /* Remove the old fixed height calculation */
  /* height: calc(100vh - 200px); */ 
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  height: 150px; /* Fixed height */
  width: 150px; /* Fixed width */
  display: flex; /* Center content */
  align-items: center;
  justify-content: center;
}

.image-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.el-upload__tip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #999;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tag-cell-content {
  display: flex;
  align-items: center;
}

.tag-popover-content {
  display: flex;
  flex-wrap: wrap;
}

/* Style for bottom stats container if needed */
.bottom-stats-container {
  // background-color: var(--el-bg-color); // Optional: Match card background
  // padding: 20px; // Optional: Add padding if needed
  border-radius: 4px; // Optional: Add subtle rounding
  // border: 1px solid var(--el-border-color-light); // Optional: Add subtle border
}

.bottom-stats-container h4,
.el-col:last-child .el-card h4 { /* Reuse existing style selector for sidebar h4 */
  margin-top: 10px; /* Adjust spacing */
  margin-bottom: 15px;
  font-size: 16px; // Consistent title size
  font-weight: 600;
}

/* Align top edges of the main cards in the row */
.el-row > .el-col > .el-card {
  margin-top: 0;
}

/* Filters Row Optimization */
.filters-row {
  display: flex;
  align-items: center; /* Vertically align items */
}

.bulk-actions-col {
  display: flex;
  justify-content: flex-end; /* Align button to the right */
}

/* Table Margin */
.el-table {
  margin-bottom: 20px; /* Ensure space below table */
}
.el-empty {
  margin-bottom: 20px; /* Ensure space below empty state */
}

/* Pagination Container Style */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 0; /* Remove default top margin if pagination is last element */
}
</style> 