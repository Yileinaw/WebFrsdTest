<template>
  <div class="dashboard-view">
    <h2 class="page-title">仪表盘</h2>

    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><Picture /></el-icon>
              <span>美食图片</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ dashboardStats?.showcases?.total || 0 }}</div>
            <div class="stat-trend" :class="{ 'positive': (dashboardStats?.showcases?.growth || 0) > 0, 'negative': (dashboardStats?.showcases?.growth || 0) < 0 }">
              <el-icon v-if="(dashboardStats?.showcases?.growth || 0) > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="(dashboardStats?.showcases?.growth || 0) < 0"><ArrowDown /></el-icon>
              <span>{{ Math.abs(dashboardStats?.showcases?.growth || 0) }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>帖子</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ dashboardStats?.posts?.total || 0 }}</div>
            <div class="stat-trend" :class="{ 'positive': (dashboardStats?.posts?.growth || 0) > 0, 'negative': (dashboardStats?.posts?.growth || 0) < 0 }">
              <el-icon v-if="(dashboardStats?.posts?.growth || 0) > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="(dashboardStats?.posts?.growth || 0) < 0"><ArrowDown /></el-icon>
              <span>{{ Math.abs(dashboardStats?.posts?.growth || 0) }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>用户</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ dashboardStats?.users?.total || 0 }}</div>
            <div class="stat-trend" :class="{ 'positive': (dashboardStats?.users?.growth || 0) > 0, 'negative': (dashboardStats?.users?.growth || 0) < 0 }">
              <el-icon v-if="(dashboardStats?.users?.growth || 0) > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="(dashboardStats?.users?.growth || 0) < 0"><ArrowDown /></el-icon>
              <span>{{ Math.abs(dashboardStats?.users?.growth || 0) }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><Star /></el-icon>
              <span>收藏</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ dashboardStats?.favorites?.total || 0 }}</div>
            <div class="stat-trend" :class="{ 'positive': (dashboardStats?.favorites?.growth || 0) > 0, 'negative': (dashboardStats?.favorites?.growth || 0) < 0 }">
              <el-icon v-if="(dashboardStats?.favorites?.growth || 0) > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="(dashboardStats?.favorites?.growth || 0) < 0"><ArrowDown /></el-icon>
              <span>{{ Math.abs(dashboardStats?.favorites?.growth || 0) }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>内容趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="contentTrendOption" autoresize />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>标签分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="tagDistributionOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近内容列表 -->
    <el-row class="recent-content-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近内容</span>
            </div>
          </template>
          <el-table :data="dashboardStats?.recentContent || []" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'post' ? 'success' : 'primary'">
                  {{ scope.row.type === 'post' ? '帖子' : '美食图片' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="viewContent(scope.row)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ElRow, ElCol, ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElIcon
} from 'element-plus';
import {
  Picture, Document, User, Star, ArrowUp, ArrowDown
} from '@element-plus/icons-vue';
import { AdminService } from '@/services/AdminService';
import { format } from 'date-fns';

// ECharts
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const router = useRouter();
const loading = ref(true);
const dashboardStats = ref<any>(null);

// 获取仪表盘数据
const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await AdminService.getDashboardStats();
    dashboardStats.value = response;
    console.log('Dashboard stats:', dashboardStats.value);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

// 内容趋势图表配置
const contentTrendOption = computed(() => {
  const trend = dashboardStats.value?.contentTrend || [];
  const dates = trend.map((item: any) => item.date);
  const showcases = trend.map((item: any) => item.showcases);
  const posts = trend.map((item: any) => item.posts);

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['美食图片', '帖子']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '美食图片',
        type: 'line',
        data: showcases,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#1890ff'
        },
        itemStyle: {
          color: '#1890ff'
        }
      },
      {
        name: '帖子',
        type: 'line',
        data: posts,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#52c41a'
        },
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  };
});

// 标签分布图表配置
const tagDistributionOption = computed(() => {
  const tagData = dashboardStats.value?.tagDistribution || [];

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: tagData.map((item: any) => item.name)
    },
    series: [
      {
        name: '标签分布',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: tagData.map((item: any) => ({
          name: item.name,
          value: item.count
        }))
      }
    ]
  };
});

// 格式化日期
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
};

// 查看内容详情
const viewContent = (row: any) => {
  if (row.type === 'post') {
    router.push(`/posts/${row.id}`);
  } else {
    // 假设美食图片的查看路径
    router.push(`/discover?id=${row.id}`);
  }
};

onMounted(() => {
  fetchDashboardStats();
});
</script>

<style scoped lang="scss">
.dashboard-view {
  padding: 20px;
}

.page-title {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;

  .card-header {
    display: flex;
    align-items: center;

    .el-icon {
      margin-right: 8px;
      font-size: 18px;
    }
  }

  .card-content {
    display: flex;
    justify-content: space-between;
    align-items: baseline;

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      font-size: 14px;

      &.positive {
        color: #52c41a;
      }

      &.negative {
        color: #f56c6c;
      }

      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  height: 100%;

  .chart-container {
    height: 300px;
  }
}

.chart {
  height: 100%;
  width: 100%;
}

.recent-content-row {
  margin-bottom: 24px;
}
</style>
