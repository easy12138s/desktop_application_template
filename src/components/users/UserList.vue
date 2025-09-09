<template>
  <div class="user-list">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h3 class="page-title">用户管理</h3>
        <span class="total-count">共 {{ pagination.total }} 个用户</span>
      </div>
      <div class="toolbar-right">
        <div class="search-box">
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索用户名或邮箱"
            class="search-input"
            @input="debouncedSearch"
          />
          <button class="search-btn" @click="handleSearch">
            🔍
          </button>
        </div>
        <select v-model="statusFilter" @change="handleSearch" class="filter-select">
          <option value="">所有状态</option>
          <option value="active">活跃</option>
          <option value="inactive">停用</option>
        </select>
        <button class="btn btn-primary" @click="showCreateForm">
          <span class="icon">➕</span>
          新增用户
        </button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div class="batch-actions" v-if="selectedUsers.length > 0">
      <span class="selected-info">
        已选择 {{ selectedUsers.length }} 个用户
      </span>
      <div class="batch-buttons">
        <button class="btn btn-success btn-sm" @click="batchActivate">
          批量激活
        </button>
        <button class="btn btn-warning btn-sm" @click="batchDeactivate">
          批量停用
        </button>
        <button class="btn btn-danger btn-sm" @click="batchDelete">
          批量删除
        </button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        加载中...
      </div>
      
      <table v-else class="table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                :indeterminate="isSomeSelected"
              />
            </th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="7" class="empty-state">
              <div class="empty-state-icon">👥</div>
              <div class="empty-state-title">暂无用户数据</div>
              <div class="empty-state-description">
                点击"新增用户"按钮创建第一个用户
              </div>
            </td>
          </tr>
          <tr v-else v-for="user in users" :key="user.id" class="table-row">
            <td>
              <input
                type="checkbox"
                :value="user.id"
                v-model="selectedUsers"
              />
            </td>
            <td>
              <div class="user-info">
                <img
                  v-if="user.avatar_url"
                  :src="user.avatar_url"
                  :alt="user.username"
                  class="user-avatar"
                />
                <div v-else class="user-avatar-placeholder">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <span class="username">{{ user.username }}</span>
              </div>
            </td>
            <td>{{ user.email || '-' }}</td>
            <td>
              <span class="badge" :class="getStatusClass(user.status)">
                {{ getStatusText(user.status) }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>{{ formatDate(user.updated_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-ghost btn-sm"
                  @click="showEditForm(user)"
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  v-if="user.status === 'active'"
                  class="btn btn-ghost btn-sm"
                  @click="deactivateUser(user)"
                  title="停用"
                >
                  ⏸️
                </button>
                <button
                  v-else
                  class="btn btn-ghost btn-sm"
                  @click="activateUser(user)"
                  title="激活"
                >
                  ▶️
                </button>
                <button
                  class="btn btn-ghost btn-sm text-danger"
                  @click="deleteUser(user)"
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button
        class="btn btn-outline"
        :disabled="!pagination.hasPrev"
        @click="changePage(pagination.page - 1)"
      >
        上一页
      </button>
      
      <template v-for="page in getPageNumbers()" :key="page">
        <button
          v-if="page !== '...'"
          class="btn"
          :class="page === pagination.page ? 'btn-primary' : 'btn-outline'"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <span v-else class="pagination-ellipsis">...</span>
      </template>
      
      <button
        class="btn btn-outline"
        :disabled="!pagination.hasNext"
        @click="changePage(pagination.page + 1)"
      >
        下一页
      </button>
      
      <select v-model="pagination.limit" @change="handleSearch" class="page-size-select">
        <option value="10">10条/页</option>
        <option value="20">20条/页</option>
        <option value="50">50条/页</option>
      </select>
    </div>

    <!-- 用户表单对话框 -->
    <UserForm
      ref="userForm"
      @user-saved="handleUserSaved"
    />

    <!-- 确认对话框 -->
    <ConfirmDialog ref="confirmDialog" />
    
    <!-- 消息提示 -->
    <MessageToast ref="messageToast" />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { userApiService } from '../../services/api'
import UserForm from './UserForm.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import MessageToast from '../common/MessageToast.vue'

export default {
  name: 'UserList',
  components: {
    UserForm,
    ConfirmDialog,
    MessageToast
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const users = ref([])
    const selectedUsers = ref([])
    const searchKeyword = ref('')
    const statusFilter = ref('')
    
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    })

    // 组件引用
    const userForm = ref(null)
    const confirmDialog = ref(null)
    const messageToast = ref(null)

    // 计算属性
    const isAllSelected = computed(() => {
      return users.value.length > 0 && selectedUsers.value.length === users.value.length
    })

    const isSomeSelected = computed(() => {
      return selectedUsers.value.length > 0 && selectedUsers.value.length < users.value.length
    })

    // 方法
    const loadUsers = async () => {
      loading.value = true
      try {
        const options = {
          page: pagination.page,
          limit: pagination.limit,
          search: searchKeyword.value,
          status: statusFilter.value
        }
        
        const result = await userApiService.getUsers(options)
        users.value = result.data || []
        Object.assign(pagination, result.pagination)
        
        // 清除已选择但不在当前页面的用户
        selectedUsers.value = selectedUsers.value.filter(id =>
          users.value.some(user => user.id === id)
        )
      } catch (error) {
        showMessage('加载用户列表失败: ' + error.message, 'error')
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      pagination.page = 1
      loadUsers()
    }

    const debouncedSearch = userApiService.debounce(handleSearch, 500)

    const changePage = (page) => {
      if (page < 1 || page > pagination.totalPages) return
      pagination.page = page
      loadUsers()
    }

    const getPageNumbers = () => {
      const pages = []
      const current = pagination.page
      const total = pagination.totalPages
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        if (current > 4) pages.push('...')
        
        const start = Math.max(2, current - 1)
        const end = Math.min(total - 1, current + 1)
        
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
        
        if (current < total - 3) pages.push('...')
        pages.push(total)
      }
      
      return pages
    }

    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedUsers.value = []
      } else {
        selectedUsers.value = users.value.map(user => user.id)
      }
    }

    const showCreateForm = () => {
      userForm.value.show()
    }

    const showEditForm = (user) => {
      userForm.value.show(user)
    }

    const handleUserSaved = () => {
      loadUsers()
    }

    const activateUser = async (user) => {
      try {
        await userApiService.activateUsers([user.id])
        loadUsers()
      } catch (error) {
        showMessage('激活用户失败: ' + error.message, 'error')
      }
    }

    const deactivateUser = async (user) => {
      try {
        await userApiService.deactivateUsers([user.id])
        loadUsers()
      } catch (error) {
        showMessage('停用用户失败: ' + error.message, 'error')
      }
    }

    const deleteUser = async (user) => {
      try {
        await confirmDialog.value.showDelete(
          `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`
        )
        
        await userApiService.deleteUser(user.id)
        loadUsers()
      } catch (error) {
        if (error !== false) { // 用户取消返回false
          showMessage('删除用户失败: ' + error.message, 'error')
        }
      }
    }

    const batchActivate = async () => {
      try {
        await confirmDialog.value.show({
          title: '批量激活用户',
          message: `确定要激活选中的 ${selectedUsers.value.length} 个用户吗？`,
          type: 'info'
        })
        
        await userApiService.activateUsers(selectedUsers.value)
        selectedUsers.value = []
        loadUsers()
      } catch (error) {
        if (error !== false) {
          showMessage('批量激活失败: ' + error.message, 'error')
        }
      }
    }

    const batchDeactivate = async () => {
      try {
        await confirmDialog.value.show({
          title: '批量停用用户',
          message: `确定要停用选中的 ${selectedUsers.value.length} 个用户吗？`,
          type: 'warning'
        })
        
        await userApiService.deactivateUsers(selectedUsers.value)
        selectedUsers.value = []
        loadUsers()
      } catch (error) {
        if (error !== false) {
          showMessage('批量停用失败: ' + error.message, 'error')
        }
      }
    }

    const batchDelete = async () => {
      try {
        await confirmDialog.value.showDelete(
          `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复！`
        )
        
        await userApiService.deleteUsers(selectedUsers.value)
        selectedUsers.value = []
        loadUsers()
      } catch (error) {
        if (error !== false) {
          showMessage('批量删除失败: ' + error.message, 'error')
        }
      }
    }

    const getStatusText = (status) => {
      return userApiService.getStatusText(status)
    }

    const getStatusClass = (status) => {
      return `badge-${userApiService.getStatusColor(status)}`
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    }

    const showMessage = (message, type = 'info') => {
      messageToast.value.show(message, type)
    }

    // 生命周期
    onMounted(() => {
      loadUsers()
    })

    return {
      // 数据
      loading,
      users,
      selectedUsers,
      searchKeyword,
      statusFilter,
      pagination,
      
      // 引用
      userForm,
      confirmDialog,
      messageToast,
      
      // 计算属性
      isAllSelected,
      isSomeSelected,
      
      // 方法
      loadUsers,
      handleSearch,
      debouncedSearch,
      changePage,
      getPageNumbers,
      toggleSelectAll,
      showCreateForm,
      showEditForm,
      handleUserSaved,
      activateUser,
      deactivateUser,
      deleteUser,
      batchActivate,
      batchDeactivate,
      batchDelete,
      getStatusText,
      getStatusClass,
      formatDate,
      showMessage
    }
  }
}
</script>

<style scoped>
.user-list {
  padding: 1rem;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.total-count {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  overflow: hidden;
}

.search-input {
  border: none;
  padding: 0.5rem 0.75rem;
  outline: none;
  min-width: 200px;
}

.search-btn {
  background: #f8f9fa;
  border: none;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover {
  background: #e9ecef;
}

.filter-select {
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  padding: 0.5rem;
  outline: none;
}

/* 批量操作样式 */
.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.selected-info {
  color: #2c3e50;
  font-weight: 500;
}

.batch-buttons {
  display: flex;
  gap: 0.5rem;
}

/* 表格样式 */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: #f8f9fa;
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e6ed;
}

.table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f2f6;
}

.table-row:hover {
  background: #f8f9fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4c63d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.username {
  font-weight: 500;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.text-danger {
  color: #e74c3c !important;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pagination-ellipsis {
  padding: 0.5rem;
  color: #7f8c8d;
}

.page-size-select {
  margin-left: 1rem;
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  padding: 0.375rem;
  outline: none;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty-state-description {
  color: #7f8c8d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-right {
    justify-content: space-between;
  }
  
  .search-input {
    min-width: 0;
    flex: 1;
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .table {
    min-width: 600px;
  }
  
  .pagination {
    justify-content: center;
  }
}
</style>