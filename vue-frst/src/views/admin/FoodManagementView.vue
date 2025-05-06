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
          <!-- Single Item Form -->
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

          <el-divider>批量上传</el-divider>

          <!-- Multiple Image Upload Form -->
          <el-form :model="multipleUploadForm" label-width="80px" label-position="top">
            <el-form-item label="选择图片">
              <el-upload
                ref="multipleUploadRef"
                action=""
                :http-request="handleMultipleHttpRequest"
                :on-change="handleMultipleFileChange"
                :on-remove="handleMultipleFileRemove"
                :before-upload="beforeMultipleUpload"
                :file-list="multipleFileList"
                list-type="picture-card"
                multiple
                :auto-upload="false"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">
                    可选择多张图片 (jpg/png/gif/webp, 单张不超过 5MB)
                  </div>
                </template>
              </el-upload>
            </el-form-item>

            <!-- Optionally add fields for common title/tags for batch upload here -->
            <!--
            <el-form-item label="标题前缀 (可选)">
              <el-input v-model="multipleUploadForm.titlePrefix" placeholder="为上传的图片添加统一前缀"></el-input>
            </el-form-item>
            <el-form-item label="公共标签 (可选)">
               <el-select
                 v-model="multipleUploadForm.commonTags"
                 multiple
                 filterable
                 placeholder="为上传的图片添加统一标签"
                 style="width: 100%"
                 :loading="loadingTags"
               >
                 <el-option
                   v-for="tag in availableTags"
                   :key="tag.name + '-multi'"
                   :label="tag.name"
                   :value="tag.name"
                 />
               </el-select>
            </el-form-item>
            -->

            <el-form-item>
              <el-button type="success" @click="handleMultipleSubmit" :loading="isSubmitting" :disabled="multipleFileList.length === 0">
                 开始上传 ({{ multipleFileList.length }})
              </el-button>
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
    ElPagination, ElPopover, ElStatistic, ElSkeleton, ElDivider, ElTag, ElRow, ElCol
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance, FormRules, UploadInstance, UploadProps, UploadRawFile, UploadFile, UploadRequestHandler, UploadUserFile } from 'element-plus';
import { getImageUrl } from '@/utils/imageUrl';
import { AdminService } from '@/services/AdminService';
import { FoodTagService } from '@/services/FoodTagService'; // 导入美食标签服务
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
const { width } = useWindowSize();

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
const shouldShowChartInSidebar = computed(() => width.value >= 992);

// --- Methods --- //
// Fetch tags - Add loading state toggle
const fetchTags = async () => {
  loadingTags.value = true; // Start loading
  try {
    availableTags.value = await FoodTagService.getAllTags();
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
      tags: selectedTags.value.length > 0 ? selectedTags.value.join(',') : undefined, // Convert to comma-separated string
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
    const result = await AdminService.bulkDeleteFoodShowcases(idsToDelete);
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

// --- Multiple Image Upload State & Methods ---
const multipleUploadRef = ref<UploadInstance>();
// Use UploadUserFile which includes status etc.
const multipleFileList = ref<UploadUserFile[]>([]);
const multipleUploadForm = reactive({
    // You might need additional fields like a common title or tags for batch upload
    // titlePrefix: '',
    // commonTags: [] as string[]
});

const handleMultipleFileChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
    // Keep internal file list synced with el-upload's list
    // Filter out files that failed client-side validation during selection
    multipleFileList.value = uploadFiles.filter(f => f.raw ? beforeMultipleUpload(f.raw) : true);
    // Note: `before-upload` is called *before* adding to the list visually if autoUpload=true,
    // but with autoUpload=false, onChange needs to manage the list based on validation.
};

const handleMultipleFileRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
    multipleFileList.value = uploadFiles;
};

const handleMultipleHttpRequest: UploadRequestHandler = (options) => {
    // We handle the upload manually in handleMultipleSubmit
    return Promise.resolve(true);
};

const beforeMultipleUpload: UploadProps['beforeUpload'] = (rawFile) => {
    // Reuse the single image validation logic
    return beforeImageUpload(rawFile);
    // Note: This validation runs when files are *selected* if autoUpload=false.
    // If a file fails here, it won't trigger onChange for that specific file.
};

const handleMultipleSubmit = async () => {
    if (multipleFileList.value.length === 0) {
        ElMessage.warning('请至少选择一张图片');
        return;
    }

    // Filter out files that are not 'ready' or 'success' (already uploaded/failed client-side)
    const filesToUpload = multipleFileList.value.filter(f => f.status === 'ready' && f.raw);

    if (filesToUpload.length === 0) {
        ElMessage.warning('没有有效的新文件可上传');
        return;
    }

    isSubmitting.value = true; // Use a shared or separate loading state
    ElMessage.info(`开始上传 ${filesToUpload.length} 张图片...`);

    // Option 1: Upload one by one (simpler, shows progress per file)
    let successCount = 0;
    let failCount = 0;

    for (const uploadFile of filesToUpload) {
        if (!uploadFile.raw) continue; // Should not happen due to filter, but good practice

        const formData = new FormData();
        // Generate a default title or leave it to backend if needed
        // Using file name without extension as a simple default title
        const defaultTitle = uploadFile.name.substring(0, uploadFile.name.lastIndexOf('.')) || `上传图片 - ${uploadFile.name}`;
        formData.append('title', defaultTitle);
        formData.append('image', uploadFile.raw);
        // Add common tags or other data if available from multipleUploadForm
        // if (multipleUploadForm.commonTags.length > 0) {
        //     multipleUploadForm.commonTags.forEach(tag => formData.append('tags', tag));
        // }

        try {
            await AdminService.createFoodShowcase(formData);
            successCount++;
            // Optionally remove successful file from list visually
            // multipleUploadRef.value?.handleRemove(uploadFile); // This might interfere with the loop or reactivity
            uploadFile.status = 'success'; // Mark as success
        } catch (error: any) {
            failCount++;
            uploadFile.status = 'fail'; // Mark as fail
            console.error(`Error uploading ${uploadFile.name}:`, error);
            // Mark file as failed in UI? El-upload might do this automatically if http-request fails
            ElMessage.error(`上传 ${uploadFile.name} 失败: ${error.response?.data?.message || '未知错误'}`);
        }
    }

    // Option 2: Batch Upload (Requires Backend Support) - Keep commented out
    /* ... */

    isSubmitting.value = false;

    // Update the visual file list based on success/fail status
    multipleFileList.value = multipleFileList.value.filter(f => f.status !== 'success');

    if (successCount > 0) {
        ElMessage.success(`成功上传 ${successCount} 张图片`);
        currentPage.value = 1; // 设置当前页为 1
        fetchShowcases(); // 调用时不带参数
        fetchStats(); // Refresh stats
    }
    if (failCount === 0 && successCount > 0 && multipleFileList.value.length === 0) {
         // Clear the list only if all uploads were successful
         multipleFileList.value = [];
         multipleUploadRef.value?.clearFiles();
    } else if (failCount > 0) {
        ElMessage.warning(`${failCount} 张图片上传失败，请检查后重试`);
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

// --- Multiple Image Uploader Styles --- //
:deep(.el-upload-list--picture-card) {
    --el-upload-list-picture-card-size: 100px; // Adjust card size
     display: flex; // Use flexbox for better layout
     flex-wrap: wrap; // Allow wrapping
     gap: 8px; // Add gap between items
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
    margin: 0; // Remove default margin if using gap
    width: var(--el-upload-list-picture-card-size); // Ensure item respects size
    height: var(--el-upload-list-picture-card-size);
}

:deep(.el-upload--picture-card) {
     --el-upload-picture-card-size: 100px; // Adjust '+' button size
     width: var(--el-upload-picture-card-size);
     height: var(--el-upload-picture-card-size);
     margin: 0; // Remove default margin if using gap
}
</style>