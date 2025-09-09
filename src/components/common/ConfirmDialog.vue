<template>
  <teleport to="body">
    <div v-if="visible" class="confirm-dialog-overlay" @click="handleOverlayClick">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">{{ title }}</h3>
          <button v-if="showClose" class="close-btn" @click="cancel">×</button>
        </div>
        
        <div class="dialog-body">
          <div class="dialog-icon" :class="typeClass">
            {{ getIcon() }}
          </div>
          <div class="dialog-message">
            <p v-if="typeof message === 'string'">{{ message }}</p>
            <div v-else v-html="message"></div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button 
            v-if="showCancel" 
            class="btn btn-outline" 
            @click="cancel"
            :disabled="loading"
          >
            {{ cancelText }}
          </button>
          <button 
            class="btn" 
            :class="confirmButtonClass"
            @click="confirm"
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner"></span>
            {{ loading ? '处理中...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ConfirmDialog',
  props: {
    closeOnClickOverlay: {
      type: Boolean,
      default: true
    },
    showClose: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const visible = ref(false)
    const title = ref('确认操作')
    const message = ref('')
    const type = ref('warning')
    const confirmText = ref('确认')
    const cancelText = ref('取消')
    const showCancel = ref(true)
    const loading = ref(false)
    
    let resolvePromise = null
    let rejectPromise = null

    const typeClass = computed(() => `icon-${type.value}`)
    
    const confirmButtonClass = computed(() => {
      const classes = {
        success: 'btn-success',
        error: 'btn-danger',
        warning: 'btn-warning',
        info: 'btn-primary',
        danger: 'btn-danger'
      }
      return classes[type.value] || 'btn-primary'
    })

    const getIcon = () => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        danger: '🗑️',
        question: '❓'
      }
      return icons[type.value] || icons.warning
    }

    const show = (options = {}) => {
      const {
        title: optTitle = '确认操作',
        message: optMessage = '确定要执行此操作吗？',
        type: optType = 'warning',
        confirmText: optConfirmText = '确认',
        cancelText: optCancelText = '取消',
        showCancel: optShowCancel = true
      } = options

      title.value = optTitle
      message.value = optMessage
      type.value = optType
      confirmText.value = optConfirmText
      cancelText.value = optCancelText
      showCancel.value = optShowCancel
      visible.value = true
      loading.value = false

      return new Promise((resolve, reject) => {
        resolvePromise = resolve
        rejectPromise = reject
      })
    }

    const confirm = async () => {
      if (loading.value) return
      
      try {
        loading.value = true
        if (resolvePromise) {
          await resolvePromise(true)
        }
        close()
      } catch (error) {
        loading.value = false
        throw error
      }
    }

    const cancel = () => {
      if (loading.value) return
      
      if (rejectPromise) {
        rejectPromise(false)
      }
      close()
    }

    const close = () => {
      visible.value = false
      loading.value = false
      resolvePromise = null
      rejectPromise = null
    }

    const handleOverlayClick = () => {
      if (props.closeOnClickOverlay && !loading.value) {
        cancel()
      }
    }

    // 预设方法
    const showSuccess = (msg, title = '成功') => {
      return show({
        title,
        message: msg,
        type: 'success',
        showCancel: false,
        confirmText: '确定'
      })
    }

    const showError = (msg, title = '错误') => {
      return show({
        title,
        message: msg,
        type: 'error',
        showCancel: false,
        confirmText: '确定'
      })
    }

    const showWarning = (msg, title = '警告') => {
      return show({
        title,
        message: msg,
        type: 'warning',
        confirmText: '确认',
        cancelText: '取消'
      })
    }

    const showInfo = (msg, title = '提示') => {
      return show({
        title,
        message: msg,
        type: 'info',
        showCancel: false,
        confirmText: '确定'
      })
    }

    const showDelete = (msg = '此操作将永久删除数据，无法恢复！', title = '确认删除') => {
      return show({
        title,
        message: msg,
        type: 'danger',
        confirmText: '删除',
        cancelText: '取消'
      })
    }

    return {
      visible,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel,
      loading,
      typeClass,
      confirmButtonClass,
      getIcon,
      show,
      confirm,
      cancel,
      close,
      handleOverlayClick,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showDelete
    }
  }
}
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
  width: 90vw;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e6ed;
}

.dialog-title {
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

.close-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.dialog-body {
  padding: 2rem 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.dialog-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.icon-success {
  background: #d4edda;
  color: #27ae60;
}

.icon-error, .icon-danger {
  background: #f8d7da;
  color: #e74c3c;
}

.icon-warning {
  background: #fff3cd;
  color: #f39c12;
}

.icon-info {
  background: #cce7ff;
  color: #3498db;
}

.dialog-message {
  flex: 1;
  color: #2c3e50;
  line-height: 1.6;
}

.dialog-message p {
  margin: 0;
}

.dialog-footer {
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
  min-width: 80px;
  justify-content: center;
}

.btn:hover {
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

.btn-outline:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn-primary {
  background: #4c63d2;
  color: white;
}

.btn-primary:hover {
  background: #3c51c5;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover {
  background: #219a52;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover {
  background: #e67e22;
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
  .confirm-dialog {
    min-width: 0;
    margin: 1rem;
  }
  
  .dialog-body {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>