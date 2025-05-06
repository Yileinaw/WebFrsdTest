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
      <!-- Loading Indicator / Skeleton Screen -->
      <div v-if="isLoading && foodShowcases.length === 0" class="skeleton-container masonry-container">
        <div v-for="n in 9" :key="n" class="masonry-item skeleton-item">
          <el-skeleton style="width: 100%;" animated>
            <template #template>
              <el-skeleton-item variant="image" style="width: 100%; height: 200px;" />
              <div style="padding: 10px 5px;">
                <el-skeleton-item variant="p" style="width: 70%; margin-bottom: 5px;" />
                <el-skeleton-item variant="text" style="width: 40%;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>
      <!-- Actual Content -->
      <div v-else-if="!isLoading && foodShowcases.length > 0" class="masonry-container">
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
       <el-alert v-if="error && foodShowcases.length === 0" :title="error" type="error" show-icon :closable="false" />
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
import { ElInput, ElButton, ElIcon, ElEmpty, ElAlert, ElSkeleton, ElSkeletonItem } from 'element-plus';
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
  if (index > -1) {
    selectedTags.value.splice(index, 1); // Remove tag
  } else {
    selectedTags.value.push(tagName); // Add tag
  }
  searchQuery.value = ''; // Clear search input when a tag is clicked
  // console.log('[DiscoverView] Selected tags changed:', selectedTags.value);
  fetchFoodShowcases({ tags: selectedTags.value, search: undefined }); // Pass selected tags, explicitly no search
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

// --- API Interaction ---
const fetchFoodShowcases = async (params: { search?: string; tags?: string[] } = {}) => { // Expect tags array
    if (isLoading.value) return;
    if (import.meta.env.DEV) {
        console.log('[DiscoverView] Fetching with params:', params);
    }
    isLoading.value = true;
    error.value = null;
    // console.log(`[DiscoverView] Fetching showcases with params:`, params);

    try {
        // Prepare parameters for the API call
        const finalParams: Record<string, any> = { // Use Record<string, any> for flexibility
            page: 1, // Assuming you might want pagination later
            limit: 100 // Fetch a larger batch for masonry layout
        };

        if (params.search) {
            finalParams.search = params.search;
        }
        // Convert tags array to comma-separated string for backend
        if (params.tags && params.tags.length > 0) {
            finalParams.tags = params.tags.join(','); // Convert array to string
        }

        // Directly use AdminService for fetching
        const response = await AdminService.getFoodShowcases(finalParams);
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
  width: 100%; // Ensure the view takes full width
}

/* --- Hero Section --- */
.hero-section-simplified {
  // Add background image and styles
  background-image: url('https://youimg1.c-ctrip.com/target/100u16000000zgsvpFB4F.jpg'); // Updated URL
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 60px 20px; // Adjust padding as needed
  text-align: center;
  color: #fff; // Ensure text is visible on the background

  .hero-content {
    // max-width: 800px; // Max width for the content within the hero
    // margin: 0 auto; // Center the content
    h1 {
      font-size: 2.8rem; // Adjust font size
      margin-bottom: 15px;
      font-weight: bold;
    }

    p {
      font-size: 1.2rem; // Adjust font size
      margin-bottom: 30px;
    }

    .search-container {
      max-width: 600px;
      margin: 0 auto;
    }
  }
}

/* --- Tags Section --- */
.tags-section {
  padding: 20px 0; // Keep padding for tags section
  text-align: center; // Center the tags

  .tag-button {
    margin: 5px; // Spacing between tags
  }

  .clear-tag-button {
      margin-left: 10px; // Space between tags and clear button
      vertical-align: middle; // Align with buttons
  }
}

/* --- Results Section & Masonry --- */
.results-section {
  padding: 20px 0; // Padding for the results area
}

.skeleton-container .masonry-item {
  background-color: #fff; // Or your card background color
  border: 1px solid #e0e0e0; // Optional: if your cards have borders
}

.masonry-container {
  display: grid; // Ensure grid layout
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); // Responsive columns
  gap: 20px; // Spacing between grid items
  /* Ensure old column styles are definitely removed, not just commented */
}

.masonry-item {
  /* Ensure old break-inside is definitely removed */
  margin-bottom: var(--masonry-gap, 15px); /* Use CSS var for gap */
  position: relative; // Needed for overlay positioning
  overflow: hidden; // Keep overlay contained
  border-radius: 12px; // Slightly larger radius for a softer look
  background-color: #fff; // Ensure card has a background
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05); // Softer, layered shadow
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.07); // Enhanced shadow on hover
  }
}

.food-image {
  display: block; // Remove extra space below image
  width: 100%;
  height: auto; // Maintain aspect ratio
  object-fit: cover; // Cover the area, might crop
  border-radius: 12px 12px 0 0; // Match top corners of the card if overlay is only at bottom
  // If image is the full card, then border-radius: 12px;
  background-color: #f0f0f0; // Placeholder color while image loads
}

.image-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0; // Ensure it spans full width
  padding: 12px 15px; // Increased padding
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0,0,0,0.6) 50%, transparent 100%); // Stronger, taller gradient
  color: white;
  opacity: 0;
  transform: translateY(10px); // Start slightly lower for entry animation
  transition: opacity 0.3s ease, transform 0.3s ease;
  box-sizing: border-box;
  border-bottom-left-radius: 12px; // Match card radius
  border-bottom-right-radius: 12px; // Match card radius

  h4 {
    margin: 0;
    font-size: 0.95rem; // Slightly larger font
    font-weight: 600; // Bolder title
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }
}

.masonry-item:hover .image-info-overlay {
  opacity: 1;
  transform: translateY(0);
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