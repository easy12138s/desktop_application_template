<template>
  <div class="user-manager">
    <!-- 用户按钮 -->
    <button class="user-btn" @click="openModal" title="用户管理">
      👤 用户
    </button>

    <!-- 用户管理弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>用户管理</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <!-- 添加用户表单 -->
          <div class="form-section">
            <h4>{{ editingUser ? '编辑用户' : '添加新用户' }}</h4>
            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label>用户名 *</label>
                <input 
                  v-model="form.username" 
                  type="text" 
                  required
                  :disabled="editingUser"
                  placeholder="请输入用户名"
                />
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input 
                  v-model="form.email" 
                  type="email" 
                  placeholder="请输入邮箱地址"
                />
              </div>
              <div class="form-actions">
                <button type="button" @click="resetForm" class="btn btn-secondary">
                  重置
                </button>
                <button type="submit" class="btn btn-primary">
                  {{ editingUser ? '更新' : '添加' }}
                </button>
              </div>
            </form>
          </div>

          <!-- 用户列表 -->
          <div class="list-section">
            <h4>用户列表</h4>
            <div v-if="users.length === 0" class="empty-state">
              暂无用户数据
            </div>
            <table v-else class="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.email || '-' }}</td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td class="actions">
                    <button @click="editUser(user)" class="btn btn-small">
                      编辑
                    </button>
                    <button @click="deleteUser(user)" class="btn btn-small btn-danger">
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'

export default {
  name: 'UserManager',
  setup() {
    const showModal = ref(false)
    const users = ref([])
    const editingUser = ref(null)
    const form = reactive({
      username: '',
      email: ''
    })

    // 使用Electron API
    const userAPI = window.electronAPI?.users

    // 加载用户列表
    const loadUsers = async () => {
      try {
        if (!userAPI) {
          console.error('用户API不可用')
          return
        }
        users.value = await userAPI.getAllUsers()
      } catch (error) {
        console.error('加载用户失败:', error)
      }
    }

    // 打开弹窗
    const openModal = () => {
      showModal.value = true
      loadUsers()
    }

    // 关闭弹窗
    const closeModal = () => {
      showModal.value = false
      resetForm()
    }

    // 重置表单
    const resetForm = () => {
      form.username = ''
      form.email = ''
      editingUser.value = null
    }

    // 编辑用户
    const editUser = (user) => {
      editingUser.value = user
      form.username = user.username
      form.email = user.email || ''
    }

    // 删除用户
    const deleteUser = async (user) => {
      if (confirm(`确定要删除用户 "${user.username}" 吗？`)) {
        try {
          if (!userAPI) {
            alert('用户API不可用')
            return
          }
          await userAPI.deleteUser(user.id)
          await loadUsers()
          if (editingUser.value?.id === user.id) {
            resetForm()
          }
        } catch (error) {
          console.error('删除用户失败:', error)
          alert('删除用户失败')
        }
      }
    }

    // 提交表单
    const handleSubmit = async () => {
      try {
        if (!userAPI) {
          alert('用户API不可用')
          return
        }

        if (!form.username.trim()) {
          alert('用户名不能为空')
          return
        }

        // 检查用户名是否存在
        const usernameExists = await userAPI.usernameExists(
          form.username.trim(), 
          editingUser.value?.id
        )
        if (usernameExists) {
          alert('用户名已存在')
          return
        }

        // 检查邮箱是否存在
        if (form.email.trim()) {
          const emailExists = await userAPI.emailExists(
            form.email.trim(),
            editingUser.value?.id
          )
          if (emailExists) {
            alert('邮箱已存在')
            return
          }
        }

        const userData = {
          username: form.username.trim(),
          email: form.email.trim() || null
        }

        if (editingUser.value) {
          await userAPI.updateUser({
            ...userData,
            id: editingUser.value.id
          })
        } else {
          await userAPI.addUser(userData)
        }

        await loadUsers()
        resetForm()
      } catch (error) {
        console.error('保存用户失败:', error)
        alert('保存用户失败')
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('zh-CN')
    }

    // 初始化用户服务
    onMounted(async () => {
      try {
        if (userAPI) {
          await userAPI.initUsers()
        } else {
          console.error('用户API不可用')
        }
      } catch (error) {
        console.error('初始化用户服务失败:', error)
      }
    })

    return {
      showModal,
      users,
      form,
      editingUser,
      openModal,
      closeModal,
      handleSubmit,
      editUser,
      deleteUser,
      resetForm,
      formatDate
    }
  }
}
</script>

<style scoped>
.user-manager {
  display: inline-block;
}

.user-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 1.5rem;
}

.form-section, .list-section {
  margin-bottom: 2rem;
}

.form-section h4, .list-section h4 {
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 12px;
}

.btn:hover {
  opacity: 0.9;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.user-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .actions {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .user-table {
    font-size: 14px;
  }
}
</style>