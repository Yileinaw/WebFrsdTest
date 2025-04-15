<template>
  <div class="discover-view">
    <!-- 1. Hero Section -->
    <section class="hero-section-simplified">
      <div class="hero-content container">
        <h1>探索美食的无限可能</h1>
        <p>发现、分享、品味，开启你的味蕾之旅</p>
        <!-- Re-add Basic Search Bar -->
        <div class="search-container">
          <el-input
            v-model="searchQuery"
            placeholder="搜索美食标题或描述"
            size="large"
            :prefix-icon="SearchIcon"
            clearable
            @keyup.enter="performSearch"
            @clear="handleSearchClear"
          />
          <!-- Optional: Add a separate button if needed -->
          <!-- <el-button type="primary" size="large" @click="performSearch">搜索</el-button> -->
        </div>
      </div>
    </section>

    <!-- 2. Tags Section -->
    <section class="tags-section container">
        <el-button
          v-for="tag in availableTags"
          :key="tag.id"
          round
          :type="selectedTags.includes(tag.name) ? 'primary' : ''"
          class="tag-button"
          @click="handleTagClick(tag.name)"
        >
          {{ tag.name }}
        </el-button>
        <el-button
            v-if="selectedTags.length > 0"
            size="small"
            circle
            :icon="CloseIcon"
            class="clear-tag-button"
            @click="clearTagFilter"
            title="清除标签筛选"
        />
    </section>

    <!-- 3. Results Section (Masonry/CSS Columns) -->
    <section class="results-section container">
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="loading-indicator">加载中...</div>
      <!-- CSS Masonry Container -->
      <div v-if="!isLoading && foodShowcases.length > 0" class="masonry-container">
        <!-- Loop through items, get index -->
        <div
          v-for="(item, index) in foodShowcases"
          :key="item.id"
          :id="`showcase-${item.id}`"
          class="masonry-item"
        >
           <img
             :src="getImageUrl(item.imageUrl)"
             :alt="item.title || '美食图片'"
             class="food-image"
             loading="lazy"
             @click="showLightbox(index)"
             style="cursor: pointer;"
           >
           <!-- Add Info Overlay -->
           <div class="image-info-overlay">
               <h4>{{ item.title || '无标题' }}</h4>
               <!-- Add description preview if available and desired -->
               <!-- <p v-if="item.description">{{ item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '') }}</p> -->
           </div>
        </div>
      </div>
      <!-- Empty State / Error State ... -->
       <el-empty
         v-if="!isLoading && foodShowcases.length === 0 && !error"
         :description="emptyStateDescription"
       />
       <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    </section>

    <!-- Lightbox remains unchanged -->
    <vue-easy-lightbox
      :visible="lightboxVisible"
      :imgs="lightboxImages"
      :index="lightboxIndex"
      @hide="lightboxVisible = false"
    ></vue-easy-lightbox>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
// 使用FoodTagService获取美食标签
import { FoodTagService } from '@/services/FoodTagService';
import { AdminService } from '@/services/AdminService';
// Assume FoodShowcasePreview type exists in models.ts
// Also import Tag type
import type { FoodShowcasePreview, Tag } from '@/types/models';
// Import the Waterfall component
// import { Waterfall } from 'vue-waterfall-plugin-next'
// import 'vue-waterfall-plugin-next/dist/style.css'
import { getImageUrl } from '@/utils/imageUrl'; // Assuming you have a utility for image URLs
// Import vue-easy-lightbox
import VueEasyLightbox from 'vue-easy-lightbox';
import 'vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css'; // Import CSS
// Add necessary Element Plus components
import { ElInput, ElButton, ElIcon, ElEmpty, ElAlert } from 'element-plus';
import { Search as SearchIcon, Close as CloseIcon } from '@element-plus/icons-vue';

const route = useRoute();

// --- Component State Refs ---
const foodShowcases = ref<FoodShowcasePreview[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isLoadingTags = ref(false); // Loading state for tags
const errorTags = ref<string | null>(null); // Error state for tags
// Removed waterfallRef
// const waterfallRef = ref<InstanceType<typeof Waterfall> | null>(null);

// --- Lightbox State ---
const lightboxVisible = ref(false);
const lightboxIndex = ref(0);
const lightboxImages = computed(() => {
  // Ensure getImageUrl handles potential base URL issues gracefully
  return foodShowcases.value.map(item => getImageUrl(item.imageUrl) || '');
});

// --- Search State ---
const searchQuery = ref('');

// --- Active Tag State (Changed to Multi-select) ---
const selectedTags = ref<string[]>([]); // Keep as string array for selected names

// --- Available Tags State (Fetched from backend) ---
// const predefinedTags = ref([...]); // Remove predefined tags
const availableTags = ref<Tag[]>([]); // New state for fetched tags

// --- Computed property for empty state description ---
const emptyStateDescription = computed(() => {
    if (searchQuery.value) {
        return `未能找到与 "${searchQuery.value}" 相关的结果`;
    } else if (selectedTags.value.length > 0) {
        return `未能找到包含标签 "${selectedTags.value.join(', ')}" 的结果`;
    } else {
        return '暂无美食展示'; // Default empty state
    }
});

// --- Watchers ---
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (newValue, oldValue) => {
  // Clear previous debounce timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  if (newValue === '' && oldValue !== '') {
    // Handle clear event immediately (or use handleSearchClear)
    // console.log('Search query cleared, fetching all.');
    handleSearchClear();
  } else if (newValue !== oldValue && newValue !== '') {
    // Set new debounce timer only if value changed and is not empty
    searchDebounceTimer = setTimeout(() => {
      // console.log('Debounced search triggered for:', newValue);
      performSearch();
    }, 500); // Wait 500ms after user stops typing
  }
});

// --- Method to show lightbox ---
const showLightbox = (index: number) => {
  lightboxIndex.value = index;
  lightboxVisible.value = true;
};

// --- Fetch Available Tags from Backend ---
const fetchAvailableTags = async () => {
  isLoadingTags.value = true;
  errorTags.value = null;
  try {
    availableTags.value = await FoodTagService.getAllTags();
    if (import.meta.env.DEV) {
        console.log('[DiscoverView] Fetched available food tags:', availableTags.value);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
        console.error('[DiscoverView] Failed to fetch tags:', err);
    }
    errorTags.value = '加载标签列表失败';
    availableTags.value = []; // Reset on error
  } finally {
    isLoadingTags.value = false;
  }
};

// --- Methods ---
const handleTagClick = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName);
  if (index === -1) {
    selectedTags.value.push(tagName);
  } else {
    selectedTags.value.splice(index, 1);
  }
  searchQuery.value = '';
  fetchFoodShowcases({ tags: selectedTags.value.length > 0 ? selectedTags.value : undefined });
};

const clearTagFilter = () => {
    if (selectedTags.value.length > 0) {
        selectedTags.value = []; // Clear the array
        fetchFoodShowcases({}); // Fetch without tags
    }
};

const performSearch = () => {
  // Debounce logic is now in watch, this function is called after debounce
  // console.log('Performing search for:', searchQuery.value);
  selectedTags.value = []; // Clear tags when searching
  fetchFoodShowcases({ search: searchQuery.value || undefined });
};

// --- Add handler for clearing the search input ---
const handleSearchClear = () => {
  // console.log('Search input cleared, fetching all.'); // Optional log
  // searchQuery is already cleared by el-input
  selectedTags.value = []; // Ensure tags are also cleared
  fetchFoodShowcases({}); // Fetch without search or tags
};

// --- Removed Waterfall specific calculation ---
// const cardWidth = computed(() => 236);

// --- Removed Helper method for image load ---
// const onImageLoad = async () => { ... };

// --- API Interaction ---
const fetchFoodShowcases = async (params: { search?: string; tags?: string[] } = {}) => { // Expect tags array
    if (isLoading.value) return;
    if (import.meta.env.DEV) {
        console.log('[DiscoverView] Fetching with params:', params);
    }
    isLoading.value = true;
    error.value = null;
    try {
        // Call AdminService, request a large limit to simulate fetching "all" for discovery view
        const response = await AdminService.getFoodShowcases({
            search: params.search,
            tags: params.tags, // Pass tags array
            limit: 100, // Request a larger number of items for discovery
            page: 1, // Always fetch the first page for simplicity here
            includeTags: false // Tags might not be needed in discovery view
        });
        if (import.meta.env.DEV) {
            console.log('[DiscoverView] API Response received:', response);
        }
        // Extract items from the paginated response
        foodShowcases.value = response.items;
        if (import.meta.env.DEV) {
            console.log(`[DiscoverView] Successfully fetched ${foodShowcases.value.length} showcases.`);
        }

    } catch (err: any) {
        if (import.meta.env.DEV) {
            console.error("[DiscoverView] Failed to fetch food showcases:", err);
        }
        error.value = '加载美食展示失败，请稍后再试。';
        foodShowcases.value = [];
    } finally {
        isLoading.value = false;
        if (import.meta.env.DEV) {
            console.log(`[DiscoverView] Fetch finished. isLoading: ${isLoading.value}, showcases count: ${foodShowcases.value.length}, error: ${error.value}`);
        }
    }
};

// --- Function to scroll to element ---
const scrollToElement = async (elementId: string) => {
  // Ensure DOM is updated before trying to scroll
  await nextTick();
  const element = document.getElementById(elementId);
  if (element) {
    if (import.meta.env.DEV) {
        console.log(`Scrolling to element: ${elementId}`);
    }
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    if (import.meta.env.DEV) {
        console.warn(`Element with ID ${elementId} not found for scrolling.`);
    }
    }
};

// --- Lifecycle Hooks ---
onMounted(() => {
    if (import.meta.env.DEV) {
        console.log('[DiscoverView] Mounted - Fetching initial data and tags');
    }
    fetchFoodShowcases(); // Initial fetch (no filters)
    fetchAvailableTags(); // Fetch tags from backend

    // Check for hash and scroll after initial data load
    watch(isLoading, (newIsLoading) => {
      if (!newIsLoading && route.hash && route.hash.startsWith('#showcase-')) {
        const elementId = route.hash.substring(1); // Remove #
        scrollToElement(elementId);
      }
    }, { immediate: true }); // Run immediately in case data loads before watch setup
});

// Removed: searchQuery, discoverPosts, currentPage, limit, totalCount, hasMore, isUnmounted
// Removed: selectedCategory, selectedSort
// Removed: fetchDiscoverPosts, performSearch, handleScroll, watchers, onUnmounted scroll logic

</script>

<style scoped lang="scss">
.discover-view {
  background-color: #f8f9fa;
}

/* --- Hero Section --- */
.hero-section-simplified {
  // Adjust styles if needed, example uses existing gradient/image
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/images/food-hero-bg.jpg');
  background-size: cover;
  background-position: center;
  padding: 60px 0; // Reset padding if search bar space is removed
  text-align: center;
  color: #fff;

  h1 {
    font-size: 2.8rem;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  p {
    font-size: 1.1rem;
    margin-bottom: 0; // Removed margin as search is gone
  }
}

/* --- Tags Section --- */
.tags-section {
  padding: 20px 0;
  text-align: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
  position: relative; // For positioning the clear button
}

.tag-button {
  margin: 5px 8px;
}

// Style for the clear tag button
.clear-tag-button {
    margin-left: 15px; // Space from the tags
    // Optional: Adjust position if needed relative to tags
    // position: absolute;
    // right: 0;
    // top: 50%;
    // transform: translateY(-50%);
}

/* --- Results Section & Masonry --- */
.results-section {
  padding-top: 30px;
  padding-bottom: 30px;
}

.masonry-container {
  // Define columns - Adjust count based on screen size via media queries
  column-count: 4; // Default for larger screens
  column-gap: 15px; // Space between columns

  @media (max-width: 1200px) {
    column-count: 3;
  }
  @media (max-width: 768px) {
    column-count: 2;
  }
  @media (max-width: 480px) {
    column-count: 1;
  }
}

.masonry-item {
  /* Ensure items are identifiable and have some margin/padding if needed */
  break-inside: avoid; /* Prevent breaking inside an item */
  margin-bottom: 20px;
  position: relative; /* Needed for overlay */
  overflow: hidden; /* Needed for overlay */
  border-radius: 8px; /* Add rounding */
}

.food-image {
  width: 100%;
  display: block;
  border-radius: 8px; /* Match item rounding */
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* --- Common styles --- */
.container {
  max-width: 1200px; // Or your preferred max width
  margin-left: auto;
  margin-right: auto;
  padding-left: 15px;
  padding-right: 15px;
}

// Remove sticky filter bar styles if they exist globally or were here
// .sticky-filter-bar { ... } removed

// Basic styles for the new search container
.search-container {
  max-width: 600px;
  margin: 30px auto 0 auto;
}

// --- Info Overlay Styles ---
.image-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  box-sizing: border-box;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  h4 {
    margin: 0;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.masonry-item:hover .image-info-overlay {
  opacity: 1;
}

</style>