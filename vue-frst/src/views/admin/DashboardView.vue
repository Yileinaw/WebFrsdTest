<template>
  <div class="dashboard-view">
    <h2 class="page-title">仪表盘</h2>

    <!-- 加载状态 -->
    <el-row v-if="loading" class="loading-container">
      <el-col :span="24" class="loading-col">
        <el-skeleton :rows="10" animated />
      </el-col>
    </el-row>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="error-alert"
    >
      <!-- 开发环境下显示设置管理员按钮 -->
      <template v-if="isDev && error.includes('权限不足')" #default>
        <div class="mt-2">
          <el-button type="primary" size="small" @click="makeAdmin" :loading="makingAdmin">
            设置为管理员
          </el-button>
          <p class="text-xs mt-1">注意：此功能仅在开发环境下可用</p>
        </div>
      </template>
    </el-alert>

    <!-- 刷新按钮 -->
    <div class="refresh-container">
      <el-button
        type="primary"
        :icon="RefreshRight"
        :loading="loading"
        @click="fetchDashboardStats"
      >
        刷新数据
      </el-button>
    </div>

    <!-- 数据概览卡片 -->
    <el-row v-if="!loading && !error" :gutter="20" class="stat-cards">
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
    <el-row v-if="!loading && !error" :gutter="20" class="chart-row">
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
            <div class="card-header">标签分布</div>
          </template>
          <!-- 添加标签类型选择器 -->
          <el-radio-group v-model="selectedTagType" size="small" style="margin-bottom: 15px;">
            <el-radio-button label="all">全部标签</el-radio-button>
            <el-radio-button label="food">美食标签</el-radio-button>
            <el-radio-button label="post">帖子标签</el-radio-button>
          </el-radio-group>
          <div class="chart-container">
            <v-chart class="chart" :option="tagDistributionOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近内容列表 -->
    <el-row v-if="!loading && !error" class="recent-content-row">
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
  ElRow, ElCol, ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElIcon,
  ElSkeleton, ElAlert, ElMessage, ElRadioGroup, ElRadioButton
} from 'element-plus';
import {
  Picture, Document, User, Star, ArrowUp, ArrowDown, RefreshRight
} from '@element-plus/icons-vue';
import { AdminService } from '@/services/AdminService';
// 自定义日期格式化函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

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
const error = ref('');
const dashboardStats = ref<any>(null);
const selectedTagType = ref('all');
const isDev = import.meta.env.DEV;
const makingAdmin = ref(false);

// 获取仪表盘数据
const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await AdminService.getDashboardStats();
    dashboardStats.value = response;
    console.log('Dashboard stats:', dashboardStats.value);
    // 清除错误信息
    error.value = '';
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    // 设置错误信息
    error.value = err.message || '获取仪表盘数据失败';
    // 初始化空数据
    dashboardStats.value = {
      showcases: { total: 0, growth: 0 },
      users: { total: 0, growth: 0 },
      posts: { total: 0, growth: 0 },
      favorites: { total: 0, growth: 0 },
      contentTrend: [],
      tagDistribution: [],
      recentContent: []
    };
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
  const allTagData = dashboardStats.value?.tagDistribution || [];
  // 根据 selectedTagType 过滤数据
  const filteredTagData = allTagData.filter((tag: any) => {
    if (selectedTagType.value === 'all') {
      return true;
    }
    return tag.type === selectedTagType.value;
  });

  // 如果过滤后没有数据，准备一个空状态的配置
  if (filteredTagData.length === 0) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#909399',
          fontSize: 14
        }
      },
      tooltip: {},
      legend: {},
      series: []
    };
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => { // 添加类型显示
        const { name, value, percent, data } = params;
        const typeLabel = data.type === 'food' ? '美食' : '帖子';
        return `${name} (${typeLabel})<br/>数量: ${value} (${percent}%)`;
      }
    },
    legend: {
      // orient: 'vertical', // 在较少标签时，水平可能更好
      // left: 10,
      type: 'scroll', // 当标签过多时允许滚动
      bottom: 10, // 移到底部
      data: filteredTagData.map((item: any) => item.name)
    },
    series: [
      {
        name: '标签分布',
        type: 'pie',
        radius: ['45%', '65%'], // 调整半径以适应图例
        center: ['50%', '45%'], // 稍微上移以给图例留空间
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
        // 使用过滤后的数据，并传递类型信息给 formatter
        data: filteredTagData.map((item: any) => ({
          name: item.name,
          value: item.count,
          type: item.type // 传递类型
        }))
      }
    ]
  };
});

// 查看内容详情
const viewContent = (row: any) => {
  if (row.type === 'post') {
    router.push(`/posts/${row.id}`);
  } else {
    // 假设美食图片的查看路径
    router.push(`/discover?id=${row.id}`);
  }
};

// 将当前用户设置为管理员（仅开发环境）
const makeAdmin = async () => {
  if (!isDev) return;

  try {
    makingAdmin.value = true;
    const result = await AdminService.makeAdmin();
    ElMessage.success(result.message || '您已被设置为管理员');
    // 清除错误并重新获取数据
    error.value = '';
    await fetchDashboardStats();
  } catch (err: any) {
    ElMessage.error(err.message || '设置管理员失败');
  } finally {
    makingAdmin.value = false;
  }
};

// 添加重试机制
const retryCount = ref(0);
const maxRetries = 3;

const fetchWithRetry = async () => {
  try {
    await fetchDashboardStats();
  } catch (err) {
    if (retryCount.value < maxRetries) {
      retryCount.value++;
      console.log(`重试获取仪表盘数据 (第${retryCount.value}次)`);
      setTimeout(fetchWithRetry, 1000); // 等待1秒后重试
    }
  }
};

onMounted(() => {
  fetchWithRetry();
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

.loading-container {
  margin-bottom: 20px;
}

.error-alert {
  margin-bottom: 20px;

  .mt-2 {
    margin-top: 0.5rem;
  }

  .text-xs {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
}

.refresh-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}
</style>
