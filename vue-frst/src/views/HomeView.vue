<template>
  <div class="home-view">
    <!-- 1. Hero Section -->
    <section class="hero-section">
      <div class="hero-content container">
        <h1>探索舌尖上的世界</h1>
        <p>发现、分享、品味生活中的每一道佳肴</p>
        <router-link to="/discover">
          <el-button type="primary" size="large" icon="el-icon-search">立即探索美食</el-button>
        </router-link>
      </div>
    </section>

    <!-- 2. 热门推荐 Section -->
    <section class="featured-section container">
      <div class="section-header">
        <h2><el-icon><Star /></el-icon> 热门推荐</h2>
        <router-link to="/discover?filter=featured" class="view-more-link">查看更多推荐 &gt;</router-link>
      </div>
      <div v-if="loadingFeatured" class="loading-indicator">加载中...</div>
      <el-scrollbar v-else-if="featuredPosts.length > 0" class="featured-posts-scrollbar">
        <div class="featured-posts-list">
          <FoodCard v-for="post in featuredPosts" :key="post.id" :post="post" class="featured-post-card" />
        </div>
      </el-scrollbar>
      <el-empty v-else-if="!errorFeatured" description="暂无热门推荐"></el-empty>
      <el-alert v-if="errorFeatured" :title="errorFeatured" type="error" show-icon :closable="false" />
    </section>

    <!-- 3. 最新分享 Section -->
    <section class="latest-section container">
       <div class="section-header">
         <h2><el-icon><ChatLineSquare /></el-icon> 最新分享</h2>
         <router-link to="/discover" class="view-more-link">查看更多分享 &gt;</router-link>
       </div>
       <div v-if="loadingCommunity" class="loading-indicator">加载中...</div>
       <!-- Changed to Horizontal Scroll -->
       <el-scrollbar v-else-if="latestCommunityPosts.length > 0" class="latest-posts-scrollbar">
         <div class="latest-posts-list">
           <FoodCard v-for="post in latestCommunityPosts" :key="post.id" :post="post" class="latest-post-card" />
         </div>
       </el-scrollbar>
       <el-empty v-else-if="!errorCommunity" description="暂无最新分享"></el-empty>
       <el-alert v-if="errorCommunity" :title="errorCommunity" type="error" show-icon :closable="false" />
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ElButton, ElIcon, ElScrollbar, ElEmpty, ElAlert } from 'element-plus';
import { Star, ChatLineSquare, Search as SearchIcon } from '@element-plus/icons-vue'; // Import icons
import FoodCard from '@/components/common/FoodCard.vue'; // Assuming FoodCard component exists
// --- Re-import PostService and types --- 
import { PostService } from '@/services/PostService'; 
import type { PostPreview } from '@/types/models'; 
// --- Keep AdminService for featured showcases --- 
import { AdminService } from '@/services/AdminService'; // Use named import for AdminService
import type { FoodShowcasePreview } from '@/types/models'; // Use correct FoodShowcasePreview type

// --- Helper function to shuffle array (Fisher-Yates) ---
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- State for Featured Posts (Random Food Showcases) ---
const featuredPosts = ref<FoodShowcasePreview[]>([]); // Still FoodShowcasePreview
const loadingFeatured = ref(false);
const errorFeatured = ref<string | null>(null);

// --- State for Latest Community Posts ---
const latestCommunityPosts = ref<PostPreview[]>([]); // Use PostPreview type
const loadingCommunity = ref(false);
const errorCommunity = ref<string | null>(null);

// --- Fetch Featured Posts (Random Food Showcases) ---
const fetchFeaturedPosts = async () => {
  loadingFeatured.value = true;
  errorFeatured.value = null;
  try {
    // Fetch a slightly larger list to randomize from (e.g., 12 items)
    const response = await AdminService.getFoodShowcases({ page: 1, limit: 12 }); 
    // Shuffle the array and take the first 6 (or desired number)
    featuredPosts.value = shuffleArray([...response.items]).slice(0, 6); 
  } catch (err) {
    console.error("[HomeView] Failed to fetch featured posts:", err);
    errorFeatured.value = '加载热门推荐失败';
  } finally {
    loadingFeatured.value = false;
  }
};

// --- Fetch Latest Community Posts ---
const fetchLatestCommunityPosts = async () => {
  loadingCommunity.value = true;
  errorCommunity.value = null;
  try {
    // Fetch latest posts (assuming non-showcase or filter appropriately)
    // Might need to adjust parameters based on PostService implementation
    // e.g., { showcase: false } or rely on default behavior
    const response = await PostService.getAllPosts({ sortBy: 'createdAt', limit: 8 }); 
    latestCommunityPosts.value = response.posts; // Assign posts from response
  } catch (err) {
    console.error("[HomeView] Failed to fetch latest community posts:", err);
    errorCommunity.value = '加载最新分享失败';
  } finally {
    loadingCommunity.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // console.log('[HomeView] Mounted'); // Keep or remove log
  fetchFeaturedPosts();
  fetchLatestCommunityPosts(); // Fetch community posts instead of latest showcases
});
</script>

<style scoped lang="scss">
.home-view {
  padding-bottom: 40px; // Add some padding at the bottom
}

/* --- Hero Section --- */
.hero-section {
  // Existing styles seem okay, maybe adjust background or text
  background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');
  background-size: cover;
  background-position: center;
  padding: 80px 0;
  text-align: center;
  color: #fff;
  margin-bottom: 40px;

  h1 {
    font-size: 3rem;
    margin-bottom: 0.5em;
    font-weight: 700;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 1.5em;
    opacity: 0.9;
  }
}

/* --- Section Styling --- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;

  h2 {
    font-size: 1.6rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #333;
  }

  .view-more-link {
    font-size: 0.9rem;
    color: var(--el-color-primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.featured-section,
.latest-section {
  margin-bottom: 40px;
}

/* --- Featured Posts Scrollbar --- */
.featured-posts-scrollbar {
  width: 100%;
}

.featured-posts-list {
  display: flex;
  gap: 20px; // Space between cards
  padding-bottom: 15px; // Space for scrollbar
}

.featured-post-card {
  flex: 0 0 auto; // Prevent shrinking/growing
  width: 280px; // Set a fixed width for horizontal scroll items
}

/* --- Latest Posts Scrollbar (Similar to Featured) --- */
.latest-posts-scrollbar {
  width: 100%;
}

.latest-posts-list {
  display: flex;
  gap: 20px; // Space between cards
  padding-bottom: 15px; // Space for scrollbar
}

.latest-post-card {
  flex: 0 0 auto; // Prevent shrinking/growing
  width: 280px; // Set a fixed width for horizontal scroll items (match featured or adjust)
}

/* --- Common styles --- */
.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #666;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}
</style>
