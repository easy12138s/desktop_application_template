<template>
  <div class="settings-list">
    <!-- 头部操作区 -->
    <div class="settings-header">
      <div class="header-left">
        <h2>系统设置</h2>
        <span class="item-count">共 {{ totalCount }} 项设置</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showCreateForm">
          <span class="icon">➕</span>
          新增设置
        </button>
      </div>
    </div>

    <!-- 搜索和过滤区 -->
    <div class="filter-section">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索设置项..."
          class="search-input"
          @input="performSearch"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="loadSettings" class="btn btn-outline">重新加载</button>
    </div>

    <!-- 设置列表 -->
    <div v-else-if="settings.length > 0" class="settings-container">
      <div class="settings-grid">
        <div
          v-for="setting in settings"
          :key="setting.key"
          class="setting-card"
        >
          <div class="setting-header">
            <h3 class="setting-key">{{ setting.key }}</h3>
            <div class="setting-type">{{ setting.data_type }}</div>
          </div>
          
          <div class="setting-content">
            <div class="setting-value">
              <strong>当前值:</strong>
              <span class="value-display">{{ formatValue(setting.value, setting.data_type) }}</span>
            </div>
            <p v-if="setting.description" class="setting-description">
              {{ setting.description }}
            </p>
          </div>
          
          <div class="setting-meta">
            <span class="update-time">
              更新时间: {{ formatDate(setting.updated_at) }}
            </span>
          </div>
          
          <div class="setting-actions">
            <button 
              @click="editSetting(setting)" 
              class="btn btn-sm btn-outline"
              title="编辑"
            >
              ✏️ 编辑
            </button>
            <button 
              @click="deleteSetting(setting)" 
              class="btn btn-sm btn-danger"
              title="删除"
            >
              🗑️ 删除
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination">
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="btn btn-sm btn-outline"
          >
            上一页
          </button>
          
          <span class="page-info">
            第 {{ currentPage }} 页，共 {{ totalPages }} 页
          </span>
          
          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="btn btn-sm btn-outline"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-container">
      <div class="empty-icon">⚙️</div>
      <h3>暂无设置项</h3>
      <p>点击上方按钮创建第一个设置项</p>
    </div>

    <!-- 设置表单弹窗 -->
    <SettingForm
      v-if="showForm"
      :setting="selectedSetting"
      @close="closeForm"
      @save="handleSave"
    />

    <!-- 确认删除弹窗 -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      title="确认删除"
      :message="`确定要删除设置项 '${deleteTarget?.key}' 吗？此操作不可撤销。`"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- 消息提示 -->
    <MessageToast
      v-if="message.show"
      :type="message.type"
      :message="message.text"
      @close="clearMessage"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import SettingForm from './SettingForm.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import MessageToast from '../common/MessageToast.vue'
import { settingsApiService } from '../../services/api/SettingsApiService'

export default {
  name: 'SettingsList',
  components: {
    SettingForm,
    ConfirmDialog,
    MessageToast
  },
  setup() {
    // 响应式数据
    const settings = ref([])
    const loading = ref(false)
    const error = ref(null)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalCount = ref(0)
    
    // 表单相关
    const showForm = ref(false)
    const selectedSetting = ref(null)
    
    // 删除确认
    const showDeleteDialog = ref(false)
    const deleteTarget = ref(null)
    
    // 消息提示
    const message = reactive({
      show: false,
      type: 'info',
      text: ''
    })

    // 计算属性
    const totalPages = computed(() => {
      return Math.ceil(totalCount.value / pageSize.value)
    })

    // 加载设置列表
    const loadSettings = async () => {
      loading.value = true
      error.value = null
      
      try {
        const options = {
          page: currentPage.value,
          limit: pageSize.value,
          search: searchQuery.value.trim() || undefined
        }
        
        const response = await settingsApiService.list(options)
        
        if (response.success) {
          settings.value = response.data.items
          totalCount.value = response.data.total
        } else {
          throw new Error(response.error)
        }
      } catch (err) {
        error.value = err.message
        console.error('加载设置失败:', err)
      } finally {
        loading.value = false
      }
    }

    // 搜索防抖
    let searchTimeout = null
    const performSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        currentPage.value = 1
        loadSettings()
      }, 300)
    }

    // 分页
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        loadSettings()
      }
    }

    // 显示创建表单
    const showCreateForm = () => {
      selectedSetting.value = null
      showForm.value = true
    }

    // 编辑设置
    const editSetting = (setting) => {
      selectedSetting.value = { ...setting }
      showForm.value = true
    }

    // 关闭表单
    const closeForm = () => {
      showForm.value = false
      selectedSetting.value = null
    }

    // 保存设置
    const handleSave = async (settingData) => {
      try {
        let response
        if (selectedSetting.value) {
          // 更新
          response = await settingsApiService.update(selectedSetting.value.key, settingData)
        } else {
          // 创建
          response = await settingsApiService.create(settingData)
        }

        if (response.success) {
          showMessage('success', selectedSetting.value ? '设置更新成功' : '设置创建成功')
          closeForm()
          loadSettings()
        } else {
          throw new Error(response.error)
        }
      } catch (err) {
        showMessage('error', err.message)
      }
    }

    // 删除设置
    const deleteSetting = (setting) => {
      deleteTarget.value = setting
      showDeleteDialog.value = true
    }

    // 确认删除
    const confirmDelete = async () => {
      try {
        const response = await settingsApiService.delete(deleteTarget.value.key)
        
        if (response.success) {
          showMessage('success', '设置删除成功')
          loadSettings()
        } else {
          throw new Error(response.error)
        }
      } catch (err) {
        showMessage('error', err.message)
      } finally {
        cancelDelete()
      }
    }

    // 取消删除
    const cancelDelete = () => {
      showDeleteDialog.value = false
      deleteTarget.value = null
    }

    // 显示消息
    const showMessage = (type, text) => {
      message.type = type
      message.text = text
      message.show = true
    }

    // 清除消息
    const clearMessage = () => {
      message.show = false
    }

    // 格式化值显示
    const formatValue = (value, dataType) => {
      if (value === null || value === undefined) return '未设置'
      
      switch (dataType) {
        case 'boolean':
          return value === 'true' ? '是' : '否'
        case 'json':
          try {
            return JSON.stringify(JSON.parse(value), null, 2)
          } catch {
            return value
          }
        default:
          return String(value)
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString('zh-CN')
    }

    // 组件挂载
    onMounted(() => {
      loadSettings()
    })

    return {
      settings,
      loading,
      error,
      searchQuery,
      currentPage,
      totalCount,
      totalPages,
      showForm,
      selectedSetting,
      showDeleteDialog,
      deleteTarget,
      message,
      loadSettings,
      performSearch,
      goToPage,
      showCreateForm,
      editSetting,
      closeForm,
      handleSave,
      deleteSetting,
      confirmDelete,
      cancelDelete,
      clearMessage,
      formatValue,
      formatDate
    }
  }
}
</script>

<style scoped>
.settings-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.header-left h2 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.item-count {
  color: #666;
  font-size: 14px;
}

.filter-section {
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.setting-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s ease;
}

.setting-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #007bff;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.setting-key {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.setting-type {
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.setting-content {
  margin-bottom: 15px;
}

.setting-value {
  margin-bottom: 10px;
}

.value-display {
  display: block;
  margin-top: 5px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
}

.setting-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
}

.setting-meta {
  margin-bottom: 15px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.update-time {
  color: #666;
  font-size: 12px;
}

.setting-actions {
  display: flex;
  gap: 10px;
}
</style>