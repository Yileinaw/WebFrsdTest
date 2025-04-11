<template>
  <div class="under-development">
    <el-empty description="此功能正在开发中..."></el-empty>
  </div>
</template>

<script setup lang="ts">
import { ElEmpty } from 'element-plus';
</script>

<style scoped>
.under-development {
  display: flex;
  justify-content: center;
  align-items: center;
  /* Adjust height based on your layout, considering header/padding */
  /* You might need to inspect the element and adjust this value */
  height: calc(100vh - 120px); 
  /* Removed color/font-size as ElEmpty handles its own styling */
}
</style>