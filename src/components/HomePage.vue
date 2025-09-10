<template>
  <div class="home-page">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">📱 EasyBox 桌面应用</h1>
        <div class="header-actions">
          <button class="btn btn-primary" @click="showAbout = true">
            <span class="icon">ℹ️</span>
            关于
          </button>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="welcome-section">
        <div class="welcome-card">
          <h2 class="welcome-title">👋 欢迎使用 EasyBox</h2>
          <p class="welcome-subtitle">
            这是一个基于 Electron + Vue 3 的现代化桌面应用模板
          </p>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3>快速开发</h3>
              <p>基于 Vue 3 和 Electron，提供现代化的开发体验</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3>易于扩展</h3>
              <p>模块化的架构设计，方便添加新功能</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3>美观界面</h3>
              <p>现代化的 UI 设计，响应式布局适配各种屏幕</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速操作区域 -->
      <div class="quick-actions">
        <h3 class="section-title">快速开始</h3>
        <div class="actions-grid">
          <button class="action-card" @click="openExternal('https://github.com')">
            <div class="action-icon">🚀</div>
            <h4>项目文档</h4>
            <p>查看详细的使用文档</p>
          </button>
          
          <button class="action-card" @click="openExternal('https://vuejs.org')">
            <div class="action-icon">📚</div>
            <h4>Vue 3 文档</h4>
            <p>学习 Vue 3 相关知识</p>
          </button>
          
          <button class="action-card" @click="openExternal('https://electronjs.org')">
            <div class="action-icon">⚡</div>
            <h4>Electron 文档</h4>
            <p>了解 Electron 开发</p>
          </button>
        </div>
      </div>

      <!-- 滚动条展示区域 -->
      <div class="scroll-demo">
        <h3 class="section-title">滚动条效果展示</h3>
        <div class="scroll-content">
          <div class="content-item" v-for="i in 20" :key="i">
            <div class="item-number">{{ i }}</div>
            <div class="item-content">
              <h4>示例内容 {{ i }}</h4>
              <p>这是第 {{ i }} 个示例内容，用于展示优化后的滚动条效果。滚动条采用了现代化的设计，具有圆角、渐变和悬停动画效果。</p>
              <div class="item-tags">
                <span class="tag">示例 {{ i }}</span>
                <span class="tag">滚动条</span>
                <span class="tag">美观</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 关于对话框 -->
    <div v-if="showAbout" class="modal-overlay" @click="showAbout = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>关于 EasyBox</h3>
          <button class="close-btn" @click="showAbout = false">×</button>
        </div>
        <div class="modal-body">
          <div class="about-info">
            <h4>EasyBox 桌面应用</h4>
            <p><strong>版本：</strong>v2.0.0</p>
            <p><strong>技术栈：</strong></p>
            <ul>
              <li>Electron - 桌面应用框架</li>
              <li>Vue 3 - 前端框架</li>
              <li>Vite - 构建工具</li>
              <li>SQLite - 数据库</li>
            </ul>
            <p><strong>特性：</strong></p>
            <ul>
              <li>现代化的用户界面</li>
              <li>响应式设计</li>
              <li>本地数据存储</li>
              <li>易于扩展的架构</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showAbout = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'HomePage',
  setup() {
    const showAbout = ref(false)

    const openExternal = (url) => {
      if (window.electronAPI && window.electronAPI.utils) {
        window.electronAPI.utils.openExternal(url)
      } else {
        // 在浏览器中打开
        window.open(url, '_blank')
      }
    }

    return {
      showAbout,
      openExternal
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
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

.btn-primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-section {
  margin-bottom: 3rem;
}

.welcome-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.welcome-subtitle {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-bottom: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2rem;
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.feature-card p {
  opacity: 0.8;
  line-height: 1.5;
}

.section-title {
  font-size: 1.8rem;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 600;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 15px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  text-align: center;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.action-card h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.action-card p {
  opacity: 0.8;
  font-size: 0.9rem;
}

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
}

.modal-content {
  background: white;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
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

.about-info h4 {
  margin-top: 0;
  color: #333;
}

.about-info ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.about-info li {
  margin-bottom: 0.3rem;
  color: #666;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.scroll-demo {
  margin: 3rem 0;
}

.scroll-content {
  max-height: 400px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.content-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.content-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.item-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.item-content h4 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-weight: 600;
}

.item-content p {
  margin: 0 0 0.5rem 0;
  opacity: 0.8;
  line-height: 1.5;
}

.item-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .welcome-card {
    padding: 2rem 1.5rem;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>