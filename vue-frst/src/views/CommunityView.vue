<template>
  <div class="community-view container">
    <!-- 顶部导航和过滤区域 -->
    <section class="community-header">
      <!-- 标签导航 -->
      <div class="tags-nav" v-if="availableTags.length > 0">
        <el-scrollbar>
          <div class="tags-container">
            <el-tag
              v-for="tag in availableTags"
              :key="tag.id"
              :type="selectedTags.includes(tag.name) ? 'primary' : 'info'"
              class="tag-item"
              @click="handleTagClick(tag.name)"
            >
              {{ tag.name }}
            </el-tag>
            <el-button
              v-if="selectedTags.length > 0"
              size="small"
              circle
              :icon="Close"
              class="clear-tags-btn"
              @click="clearTagFilter"
              title="清除标签筛选"
            />
          </div>
        </el-scrollbar>
      </div>

      <!-- 排序和操作区域 -->
      <div class="action-bar">
        <el-tabs v-model="activeTab" class="tabs">
          <el-tab-pane label="最新发布" name="createdAt"></el-tab-pane>
          <el-tab-pane label="热门讨论" name="popular"></el-tab-pane>
          <el-tab-pane label="精选内容" name="featured"></el-tab-pane>
        </el-tabs>

        <div class="right-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索内容"
            prefix-icon="Search"
            clearable
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
            class="search-input"
          />
          <el-button type="primary" :icon="EditPen" @click="openPostEditor">发布分享</el-button>
        </div>
      </div>
    </section>

    <!-- 内容区域 -->
    <section class="posts-list-section">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-skeleton :rows="10" animated />
      </div>

      <!-- 错误状态 -->
      <el-alert v-else-if="error" :title="error" type="error" show-icon :closable="false" />

      <!-- 成功加载数据 -->
      <template v-else>
        <!-- 精选内容 (大卡片) -->
        <div v-if="featuredPosts.length > 0 && activeTab === 'featured'" class="featured-posts">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12" v-for="post in featuredPosts.slice(0, 2)" :key="post.id">
              <EnhancedShareCard
                :post="post"
                :is-featured="true"
                @like="handleLike"
                @comment="openPostDetailModal"
                @favorite="handleFavorite"
                @update:post="handlePostUpdate"
              />
            </el-col>
          </el-row>
        </div>

        <!-- 普通内容 (网格布局) -->
        <div class="regular-posts">
          <el-row :gutter="24">
            <el-col
              v-for="post in displayedPosts"
              :key="post.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="(activeTab === 'featured' && featuredPosts.length > 0) ? 6 : 8"
              :xl="(activeTab === 'featured' && featuredPosts.length > 0) ? 6 : 6"
            >
              <EnhancedShareCard
                :post="post"
                @like="handleLike"
                @comment="openPostDetailModal"
                @favorite="handleFavorite"
                @update:post="handlePostUpdate"
              />
            </el-col>
          </el-row>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="displayedPosts.length === 0"
          description="暂无相关内容，换个筛选条件试试吧！"
        ></el-empty>
      </template>
    </section>

    <!-- Pagination -->
    <!-- *** 修改：更新分页器的 v-if 条件 和属性绑定 *** -->
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

     <!-- *** 引入 PostEditor 组件 *** -->
     <PostEditor v-model:visible="isEditorVisible" @post-created="handlePostCreated" />

     <!-- Add Post Detail Modal -->
     <PostDetailModal
         :post-id="selectedPostId"
         v-model:visible="isModalVisible"
         @postUpdated="handlePostUpdate"
     />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { EditPen, Search, Close } from '@element-plus/icons-vue'
// 引入组件
import EnhancedShareCard from '@/components/common/EnhancedShareCard.vue'
import PostEditor from '@/components/features/PostEditor.vue'
import PostDetailModal from '@/components/common/PostDetailModal.vue'
// 引入服务
import { PostService } from '@/services/PostService'
import { AdminService } from '@/services/AdminService'
// 引入类型
import type { Post, PostPreview, Tag } from '@/types/models'
// 引入工具
import { useUserStore } from '@/stores/modules/user'
import { useRouter } from 'vue-router'
// 引入Element Plus组件
import {
  ElMessage, ElTabs, ElTabPane, ElButton, ElSkeleton, ElAlert,
  ElRow, ElCol, ElEmpty, ElPagination, ElTag, ElScrollbar,
  ElInput
} from 'element-plus'

// --- 状态管理 ---
// 标签和搜索相关
const availableTags = ref<Tag[]>([])
const selectedTags = ref<string[]>([])
const searchQuery = ref('')
const isLoadingTags = ref(false)

// 帖子相关
const activeTab = ref('createdAt')
const posts = ref<PostPreview[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const pagination = reactive({
  currentPage: 1,
  pageSize: 12, // 增加每页显示数量
  total: 0
})

// 编辑器和模态框
const isEditorVisible = ref(false)
const selectedPostId = ref<number | null>(null)
const isModalVisible = ref(false)

// --- 计算属性 ---
// 精选内容
const featuredPosts = computed(() => {
  if (activeTab.value !== 'featured') {
    return posts.value.filter(post => post.isShowcase).slice(0, 4)
  }
  return posts.value.filter(post => post.isShowcase)
})

// 显示的普通内容
const displayedPosts = computed(() => {
  if (activeTab.value === 'featured') {
    // 在精选标签页，显示除了前两个精选外的所有帖子
    const featuredIds = featuredPosts.value.slice(0, 2).map(p => p.id)
    return posts.value.filter(post => !featuredIds.includes(post.id))
  }
  return posts.value
})

// --- 移除模拟数据 ---
/*
const communityPosts = ref([
  { id: 101, userName: '美食探险家', userAvatar: '', time: '15分钟前', content: '这家新开的日料店太惊艳了，海胆寿司入口即化，强烈推荐！', imageUrl: 'https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png', likes: 25, comments: 8 },
  { id: 102, userName: '家常菜爱好者', userAvatar: '', time: '1小时前', content: '分享一个简单的番茄炒蛋教程，新手也能轻松搞定！#家常菜', imageUrl: '', likes: 15, comments: 3 }, // No image
  { id: 103, userName: '甜品控', userAvatar: '', time: '3小时前', content: '自制芒果慕斯蛋糕，颜值和口味都在线！🥭🍰', imageUrl: 'https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png', likes: 58, comments: 12 },
  // Add more posts...
]);
*/

// --- 数据获取函数 ---
// 获取帖子列表
const fetchPosts = async (page: number = 1, options: any = {}) => {
  isLoading.value = true
  error.value = null
  try {
    // 确定排序方式
    const sortBy = options.sortBy || activeTab.value
    const apiSortBy = sortBy === 'popular' ? 'likesCount' :
                     sortBy === 'featured' ? 'createdAt' : sortBy

    // 构建请求参数
    const params: any = {
      page,
      limit: pagination.pageSize,
      sortBy: apiSortBy
    }

    // 添加标签筛选
    if (selectedTags.value.length > 0) {
      params.tags = selectedTags.value
    }

    // 添加搜索查询
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // 添加精选筛选
    if (sortBy === 'featured') {
      params.showcase = true
    }

    const response = await PostService.getAllPosts(params)
    posts.value = response.posts
    pagination.total = response.totalCount || 0
    pagination.currentPage = page
  } catch (err: any) {
    console.error('Failed to fetch posts:', err)
    error.value = '加载帖子失败，请稍后再试。'
    ElMessage.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// 获取标签列表
const fetchTags = async () => {
  isLoadingTags.value = true
  try {
    availableTags.value = await AdminService.getAllTags()
    console.log('[CommunityView] Fetched tags:', availableTags.value)
  } catch (err) {
    console.error('[CommunityView] Failed to fetch tags:', err)
    ElMessage.warning('加载标签失败，但不影响浏览')
  } finally {
    isLoadingTags.value = false
  }
}

// --- 事件处理函数 ---
// 标签点击
const handleTagClick = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index === -1) {
    selectedTags.value.push(tagName)
  } else {
    selectedTags.value.splice(index, 1)
  }
  fetchPosts(1)
}

// 清除标签筛选
const clearTagFilter = () => {
  selectedTags.value = []
  fetchPosts(1)
}

// 搜索处理
const handleSearch = () => {
  fetchPosts(1)
}

// 清除搜索
const handleSearchClear = () => {
  if (searchQuery.value) {
    searchQuery.value = ''
    fetchPosts(1)
  }
}

// 分页处理
const handlePageChange = (newPage: number) => {
  console.log('Current page:', newPage)
  fetchPosts(newPage)
}

// --- 监听变化 ---
watch(activeTab, (newTabName) => {
  fetchPosts(1, { sortBy: newTabName })
})

// --- 初始化 ---
onMounted(() => {
  fetchTags()
  fetchPosts(pagination.currentPage)
})

// --- 获取实例 ---
const userStore = useUserStore();
const router = useRouter();

// --- 修改 openPostEditor 方法，使用路由导航到新页面 ---
const openPostEditor = () => {
    // --- 实现登录检查 ---
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录再发布分享');
      router.push('/login'); // 跳转到登录页
      return;
    }
    // --- 结束登录检查 ---
    console.log('Navigating to post creation page...');
    router.push({ name: 'CreatePost' }); // 导航到新的发布页面
};

// --- 新增处理帖子创建成功的方法 ---
const handlePostCreated = () => {
  console.log('Post created, refreshing list...');
  fetchPosts(1); // 刷新列表并回到第一页
};

// --- 事件处理 (占位) ---
const handleLike = (id: number | string) => {
  console.log('Liked post:', id)
}

// --- Modify handleComment to open modal ---
const openPostDetailModal = (postId: number) => {
    console.log('Opening modal for post in CommunityView:', postId);
    if (typeof postId === 'number') {
        selectedPostId.value = postId;
        isModalVisible.value = true;
    } else {
        console.error('Invalid postId received from ShareCard:', postId);
    }
}
// --- End modify handleComment ---

const handleFavorite = (id: number | string) => {
  console.log('Favorited post:', id)
}

// + Restore handlePostUpdate parameter type to Post
const handlePostUpdate = (updatedPost: Post) => {
  const index = posts.value.findIndex(p => p.id === updatedPost.id);
  if (index !== -1) {
    const existingPreview = posts.value[index];

    existingPreview.title = updatedPost.title;
    existingPreview.content = updatedPost.content ?? null;
    existingPreview.imageUrl = updatedPost.imageUrl ?? null;
    existingPreview.likesCount = updatedPost.likesCount;
    existingPreview.commentsCount = updatedPost.commentsCount;
    existingPreview.favoritesCount = updatedPost.favoritesCount;
    existingPreview.isLiked = updatedPost.isLiked;
    existingPreview.isFavorited = updatedPost.isFavorited;

    posts.value[index] = existingPreview;
  }
};

</script>

<script lang="ts">
export default {
  name: 'CommunityView'
}
</script>

<style scoped lang="scss">
.community-view {
  padding-top: 20px;
  padding-bottom: 40px;
}

.community-header {
  margin-bottom: 24px;

  .tags-nav {
    margin-bottom: 16px;

    .tags-container {
      display: flex;
      align-items: center;
      padding: 8px 0;
      gap: 10px;

      .tag-item {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-2px);
        }
      }

      .clear-tags-btn {
        margin-left: 8px;
      }
    }
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;

    .tabs {
      flex-grow: 1;
    }

    .right-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .search-input {
        width: 200px;
      }
    }
  }
}

.posts-list-section {
  .featured-posts {
    margin-bottom: 32px;
  }

  .regular-posts {
    margin-bottom: 24px;
  }
}

.pagination-section {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.loading-state {
  padding: 20px;
}

// 响应式调整
@media (max-width: 768px) {
  .community-header {
    .action-bar {
      flex-direction: column;
      align-items: stretch;

      .right-actions {
        width: 100%;
        justify-content: space-between;

        .search-input {
          width: 60%;
        }
      }
    }
  }
}
</style>