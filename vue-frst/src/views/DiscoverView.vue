<template>
  <div class="discover-view">
    <!-- 1. Hero Section -->
    <section class="hero-section">
      <div class="hero-content container">
        <h1>探索美食的无限可能</h1>
        <p>发现、分享、品尝，开启你的味蕾之旅</p>
        <div class="hero-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索菜谱、食材、餐厅..."
            size="large"
            clearable
            @keyup.enter="performSearch"
            class="search-input"
          >
            <template #prepend>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="large" @click="performSearch">搜索</el-button>
        </div>
      </div>
    </section>

    <!-- 2. Filter Bar Section -->
    <section class="filter-bar-section sticky-filter-bar">
      <div class="filter-bar-content container">
        <!-- Category Filter -->
        <div class="filter-group">
          <span class="filter-label">分类:</span>
          <el-radio-group v-model="selectedCategory" size="small">
            <el-radio-button label="全部" />
            <el-radio-button label="家常菜" />
            <el-radio-button label="烘焙" />
            <el-radio-button label="饮品" />
            <!-- Add more categories as needed -->
          </el-radio-group>
        </div>

        <!-- Sorting Filter -->
        <div class="filter-group">
           <span class="filter-label">排序:</span>
           <el-radio-group v-model="selectedSort" size="small">
              <el-radio-button label="最新发布" value="latest" />
              <el-radio-button label="最受欢迎" value="popular" />
              <!-- Add more sort options if needed -->
            </el-radio-group>
          <!-- Alternative Select for Sorting -->
          <!-- <el-select v-model="selectedSort" placeholder="排序" size="small" style="width: 120px;">
            <el-option label="最新发布" value="latest" />
            <el-option label="最受欢迎" value="popular" />
          </el-select> -->
        </div>
      </div>
    </section>

    <!-- 3. Results Section -->
    <section class="results-section container">
      <!-- Waterfall Component -->
      <waterfall
        :list="discoverPosts"
        :breakpoints="{
            1200: { // >= 1200px
              rowPerView: 4,
            },
            800: { // >= 800px
              rowPerView: 3,
            },
            500: { // >= 500px
              rowPerView: 2,
            }
          }"
        :width="cardWidth"
        :gutter="15"
        v-if="discoverPosts.length > 0"
      >
        <template #item="{ item, url, index }" >
          <div class="masonry-item" >
             <FoodCard :post="item" />
          </div>
        </template>
      </waterfall>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="loading-indicator">加载中...</div>
      <!-- Empty State -->
      <el-empty v-if="!isLoading && discoverPosts.length === 0 && !error" description="暂无美食分享"></el-empty>
      <!-- Error State -->
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    </section>

  </div>
</template>

<script setup lang="ts">
// Import necessary functions from Vue and other libraries
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'; // Added computed
import { useRoute } from 'vue-router';
import FoodCard from '@/components/common/FoodCard.vue';
import { PostService } from '@/services/PostService';
import type { PostPreview } from '@/types/models';
import { Search } from '@element-plus/icons-vue'; // Import Search icon
// Import the Waterfall component
import { Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css' // Import its styles

// --- Component State Refs ---
const route = useRoute();
const searchQuery = ref('');
const discoverPosts = ref<PostPreview[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const limit = ref(12); // Increase limit slightly for wider grid
const totalCount = ref(0);
const hasMore = ref(true);
const isUnmounted = ref(false);

// --- Filter State Refs ---
const selectedCategory = ref('全部'); // Default category
const selectedSort = ref('latest'); // Default sort order

// --- Waterfall specific calculation ---
const cardWidth = computed(() => {
  // You might need to adjust this based on your layout and desired card width
  return 236; // Example fixed width, adjust as needed
});

// --- API Interaction (fetchDiscoverPosts remains largely the same, but we won't call it initially) ---
const fetchDiscoverPosts = async (
    page: number = 1,
    searchTerm: string = '',
    category: string = '全部',
    sortBy: string = 'latest'
) => {
    if (isLoading.value || (page > 1 && !hasMore.value)) return;
    console.log(`Fetching posts: Page=${page}, Search='${searchTerm}', Category='${category}', SortBy='${sortBy}'`);
    isLoading.value = true;
    error.value = null;
    try {
        const apiParams: { page: number; limit: number; search?: string; category?: string; sortBy?: string } = {
            page: page,
            limit: limit.value,
            sortBy: sortBy,
        };
        if (searchTerm) apiParams.search = searchTerm;
        if (category && category !== '全部') apiParams.category = category;

        const response = await PostService.getAllPosts(apiParams);
        const newPosts = response.posts.map(post => ({
            id: post.id,
            title: post.title,
            imageUrl: post.imageUrl ?? null,
            content: post.content ?? null,
            author: post.author ? {
                id: post.author.id,
                name: post.author.name ?? '匿名用户',
                avatarUrl: post.author.avatarUrl ?? null
            } : null
        }));

        if (page === 1) {
            discoverPosts.value = newPosts;
        } else {
            discoverPosts.value = [...discoverPosts.value, ...newPosts];
        }

        totalCount.value = response.totalCount;
        currentPage.value = page;
        hasMore.value = discoverPosts.value.length < totalCount.value;

    } catch (err: any) {
        console.error("Failed to fetch discover posts:", err);
        error.value = '加载美食列表失败，请稍后再试。';
    } finally {
        isLoading.value = false;
    }
};

// --- Event Handlers & Logic (performSearch, handleScroll remain the same) ---
const performSearch = () => {
    console.log(`Performing search for: "${searchQuery.value}" with filters: Category=${selectedCategory.value}, Sort=${selectedSort.value}`);
    currentPage.value = 1;
    hasMore.value = true;
    discoverPosts.value = [];
    // Scroll to filter bar after search
    const filterBarElement = document.querySelector('.filter-bar-section');
    if (filterBarElement instanceof HTMLElement) {
         window.scrollTo({ top: filterBarElement.offsetTop, behavior: 'smooth' });
    }
    fetchDiscoverPosts(1, searchQuery.value, selectedCategory.value, selectedSort.value);
};

const handleScroll = () => {
    if (isUnmounted.value || isLoading.value || !hasMore.value) return;
    const threshold = 300; // Increase threshold slightly
    const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight >= document.documentElement.offsetHeight - threshold;
    if (bottomOfWindow) {
        console.log("Scroll near bottom, fetching next page...");
        fetchDiscoverPosts(currentPage.value + 1, searchQuery.value, selectedCategory.value, selectedSort.value);
    }
};

// --- Watchers (watch logic remains the same) ---
watch([selectedCategory, selectedSort], (newValues, oldValues) => {
    if (JSON.stringify(newValues) === JSON.stringify(oldValues)) return;
    console.log(`Filters changed: Category=${newValues[0]}, Sort=${newValues[1]}`);
    currentPage.value = 1;
    hasMore.value = true;
    discoverPosts.value = [];
    fetchDiscoverPosts(1, searchQuery.value, newValues[0], newValues[1]);
});

// --- Lifecycle Hooks (onMounted, onUnmounted remain largely the same, adjust initial fetch if needed) ---
onMounted(() => {
    console.log('[DiscoverView] Mounted');
    isUnmounted.value = false;

    if (route.query.search && typeof route.query.search === 'string') {
        searchQuery.value = route.query.search;
        console.log(`Initial search from URL: "${searchQuery.value}"`);
        performSearch();
    } else {
        console.log('Initial fetch without URL search query.');
        fetchDiscoverPosts(1, '', selectedCategory.value, selectedSort.value);
    }
    
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    console.log('[DiscoverView] Unmounting, removing scroll listener.');
    isUnmounted.value = true;
    window.removeEventListener('scroll', handleScroll);
});

</script>

<style scoped lang="scss">
.discover-view {
  background-color: #f8f9fa; // Light background for the whole view
}

// --- 1. Hero Section --- 
.hero-section {
  // Use the provided image URL
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://media.istockphoto.com/id/492301737/zh/%E7%85%A7%E7%89%87/delicious-breakfast.jpg?s=2048x2048&w=is&k=20&c=_k-olo7WGLG-JB36DVgaqq6UsW6g-QKLQpUThBY3Y60=');
  background-size: cover;
  background-position: center;
  padding: 80px 20px; // Add horizontal padding too
  text-align: center;
  color: #fff;

  h1 {
    font-size: 2.8rem;
    font-weight: 700;
    margin-bottom: 15px;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 30px;
    opacity: 0.9;
  }
}

.hero-search {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  gap: 10px;

  .search-input {
    flex-grow: 1;
    // Style the input itself
    :deep(.el-input__wrapper) {
        border-radius: 6px 0 0 6px !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
     :deep(.el-input-group__prepend) {
        background-color: #fff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
         border-radius: 6px 0 0 6px !important;
         padding: 0 15px;
     }
  }

  .el-button {
    border-radius: 0 6px 6px 0 !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }
}


// --- 2. Filter Bar Section --- 
.filter-bar-section {
  background-color: #fff;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
  z-index: 10; // Ensure it stays above content when sticky
}

.sticky-filter-bar {
   position: sticky;
   // Assuming header height is 60px
   top: 60px; // Adjust if your header height is different
   background-color: rgba(255, 255, 255, 0.95); // Slightly transparent when sticky
   backdrop-filter: blur(5px);
   -webkit-backdrop-filter: blur(5px); // For Safari
}

.filter-bar-content {
  display: flex;
  align-items: center;
  justify-content: flex-start; // Align items to the start
  gap: 30px; // Space between filter groups
  flex-wrap: wrap; // Allow wrapping on smaller screens
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px; // Space between label and controls
}

.filter-label {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
  white-space: nowrap; // Prevent label wrapping
}

// Adjust radio button style for filter bar
.filter-bar-section .el-radio-button {
   :deep(.el-radio-button__inner) {
     border-radius: 4px !important;
     border: 1px solid #dcdfe6;
     box-shadow: none;
     padding: 6px 12px;
     font-size: 0.85rem;
     background-color: #f5f7fa; // Lighter background
     transition: all 0.2s ease-in-out;
   }
    &:hover:not(.is-active) {
      :deep(.el-radio-button__inner) {
         border-color: var(--el-color-primary-light-3);
         color: var(--el-color-primary);
         background-color: #fff;
      }
    }
    &.is-active {
       :deep(.el-radio-button__inner) {
        background-color: var(--el-color-primary);
        border-color: var(--el-color-primary);
        color: #fff;
      }
    }
}

// --- 3. Results Section --- 
.results-section {
    padding-top: 30px; // Add some space above the results
    padding-bottom: 50px;
}

.loading-indicator {
    text-align: center;
    padding: 50px;
    color: #909399;
    font-size: 1.1rem;
}

// --- Remove Responsive adjustments temporarily --- 
/*
@media (max-width: 992px) { 
    .masonry-item {
        width: 50%; // Target 2 columns
    }
}

@media (max-width: 768px) { 
    .masonry-item {
        width: 100%; // Target 1 column
    }
}
*/

// --- Responsive adjustments for filter bar & hero --- 
@media (max-width: 768px) {
    .filter-bar-content {
        gap: 15px; // Reduce gap
        padding-left: 15px; // Add padding on small screens
        padding-right: 15px;
        justify-content: center; // Center items when wrapping
    }
    .filter-group {
        margin-bottom: 10px; // Add some space when groups wrap
    }
     .hero-section {
         padding: 60px 20px;
         h1 { font-size: 2.2rem; }
         p { font-size: 1rem; }
     }
     // Adjust sticky top for potentially different header height on mobile
     .sticky-filter-bar {
         top: 50px; // Example: Assuming mobile header is shorter
     }
}

</style> 