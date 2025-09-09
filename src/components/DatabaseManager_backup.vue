<template>
  <div class="database-manager">
    <!-- 头部导航 -->
    <header class="db-header">
      <div class="header-content">
        <h1 class="title">数据管理中心</h1>
        <div class="header-actions">
          <button 
            class="btn btn-outline" 
            @click="refreshStats"
            :disabled="loading"
          >
            <span class="icon">🔄</span>
            刷新统计
          </button>
          <button 
            class="btn btn-primary" 
            @click="showDatabaseInfo = true"
          >
            <span class="icon">ℹ️</span>
            数据库信息
          </button>
        </div>
      </div>
    </header>

    <!-- 统计面板 -->
    <section class="stats-section" v-if="!loading">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon user-icon">👥</div>
          <div class="stat-content">
            <h3>用户管理</h3>
            <div class="stat-number">{{ stats.users.total }}</div>
            <div class="stat-detail">
              活跃: {{ stats.users.active }} | 停用: {{ stats.users.inactive }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon doc-icon">📄</div>
          <div class="stat-content">
            <h3>文档管理</h3>
            <div class="stat-number">{{ stats.documents.total }}</div>
            <div class="stat-detail">
              分类: {{ stats.documents.categories }} | 标签: {{ stats.documents.tags }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon settings-icon">⚙️</div>
          <div class="stat-content">
            <h3>系统设置</h3>
            <div class="stat-number">{{ stats.settings.total }}</div>
            <div class="stat-detail">
              配置项管理
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 主导航标签 -->
    <nav class="main-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-count" v-if="getTabCount(tab.key) > 0">
          {{ getTabCount(tab.key) }}
        </span>
      </button>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <div class="content-container">
        <!-- 用户管理 -->
        <div v-if="activeTab === 'users'" class="tab-content">
          <UserList ref="userList" />
        </div>
        
        <!-- 文档管理 -->
        <div v-if="activeTab === 'documents'" class="tab-content">
          <DocumentList ref="documentList" />
        </div>
        
        <!-- 设置管理 -->
        <div v-if="activeTab === 'settings'" class="tab-content">
          <SettingsList ref="settingsList" />
        </div>
      </div>
    </main>

    <!-- 数据库信息对话框 -->
    <div v-if="showDatabaseInfo" class="modal-overlay" @click="showDatabaseInfo = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>数据库信息</h3>
          <button class="close-btn" @click="showDatabaseInfo = false">×</button>
        </div>
        <div class="modal-body">
          <div class="info-grid" v-if="dbInfo">
            <div class="info-item">
              <label>数据库路径:</label>
              <span class="info-value">{{ dbInfo.path }}</span>
            </div>
            <div class="info-item">
              <label>连接状态:</label>
              <span class="info-value" :class="{ connected: dbInfo.isConnected }">
                {{ dbInfo.isConnected ? '已连接' : '未连接' }}
              </span>
            </div>
            <div class="info-item">
              <label>数据库大小:</label>
              <span class="info-value">{{ formatFileSize(dbInfo.size) }}</span>
            </div>
            <div class="info-item">
              <label>数据表:</label>
              <span class="info-value">{{ dbInfo.tables.join(', ') }}</span>
            </div>
          </div>
          <div v-else class="loading-text">加载中...</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="backupDatabase">备份数据库</button>
          <button class="btn btn-primary" @click="showDatabaseInfo = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <MessageToast ref="messageToast" />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import apiServices from '../services/api'
import UserList from './users/UserList.vue'
import DocumentList from './documents/DocumentList.vue'
import SettingsList from './settings/SettingsList.vue'
import MessageToast from './common/MessageToast.vue'

export default {
  name: 'DatabaseManager',
  components: {
    UserList,
    DocumentList,
    SettingsList,
    MessageToast
  },
  setup() {
    // 响应式数据
    const loading = ref(true)
    const activeTab = ref('users')
    const showDatabaseInfo = ref(false)
    const dbInfo = ref(null)
    
    const stats = reactive({
      users: { total: 0, active: 0, inactive: 0 },
      documents: { total: 0, categories: 0, tags: 0 },
      settings: { total: 0 }
    })

    // 标签页配置
    const tabs = [
      { key: 'users', label: '用户管理', icon: '👥' },
      { key: 'documents', label: '文档管理', icon: '📄' },
      { key: 'settings', label: '设置管理', icon: '⚙️' }
    ]

    // 组件引用
    const messageToast = ref(null)

    // 计算属性
    const getTabCount = computed(() => {
      return (tabKey) => {
        switch (tabKey) {
          case 'users': return stats.users.total
          case 'documents': return stats.documents.total
          case 'settings': return stats.settings.total
          default: return 0
        }
      }
    })

    // 方法
    const loadStatistics = async () => {
      try {
        // 并行加载所有统计数据
        const [userStats, docStats, settingsStats] = await Promise.all([
          apiServices.users.getUserStatistics(),
          apiServices.documents.getDocumentStatistics(),
          apiServices.settings.getSettingsStatistics()
        ])

        Object.assign(stats.users, userStats.data || userStats)
        Object.assign(stats.documents, docStats.data || docStats)
        Object.assign(stats.settings, settingsStats.data || settingsStats)
      } catch (error) {
        console.error('加载统计数据失败:', error)
        showMessage('加载统计数据失败', 'error')
      }
    }

    const loadDatabaseInfo = async () => {
      try {
        const response = await window.electronAPI.database.info()
        dbInfo.value = response.data || response
      } catch (error) {
        console.error('获取数据库信息失败:', error)
        showMessage('获取数据库信息失败', 'error')
      }
    }

    const refreshStats = async () => {
      loading.value = true
      try {
        await loadStatistics()
        showMessage('统计数据已刷新', 'success')
      } catch (error) {
        showMessage('刷新统计数据失败', 'error')
      } finally {
        loading.value = false
      }
    }

    const backupDatabase = async () => {
      try {
        const userDataPath = await window.electronAPI.utils.getUserDataPath()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = `${userDataPath}/backup_${timestamp}.db`
        
        await window.electronAPI.database.backup(backupPath)
        showMessage(`数据库已备份到: ${backupPath}`, 'success')
      } catch (error) {
        console.error('备份数据库失败:', error)
        showMessage('备份数据库失败', 'error')
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const showMessage = (message, type = 'info') => {
      if (messageToast.value) {
        messageToast.value.show(message, type)
      }
    }

    // 生命周期
    onMounted(async () => {
      try {
        await loadStatistics()
        await loadDatabaseInfo()
      } catch (error) {
        console.error('初始化失败:', error)
      } finally {
        loading.value = false
      }
    })

    // 暴露给模板
    return {
      // 数据
      loading,
      activeTab,
      showDatabaseInfo,
      dbInfo,
      stats,
      tabs,
      
      // 引用
      messageToast,
      
      // 计算属性
      getTabCount,
      
      // 方法
      refreshStats,
      backupDatabase,
      formatFileSize,
      showMessage
    }
  }
}
</script>

<style scoped>
.database-manager {
  min-height: 100vh;
  background: #f5f6fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 头部样式 */
.db-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: #4c63d2;
  color: white;
}

.btn-primary:hover {
  background: #3c51c5;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
}

.btn-outline:hover {
  background: rgba(255,255,255,0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 统计面板样式 */
.stats-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.user-icon { background: #e3f2fd; }
.doc-icon { background: #f3e5f5; }
.settings-icon { background: #e8f5e8; }

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-detail {
  font-size: 0.875rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
}

/* 主导航标签样式 */
.main-tabs {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #e0e6ed;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #7f8c8d;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  font-weight: 500;
}

.tab-btn:hover {
  color: #2c3e50;
  background: #f8f9fa;
}

.tab-btn.active {
  color: #4c63d2;
  border-bottom-color: #4c63d2;
  background: white;
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-count {
  background: #4c63d2;
  color: white;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  min-width: 1.5rem;
  text-align: center;
}

.tab-btn.active .tab-count {
  background: #667eea;
}

/* 主内容区域样式 */
.main-content {
  background: white;
  min-height: 60vh;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e6ed;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.5rem;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f2f6;
}

.info-item label {
  font-weight: 500;
  color: #2c3e50;
}

.info-value {
  color: #7f8c8d;
  word-break: break-all;
}

.info-value.connected {
  color: #27ae60;
  font-weight: 500;
}

.loading-text {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e6ed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .main-tabs {
    overflow-x: auto;
    padding-bottom: 1rem;
  }
  
  .tab-btn {
    white-space: nowrap;
  }
  
  .content-container {
    padding: 1rem;
  }
}
</style>