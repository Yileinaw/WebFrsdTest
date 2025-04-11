<template>
  <div class="food-stats-chart">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-statistic title="总数" :value="props.statsData?.totalCount || 0" />
      </el-col>
      <el-col :span="16">
        <v-chart class="chart" :option="chartOption" autoresize />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import { ElRow, ElCol, ElStatistic } from 'element-plus';

// --- Restore ECharts imports ---
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts'; // Restore VChart import

// Define props
interface StatsData {
  totalCount: number;
  tagsCount: Array<{ name: string; count: number }>;
}
const props = defineProps<{
  statsData: StatsData | null; // Allow null temporarily
}>();

// --- Restore ECharts setup ---
use([
  CanvasRenderer,
  BarChart, // Use BarChart
  // PieChart, // Or use PieChart
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

// Optional: Provide a theme for ECharts
// provide(THEME_KEY, 'dark');

// Compute chart option based on props
const chartOption = computed(() => {
  // Handle potential null prop before accessing tagsCount
  const tagData = props.statsData?.tagsCount || [];

  // Prepare data for Bar Chart
  const xAxisData = tagData.map(tag => tag.name);
  const seriesData = tagData.map(tag => tag.count);

  return {
    title: {
      text: '按标签统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
         interval: 0, // Show all labels
         rotate: 30 // Rotate labels if they overlap
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1 // Ensure y-axis shows integer values
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: seriesData,
        label: {
            show: true,
            position: 'top'
        }
      }
    ]
  };
});

</script>

<style scoped>
.chart {
  height: 300px;
}
</style>