<template>
  <!-- TEMPORARY DEBUG LOGGING -->
  <!-- {{ console.log(`[FoodCard ID: ${props.post.id}] Input URL: ${props.post.imageUrl}, Output URL: ${getImageUrl(props.post.imageUrl)}`) }} -->
  <div 
    class="food-card" 
    :class="{ 'is-clicked': isClicked }" 
    @click="handleCardClick"
  >
    <!-- 1. Image Container (Structure depends on layout class applied externally) -->
    <div class="card-image-container">
      <el-image 
        :src="getImageUrl(props.post.imageUrl) || defaultPlaceholderImage" 
        :alt="props.post.title" 
        fit="cover" 
        class="food-image"
      >
        <template #error>
          <div class="image-slot-placeholder">
            <el-icon><Picture /></el-icon> 
          </div>
        </template>
        <template #placeholder>
          <div class="image-slot-placeholder">加载中...</div>
        </template>
      </el-image>
    </div>

    <!-- 2. Content Container (Structure depends on layout class applied externally) -->
    <div class="card-content-container">
      <h4>{{ props.post.title }}</h4>
      
      <!-- Display Description with existence check -->
      <p class="card-description" v-if="'description' in props.post && props.post.description"> 
        {{ props.post.description }}
      </p>
      <p class="card-description placeholder" v-else-if="'description' in props.post">
         <!-- Placeholder if description key exists but value is empty -->
      </p>
      <!-- If description key doesn't even exist on the type (like PostPreview), nothing is rendered here by default -->

      <!-- Author Info (always visible if author exists) -->
      <div class="author-info" v-if="'author' in props.post && props.post.author">
        <el-avatar 
          :size="24" 
          :src="getImageUrl((props.post as PostPreview).author?.avatarUrl) || defaultAvatarPlaceholder" 
          class="author-avatar"
        />
        <span class="author-name">{{ (props.post as PostPreview).author?.name || '匿名用户' }}</span>
        <!-- Maybe add post date here later -->
      </div>
    </div>
    
    <!-- Removed Overlay -->

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'; // Removed unused computed import
import { ElImage, ElAvatar, ElIcon } from 'element-plus' // Removed ElCard if not used as root
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
const props = defineProps<{ post: CardData }>()

// Also log within setup for comparison
watchEffect(() => {
    const originalUrl = props.post.imageUrl;
    const resolvedUrl = getImageUrl(originalUrl);
    // console.log(`[FoodCard Setup ID: ${props.post.id}] Input URL: ${originalUrl}, Output URL: ${resolvedUrl}`); // Comment out log
});

const router = useRouter();
const isClicked = ref(false); // State to control click animation class
const animationDuration = 300; // Animation duration in ms

// Handle card click with delayed navigation
const handleCardClick = () => {
    if (isClicked.value) return; // Prevent multiple clicks during animation

    isClicked.value = true;

    // Wait for animation to play before navigating
    setTimeout(() => {
        try {
            if ('author' in props.post) {
                router.push(`/posts/${props.post.id}`); 
            } else {
                router.push({ path: '/discover', hash: `#showcase-${props.post.id}` }); 
            }
        } finally {
             // Reset state after navigation attempt (or slight delay)
            // Use another short timeout to ensure navigation starts before reset visually
            setTimeout(() => {
                isClicked.value = false;
            }, 50); 
        }
    }, animationDuration); 
};

// Keep viewDetails separate if needed for a specific button later
// const viewDetails = () => {
//   emit('view-details', props.post.id)
// }

// Computed property for truncated description (Example)
// const truncatedDescription = computed(() => {
//   const desc = props.post.description || '';
//   const maxLength = 80; // Adjust max length
//   return desc.length > maxLength ? desc.substring(0, maxLength) + '...' : desc;
// });

</script>

<style scoped lang="scss">
// --- Base Card Styles (Common to both layouts) ---
.food-card {
  overflow: hidden;   
  cursor: pointer;
  border-radius: 8px; // Unified radius
  border: 1px solid transparent; // Start transparent, add color on hover/horizontal
  background-color: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; 

  &:hover {
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    border-color: #d0d0d0;
  }
  
  &.is-clicked {
    transform: scale(0.98); // Slightly adjust click scale
    box-shadow: 0 2px 5px rgba(0,0,0,0.08);
  }

  // --- Default (Vertical) Layout Styles ---
  // Image takes full width, content is overlaid or below
  // Let's revert to the overlay approach for default vertical cards
  position: relative; // Needed for overlay
  border-color: transparent; // Vertical cards usually don't have a border

  &:hover {
     box-shadow: 0 6px 12px rgba(0,0,0,0.15); // Original hover shadow for vertical
     border-color: transparent;
  }

  .card-image-container {
      width: 100%; // Default: image container takes full width
      // height: auto; // Height determined by image aspect ratio
  }
  
  .food-image {
    width: 100%;
    height: auto; // Let aspect ratio determine height
    aspect-ratio: 3 / 4; // Default vertical aspect ratio
    display: block;
    background-color: #eee; 
    transition: transform 0.3s ease; 

    .image-slot-placeholder {
      display: flex; justify-content: center; align-items: center;
      width: 100%; height: 100%; 
      background: #f5f7fa; color: var(--el-text-color-secondary);
      font-size: 14px;
      min-height: 150px; // Ensure placeholder has some height
      .el-icon { font-size: 30px; }
    }
  }

   &:hover .food-image {
       transform: scale(1.05); 
   }

  // Use .card-content-container for the overlay in vertical mode
  .card-content-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 12px 15px; 
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%);
    color: #fff;
    opacity: 0;
    transform: translateY(20px); 
    transition: opacity 0.3s ease, transform 0.3s ease;
    box-sizing: border-box;

    h4 {
      margin: 0 0 5px 0; 
      font-size: 1rem; 
      font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
    }
    
    .card-description {
       display: none; // Hide description in overlay by default
    }

    .author-info {
      display: flex;
      align-items: center;
      margin-top: 0;
      
      .author-avatar {
        width: 20px; height: 20px; // Ensure size
        margin-right: 6px;
        border: 1px solid rgba(255, 255, 255, 0.5); 
        flex-shrink: 0; 
      }
      
      .author-name {
        font-size: 0.8rem; 
        color: #eee;      
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    }
  }

  &:hover .card-content-container {
    opacity: 1;
    transform: translateY(0);
  }


  // --- Horizontal Layout Specific Styles (Overrides) ---
  &.horizontal-layout {
    display: flex;
    padding: 12px; 
    gap: 15px; 
    border-color: #e0e0e0; // Add border for horizontal list items
    position: static; // Override absolute positioning for content

    &:hover {
      box-shadow: 0 4px 10px rgba(0,0,0,0.1); // Horizontal hover shadow
      border-color: #d0d0d0;
    }

    .card-image-container {
      flex-basis: 160px; // Increased width for the image area
      flex-shrink: 0;
      height: 120px; // Increased height for the image area
      border-radius: 4px;
      overflow: hidden; 
      width: auto; // Override default width: 100%
    }

    .food-image {
      width: 100%;
      height: 100%; // Make image fill the container
      aspect-ratio: unset; // Remove fixed aspect ratio for horizontal
      transition: none; // No transform on hover for horizontal image?
      
      .image-slot-placeholder {
          min-height: 100px; // Adjust placeholder height
         .el-icon { font-size: 24px; } // Smaller icon
      }
    }
    
    &:hover .food-image {
        transform: none; // Disable scaling on hover for horizontal image
    }

    .card-content-container {
      position: static; // Override absolute positioning
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden; 
      padding: 2px 0; 
      background: none; // Remove gradient background
      color: inherit; // Inherit text color
      opacity: 1; // Always visible
      transform: none; // No transition

      h4 {
        margin: 0 0 4px 0; 
        font-size: 0.95rem; 
        font-weight: 600;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
      }
      
      .card-description {
        display: -webkit-box; // Show description in horizontal layout
        -webkit-line-clamp: 2; 
        line-clamp: 2; // Add standard property for future compatibility
        -webkit-box-orient: vertical;  
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.8rem; 
        color: #555; 
        margin: 0 0 6px 0; 
        flex-grow: 1; 
        line-height: 1.4; 
        min-height: calc(0.8rem * 1.4 * 2); 

        &.placeholder {
            min-height: calc(0.8rem * 1.4 * 2); 
        }
      }

      .author-info {
        display: flex;
        align-items: center;
        margin-top: auto; 
        padding-top: 4px; 
        
        .author-avatar {
           width: 20px; height: 20px; 
           margin-right: 6px;
           border: none; // Remove overlay border
        }
        
        .author-name {
          font-size: 0.75rem; 
          color: #888;      
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      }
    }
    
     &:hover .card-content-container {
         // No special hover effect needed for content in horizontal mode
         opacity: 1;
         transform: none;
     }
  }
}


// Remove old overlay styles that are now incorporated or redundant

</style> 