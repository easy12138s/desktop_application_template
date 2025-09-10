<template>
  <div class="title-bar" :class="{ 'is-win': isWindows }">
    <div class="title-bar-drag">
      <div class="app-title">{{ appTitle }}</div>
    </div>
    
    <!-- 用户管理按钮 -->
    <div class="user-controls">
      <UserManager />
    </div>
    
    <div class="window-controls">
      <button 
        class="window-btn minimize" 
        @click="minimize" 
        title="最小化"
        :disabled="isMaximized"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="8" width="10" height="1" fill="currentColor"/>
        </svg>
      </button>
      <button 
        class="window-btn maximize" 
        @click="maximize" 
        :title="isMaximized ? '还原' : '最大化'"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect v-if="!isMaximized" x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
          <path v-else d="M2 4h8v6H2V4zm1-1v4h6V3H3zm7-1v1h1v6H3v-1H2v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z" fill="currentColor"/>
        </svg>
      </button>
      <button 
        class="window-btn close" 
        @click="close" 
        title="关闭"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import UserManager from './UserManager.vue'

export default {
  name: 'TitleBar',
  components: {
    UserManager
  },
  data() {
    return {
      appTitle: 'EasyBox',
      isMaximized: false,
      isWindows: false
    }
  },
  async mounted() {
    // 检测当前平台
    if (window.electronAPI && window.electronAPI.platform) {
      this.isWindows = await window.electronAPI.platform.isWindows()
    }
    
    // 监听窗口状态变化
    this.getWindowState()
    window.addEventListener('resize', this.getWindowState)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.getWindowState)
  },
  methods: {
    minimize() {
      if (window.electronAPI && window.electronAPI.window) {
        window.electronAPI.window.minimize()
      }
    },
    maximize() {
      if (!window.electronAPI || !window.electronAPI.window) return
      if (this.isMaximized) {
        window.electronAPI.window.unmaximize()
      } else {
        window.electronAPI.window.maximize()
      }
      this.getWindowState()
    },
    close() {
      if (window.electronAPI && window.electronAPI.window) {
        window.electronAPI.window.close()
      }
    },
    async getWindowState() {
      if (!window.electronAPI || !window.electronAPI.window) return
      try {
        this.isMaximized = await window.electronAPI.window.getWindowState()
      } catch (error) {
        console.error('获取窗口状态失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  -webkit-app-region: drag;
  user-select: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title-bar-drag {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.window-controls {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
}

.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.window-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.window-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.window-btn.close:hover {
  background: #e74c3c;
}

.window-btn.close:active {
  background: #c0392b;
}

.window-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.window-btn:disabled:hover {
  background: transparent;
}

/* 用户管理控制区域 */
.user-controls {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
  margin-right: auto;
  margin-left: 1rem;
}

/* 针对不同操作系统的样式调整 */
.title-bar.is-win {
  background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
}

.title-bar.is-win .window-btn {
  color: #ffffff;
}

.title-bar.is-win .window-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title-bar.is-win .window-btn.close:hover {
  background: #e81123;
}
</style>