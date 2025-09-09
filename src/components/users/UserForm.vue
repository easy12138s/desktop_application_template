<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEdit ? '编辑用户' : '新增用户' }}
          </h3>
          <button class="close-btn" @click="close" :disabled="loading">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-body">
          <!-- 用户名 -->
          <div class="form-group">
            <label class="form-label">
              用户名 <span class="required">*</span>
            </label>
            <input
              type="text"
              v-model="formData.username"
              class="form-control"
              :class="{ 'is-invalid': errors.username }"
              placeholder="请输入用户名"
              :disabled="loading"
              maxlength="50"
              required
            />
            <div v-if="errors.username" class="invalid-feedback">
              {{ errors.username }}
            </div>
            <div class="form-text">
              用户名长度为2-50个字符，只能包含字母、数字、下划线和中文
            </div>
          </div>

          <!-- 邮箱 -->
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              type="email"
              v-model="formData.email"
              class="form-control"
              :class="{ 'is-invalid': errors.email }"
              placeholder="请输入邮箱地址"
              :disabled="loading"
              maxlength="100"
            />
            <div v-if="errors.email" class="invalid-feedback">
              {{ errors.email }}
            </div>
          </div>

          <!-- 头像URL -->
          <div class="form-group">
            <label class="form-label">头像URL</label>
            <input
              type="url"
              v-model="formData.avatar_url"
              class="form-control"
              :class="{ 'is-invalid': errors.avatar_url }"
              placeholder="请输入头像图片URL"
              :disabled="loading"
              maxlength="500"
            />
            <div v-if="errors.avatar_url" class="invalid-feedback">
              {{ errors.avatar_url }}
            </div>
            <div v-if="formData.avatar_url" class="avatar-preview">
              <img 
                :src="formData.avatar_url" 
                alt="头像预览" 
                class="preview-image"
                @error="handleImageError"
              />
            </div>
          </div>

          <!-- 用户状态 -->
          <div class="form-group" v-if="isEdit">
            <label class="form-label">用户状态</label>
            <select
              v-model="formData.status"
              class="form-control"
              :disabled="loading"
            >
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>
          </div>

          <!-- 表单验证提示 -->
          <div v-if="Object.keys(errors).length > 0" class="validation-summary">
            <h4>请修正以下错误：</h4>
            <ul>
              <li v-for="(error, field) in errors" :key="field">
                {{ error }}
              </li>
            </ul>
          </div>
        </form>
        
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-outline" 
            @click="close"
            :disabled="loading"
          >
            取消
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            @click="handleSubmit"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="loading-spinner"></span>
            {{ loading ? '保存中...' : (isEdit ? '更新' : '创建') }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { userApiService } from '../../services/api'

export default {
  name: 'UserForm',
  emits: ['user-saved'],
  setup(props, { emit }) {
    // 响应式数据
    const visible = ref(false)
    const loading = ref(false)
    const isEdit = ref(false)
    const currentUserId = ref(null)
    
    const formData = reactive({
      username: '',
      email: '',
      avatar_url: '',
      status: 'active'
    })
    
    const errors = reactive({})
    const originalData = ref({})

    // 计算属性
    const isFormValid = computed(() => {
      return formData.username.trim().length >= 2 && Object.keys(errors).length === 0
    })

    // 监听表单数据变化，实时验证
    watch(() => ({ ...formData }), () => {
      validateForm()
    }, { deep: true })

    // 方法
    const show = (user = null) => {
      isEdit.value = !!user
      currentUserId.value = user?.id || null
      
      if (user) {
        // 编辑模式，填充现有数据
        Object.assign(formData, {
          username: user.username || '',
          email: user.email || '',
          avatar_url: user.avatar_url || '',
          status: user.status || 'active'
        })
        originalData.value = { ...formData }
      } else {
        // 新增模式，重置表单
        resetForm()
      }
      
      clearErrors()
      visible.value = true
    }

    const close = () => {
      visible.value = false
      setTimeout(() => {
        resetForm()
        clearErrors()
        loading.value = false
      }, 200)
    }

    const resetForm = () => {
      Object.assign(formData, {
        username: '',
        email: '',
        avatar_url: '',
        status: 'active'
      })
      originalData.value = {}
      currentUserId.value = null
      isEdit.value = false
    }

    const clearErrors = () => {
      Object.keys(errors).forEach(key => {
        delete errors[key]
      })
    }

    const validateForm = () => {
      clearErrors()
      
      // 验证用户名
      if (!formData.username.trim()) {
        errors.username = '用户名不能为空'
      } else if (formData.username.trim().length < 2) {
        errors.username = '用户名长度不能少于2个字符'
      } else if (formData.username.length > 50) {
        errors.username = '用户名长度不能超过50个字符'
      } else if (!/^[\w\u4e00-\u9fa5]+$/.test(formData.username)) {
        errors.username = '用户名只能包含字母、数字、下划线和中文字符'
      } else if (/^\d/.test(formData.username)) {
        errors.username = '用户名不能以数字开头'
      }

      // 验证邮箱
      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          errors.email = '邮箱格式不正确'
        }
      }

      // 验证头像URL
      if (formData.avatar_url && formData.avatar_url.trim()) {
        try {
          new URL(formData.avatar_url)
        } catch (e) {
          errors.avatar_url = '头像URL格式不正确'
        }
      }

      return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      loading.value = true
      
      try {
        // 清理数据
        const submitData = userApiService.sanitizeUserData({
          username: formData.username,
          email: formData.email || null,
          avatar_url: formData.avatar_url || null,
          status: formData.status
        })

        let result
        if (isEdit.value) {
          // 只提交有变化的字段
          const changedData = {}
          Object.keys(submitData).forEach(key => {
            if (submitData[key] !== originalData.value[key]) {
              changedData[key] = submitData[key]
            }
          })
          
          if (Object.keys(changedData).length === 0) {
            // 没有任何变化
            close()
            return
          }
          
          result = await userApiService.updateUser(currentUserId.value, changedData)
        } else {
          result = await userApiService.createUser(submitData)
        }

        emit('user-saved', result)
        close()
      } catch (error) {
        // 处理验证错误
        if (error.validation && error.validation.errors) {
          error.validation.errors.forEach(err => {
            errors[err.field] = err.message
          })
        } else {
          // 处理其他错误（如用户名重复等）
          if (error.message.includes('用户名')) {
            errors.username = error.message
          } else if (error.message.includes('邮箱')) {
            errors.email = error.message
          } else {
            // 显示通用错误
            errors.general = error.message
          }
        }
      } finally {
        loading.value = false
      }
    }

    const handleOverlayClick = () => {
      if (!loading.value) {
        close()
      }
    }

    const handleImageError = () => {
      errors.avatar_url = '头像图片加载失败，请检查URL是否正确'
    }

    // 暴露方法给父组件
    return {
      // 数据
      visible,
      loading,
      isEdit,
      formData,
      errors,
      
      // 计算属性
      isFormValid,
      
      // 方法
      show,
      close,
      handleSubmit,
      handleOverlayClick,
      handleImageError
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90vw;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e6ed;
}

.modal-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #7f8c8d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background: #f8f9fa;
  color: #2c3e50;
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.875rem;
}

.required {
  color: #e74c3c;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #2c3e50;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #4c63d2;
  box-shadow: 0 0 0 3px rgba(76, 99, 210, 0.1);
}

.form-control:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-control.is-invalid {
  border-color: #e74c3c;
}

.form-control.is-invalid:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.invalid-feedback {
  display: block;
  margin-top: 0.25rem;
  color: #e74c3c;
  font-size: 0.8125rem;
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.8125rem;
}

.avatar-preview {
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
}

.preview-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e6ed;
}

.validation-summary {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.validation-summary h4 {
  margin: 0 0 0.5rem 0;
  color: #e74c3c;
  font-size: 0.9rem;
}

.validation-summary ul {
  margin: 0;
  padding-left: 1.5rem;
}

.validation-summary li {
  color: #e74c3c;
  font-size: 0.8125rem;
  margin-bottom: 0.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e6ed;
  background: #f8f9fa;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
  justify-content: center;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 2px solid #dee2e6;
}

.btn-outline:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn-primary {
  background: #4c63d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3c51c5;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95vw;
    margin: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>