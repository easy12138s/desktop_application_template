<template>
  <teleport to="body">
    <div v-if="visible" class="message-toast" :class="[typeClass, positionClass]">
      <div class="toast-content">
        <span class="toast-icon">{{ getIcon() }}</span>
        <span class="toast-message">{{ message }}</span>
        <button v-if="showClose" class="toast-close" @click="close">×</button>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'MessageToast',
  props: {
    position: {
      type: String,
      default: 'top-right',
      validator: (value) => [
        'top-left', 'top-center', 'top-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ].includes(value)
    },
    duration: {
      type: Number,
      default: 3000
    },
    showClose: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const visible = ref(false)
    const message = ref('')
    const type = ref('info')
    let timer = null

    const typeClass = computed(() => `toast-${type.value}`)
    const positionClass = computed(() => `toast-${props.position}`)

    const getIcon = () => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      return icons[type.value] || icons.info
    }

    const show = (msg, msgType = 'info') => {
      message.value = msg
      type.value = msgType
      visible.value = true

      // 清除之前的定时器
      if (timer) {
        clearTimeout(timer)
      }

      // 设置自动关闭
      if (props.duration > 0) {
        timer = setTimeout(() => {
          close()
        }, props.duration)
      }
    }

    const close = () => {
      visible.value = false
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    return {
      visible,
      message,
      type,
      typeClass,
      positionClass,
      getIcon,
      show,
      close
    }
  }
}
</script>

<style scoped>
.message-toast {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  min-width: 250px;
  pointer-events: auto;
  border-left: 4px solid;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  color: #2c3e50;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #7f8c8d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

/* 类型样式 */
.toast-success .toast-content {
  border-left-color: #27ae60;
  background: #f8fff8;
}

.toast-error .toast-content {
  border-left-color: #e74c3c;
  background: #fff8f8;
}

.toast-warning .toast-content {
  border-left-color: #f39c12;
  background: #fffdf5;
}

.toast-info .toast-content {
  border-left-color: #3498db;
  background: #f8fbff;
}

/* 位置样式 */
.toast-top-left {
  top: 1rem;
  left: 1rem;
}

.toast-top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-top-right {
  top: 1rem;
  right: 1rem;
}

.toast-bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.toast-bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-bottom-right {
  bottom: 1rem;
  right: 1rem;
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-top-left,
.toast-bottom-left {
  animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-top-center,
.toast-bottom-center {
  animation: slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-toast {
    left: 1rem !important;
    right: 1rem !important;
    transform: none !important;
  }
  
  .toast-content {
    max-width: none;
    width: 100%;
  }
}
</style>