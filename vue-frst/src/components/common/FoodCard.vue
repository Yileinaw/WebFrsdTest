<template>
  <!-- TEMPORARY DEBUG LOGGING -->
  <!-- {{ console.log(`[FoodCard ID: ${props.post.id}] Input URL: ${props.post.imageUrl}, Output URL: ${getImageUrl(props.post.imageUrl)}`) }} -->
  <el-card shadow="hover" class="food-card" @click="handleCardClick" :body-style="{ padding: '0px' }">
    <el-image 
      :src="getImageUrl(props.post.imageUrl) || defaultPlaceholderImage" 
      :alt="props.post.title" 
      fit="cover" 
      class="food-image"
    >
       <!-- Add fallback slot for error/empty src -->
       <template #error>
         <div class="image-slot-placeholder">
           <el-icon><Picture /></el-icon> 
         </div>
       </template>
        <template #placeholder>
          <div class="image-slot-placeholder">加载中...</div>
        </template>
    </el-image>
    <!-- Info Overlay - Hidden by default, shown on hover -->
    <div class="info-overlay">
      <h4>{{ props.post.title }}</h4>
      <!-- Conditionally show author info only if 'author' property exists -->
      <div class="author-info" v-if="'author' in props.post && props.post.author">
        <el-avatar 
          :size="20" 
          :src="getImageUrl((props.post as PostPreview).author?.avatarUrl) || defaultAvatarPlaceholder" 
          class="author-avatar-overlay"
        />
        <span class="author-name-overlay">{{ (props.post as PostPreview).author?.name || '匿名用户' }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ElCard, ElImage, ElAvatar, ElIcon } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
// Import the default placeholder image (use the actual filename)
import defaultPlaceholderImage from '@/assets/images/default-food.png'; 
// Also use the same default image for the avatar placeholder (CORRECTED PATH)
import defaultAvatarPlaceholder from '@/assets/images/default-food.png'; 
// Import getImageUrl instead of resolveStaticAssetUrl
// import { resolveStaticAssetUrl } from '@/utils/urlUtils';
import { getImageUrl } from '@/utils/imageUrl'; // Import the correct utility
import { useRouter } from 'vue-router'; // Import router for navigation
// import type { FoodShowcasePreview } from '@/types/models'; // Use FoodShowcasePreview instead
import type { PostPreview, FoodShowcasePreview } from '@/types/models'; // Import both types
import { watchEffect } from 'vue'; // Re-enable watchEffect for logging

// --- Define a union type for the post prop --- 
type CardData = PostPreview | FoodShowcasePreview;

// Define props using the union type
// const props = defineProps<{ post: FoodShowcasePreview }>()
const props = defineProps<{ post: CardData }>()

// Also log within setup for comparison
watchEffect(() => {
    const originalUrl = props.post.imageUrl;
    const resolvedUrl = getImageUrl(originalUrl);
    // console.log(`[FoodCard Setup ID: ${props.post.id}] Input URL: ${originalUrl}, Output URL: ${resolvedUrl}`); // Comment out log
});

const router = useRouter();

// Emit an event when view details is clicked (alternative to direct navigation)
// const emit = defineEmits(['view-details'])

// Handle card click to navigate to post detail
const handleCardClick = () => {
    // console.log(`Card clicked, navigating to post ID: ${props.post.id}`); // Comment out log
    // Consider changing the route if FoodShowcase has a different detail view
    router.push(`/posts/${props.post.id}`); 
};

// Keep viewDetails separate if needed for a specific button later
// const viewDetails = () => {
//   emit('view-details', props.post.id)
// }

</script>

<style scoped lang="scss">
.food-card {
  position: relative; // Needed for absolute positioning of overlay
  overflow: hidden;   // Hide overlay overflow
  cursor: pointer;
  border-radius: 8px; // Add some rounding
  // Remove default card padding if body-style didn't work
  // :deep(.el-card__body) {
  //     padding: 0 !important; 
  // }

  .food-image {
    width: 100%;
    height: auto; // Let aspect ratio determine height, or set a fixed height/aspect-ratio
    aspect-ratio: 3 / 4; // Example: Maintain a 3:4 aspect ratio
    display: block;
    background-color: #eee; 
    transition: transform 0.3s ease; // Add transition for hover effect
     .image-slot-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%; // Ensure it fills the parent el-image
      background: #f5f7fa;
      color: var(--el-text-color-secondary);
      font-size: 14px;
      // REMOVED min-height, aspect-ratio on parent should control size
    }
    .el-icon {
        font-size: 30px;
    }
  }

  &:hover .food-image {
      transform: scale(1.05); // Slightly zoom image on hover
  }

  .info-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 12px 15px; // Adjust padding
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%); // Darker gradient from bottom
    color: #fff;
    opacity: 0;
    transform: translateY(20px); // Start slightly lower
    transition: opacity 0.3s ease, transform 0.3s ease;
    box-sizing: border-box;

    h4 {
      margin: 0 0 5px 0; 
      font-size: 1rem; // Slightly smaller title
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis; 
    }
    
    .author-info {
      display: flex;
      align-items: center;
      margin-top: 0; // Remove extra margin
      
      .author-avatar-overlay {
        margin-right: 6px;
        border: 1px solid rgba(255, 255, 255, 0.5); // Lighter border for overlay
        flex-shrink: 0; // Prevent avatar shrinking
      }
      
      .author-name-overlay {
        font-size: 0.8rem; // Smaller author name
        color: #eee;      // Lighter color on dark background
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  &:hover .info-overlay {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 