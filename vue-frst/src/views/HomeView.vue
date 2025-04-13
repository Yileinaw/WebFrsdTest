<template>
  <div class="home-view">
    <!-- 1. Hero Section -->
    <section class="hero-section">
      <div class="hero-content container">
        <h1>探索舌尖上的世界</h1>
        <p>发现、分享、品味生活中的每一道佳肴</p>
        <router-link to="/discover" class="hero-button-link">
          <el-button type="primary" size="large">立即探索美食</el-button>
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
      
      <!-- Replace Scrollbar with Carousel -->
      <el-carousel 
        v-else-if="featuredPosts.length > 0" 
        :interval="5000" 
        type="card" 
        height="350px" 
        arrow="always"
        indicator-position="none"
        class="featured-carousel"
      >
        <el-carousel-item v-for="post in featuredPosts" :key="post.id">
           <!-- Wrap FoodCard in a div for potential styling/sizing -->
           <div class="carousel-card-wrapper">
                <FoodCard :post="post" class="featured-post-card" />
           </div>
        </el-carousel-item>
      </el-carousel>
      
      <el-empty v-else-if="!errorFeatured" description="暂无热门推荐"></el-empty>
      <el-alert v-if="errorFeatured" :title="errorFeatured" type="error" show-icon :closable="false" />
    </section>

    <!-- 3. 最新分享 Section (Vertical List) -->
    <section class="latest-section container">
      <div class="section-header">
        <h2><el-icon><ChatLineSquare /></el-icon> 最新分享</h2>
        <router-link to="/community" class="view-more-link">进入社区 &gt;</router-link>
      </div>
      <div v-if="loadingCommunity" class="loading-indicator">加载中...</div>
      
      <!-- Removed el-scrollbar, use a simple div for vertical list -->
      <div v-else-if="latestCommunityPosts.length > 0" class="latest-posts-list vertical-list">
          <FoodCard 
            v-for="post in latestCommunityPosts" 
            :key="post.id" 
            :post="post" 
            class="latest-post-card horizontal-layout" 
          />
      </div>
      
      <el-empty v-else-if="!errorCommunity" description="暂无最新分享"></el-empty>
      <el-alert v-if="errorCommunity" :title="errorCommunity" type="error" show-icon :closable="false" />
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ElIcon, ElEmpty, ElAlert, ElCarousel, ElCarouselItem } from 'element-plus';
import { Star, ChatLineSquare } from '@element-plus/icons-vue';
import FoodCard from '@/components/common/FoodCard.vue';
import { PostService } from '@/services/PostService';
import type { PostPreview, FoodShowcasePreview } from '@/types/models';
import { AdminService } from '@/services/AdminService';

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const featuredPosts = ref<FoodShowcasePreview[]>([]);
const loadingFeatured = ref(false);
const errorFeatured = ref<string | null>(null);
const latestCommunityPosts = ref<PostPreview[]>([]);
const loadingCommunity = ref(false);
const errorCommunity = ref<string | null>(null);

const fetchFeaturedPosts = async () => {
  loadingFeatured.value = true;
  errorFeatured.value = null;
  try {
    const response = await AdminService.getFoodShowcases({ page: 1, limit: 12 });
    featuredPosts.value = shuffleArray([...response.items]).slice(0, 6);
  } catch (err) {
    console.error("[HomeView] Failed to fetch featured posts:", err);
    errorFeatured.value = '加载热门推荐失败';
  } finally {
    loadingFeatured.value = false;
  }
};

const fetchLatestCommunityPosts = async () => {
  loadingCommunity.value = true;
  errorCommunity.value = null;
  try {
    const response = await PostService.getAllPosts({ sortBy: 'createdAt', limit: 4 });
    latestCommunityPosts.value = response.posts;
  } catch (err) {
    console.error("[HomeView] Failed to fetch latest community posts:", err);
    errorCommunity.value = '加载最新分享失败';
  } finally {
    loadingCommunity.value = false;
  }
};

onMounted(() => {
  fetchFeaturedPosts();
  fetchLatestCommunityPosts();
});
</script>

<style scoped lang="scss">
.home-view {
  padding-bottom: 40px;
}

/* --- Hero Section --- */
.hero-section {
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

.featured-carousel {
  margin: 0 -10px;
  
  .el-carousel__item {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .carousel-card-wrapper {
      width: 90%; 
      height: 100%; 
      display: flex;
      justify-content: center;
  }

  .featured-post-card {
     width: 100%; 
     height: 100%; 
     box-shadow: 0 2px 12px rgba(0,0,0,0.1); 
  }

  :deep(.el-carousel__arrow) {
      background-color: rgba(31, 45, 61, 0.6); 
      &:hover {
         background-color: rgba(31, 45, 61, 0.8);
      }
  }
}

/* --- Latest Posts Section - Vertical List Styles --- */
.latest-section {
   margin-bottom: 30px; 
}

.latest-posts-list.vertical-list {
  display: flex;          
  flex-direction: column;
  gap: 25px;             
}

.latest-post-card {
  width: 100%;
}

/* Add style for the router-link containing the button */
.hero-button-link {
  display: inline-block; /* Ensure it behaves correctly with text-align: center */
  margin-top: 1em; /* Add some space above the button */
}
</style>
