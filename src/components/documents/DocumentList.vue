<template>
  <div class="document-list">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h3 class="page-title">文档管理</h3>
        <span class="total-count">共 {{ pagination.total }} 个文档</span>
      </div>
      <div class="toolbar-right">
        <div class="search-box">
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索文档标题或内容"
            class="search-input"
            @input="debouncedSearch"
          />
          <button class="search-btn" @click="handleSearch">
            🔍
          </button>
        </div>
        <select v-model="categoryFilter" @change="handleSearch" class="filter-select">
          <option value="">所有分类</option>
          <option v-for="cat in categories" :key="cat.category" :value="cat.category">
            {{ cat.category }} ({{ cat.count }})
          </option>
        </select>
        <button class="btn btn-primary" @click="showCreateForm">
          <span class="icon">➕</span>
          新增文档
        </button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div class="batch-actions" v-if="selectedDocuments.length > 0">
      <span class="selected-info">
        已选择 {{ selectedDocuments.length }} 个文档
      </span>
      <div class="batch-buttons">
        <select v-model="batchCategory" class="batch-category-select">
          <option value="">选择分类</option>
          <option v-for="cat in categories" :key="cat.category" :value="cat.category">
            {{ cat.category }}
          </option>
        </select>
        <button 
          class="btn btn-success btn-sm" 
          @click="batchUpdateCategory"
          :disabled="!batchCategory"
        >
          批量更改分类
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
      
      <div v-else-if="documents.length === 0" class="empty-state">
        <div class="empty-state-icon">📄</div>
        <div class="empty-state-title">暂无文档数据</div>
        <div class="empty-state-description">
          点击"新增文档"按钮创建第一个文档
        </div>
      </div>

      <div v-else class="document-grid">
        <div 
          v-for="doc in documents" 
          :key="doc.id" 
          class="document-card"
          :class="{ selected: selectedDocuments.includes(doc.id) }"
        >
          <div class="card-header">
            <input
              type="checkbox"
              :value="doc.id"
              v-model="selectedDocuments"
              class="card-checkbox"
            />
            <div class="card-actions">
              <button
                class="btn btn-ghost btn-sm"
                @click="showEditForm(doc)"
                title="编辑"
              >
                ✏️
              </button>
              <button
                class="btn btn-ghost btn-sm text-danger"
                @click="deleteDocument(doc)"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div class="card-body">
            <h4 class="doc-title">{{ doc.title }}</h4>
            <p class="doc-summary">{{ getSummary(doc.content) }}</p>
            
            <div class="doc-meta">
              <span class="badge" :class="getCategoryClass(doc.category)">
                {{ doc.category || 'default' }}
              </span>
              <span class="doc-size">{{ getDocumentSize(doc.content) }}</span>
            </div>
            
            <div v-if="getTags(doc.tags).length > 0" class="doc-tags">
              <span 
                v-for="tag in getTags(doc.tags)" 
                :key="tag" 
                class="tag"
              >
                #{{ tag }}
              </span>
            </div>
            
            <div class="doc-info">
              <div class="doc-author" v-if="doc.username">
                👤 {{ doc.username }}
              </div>
              <div class="doc-date">
                📅 {{ formatDate(doc.updated_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
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

    <!-- 文档表单对话框 -->
    <DocumentForm
      ref="documentForm"
      @document-saved="handleDocumentSaved"
    />

    <!-- 确认对话框 -->
    <ConfirmDialog ref="confirmDialog" />
    
    <!-- 消息提示 -->
    <MessageToast ref="messageToast" />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { documentApiService } from '../../services/api'
import DocumentForm from './DocumentForm.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import MessageToast from '../common/MessageToast.vue'

export default {
  name: 'DocumentList',
  components: {
    DocumentForm,
    ConfirmDialog,
    MessageToast
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const documents = ref([])
    const selectedDocuments = ref([])
    const searchKeyword = ref('')
    const categoryFilter = ref('')
    const categories = ref([])
    const batchCategory = ref('')
    
    const pagination = reactive({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    })

    // 组件引用
    const documentForm = ref(null)
    const confirmDialog = ref(null)
    const messageToast = ref(null)

    // 方法
    const loadDocuments = async () => {
      loading.value = true
      try {
        const options = {
          page: pagination.page,
          limit: pagination.limit,
          search: searchKeyword.value,
          category: categoryFilter.value
        }
        
        const result = await documentApiService.getDocuments(options)
        documents.value = result.data || []
        Object.assign(pagination, result.pagination)
        
        // 清除已选择但不在当前页面的文档
        selectedDocuments.value = selectedDocuments.value.filter(id =>
          documents.value.some(doc => doc.id === id)
        )
      } catch (error) {
        showMessage('加载文档列表失败: ' + error.message, 'error')
      } finally {
        loading.value = false
      }
    }

    const loadCategories = async () => {
      try {
        categories.value = await documentApiService.getCategories()
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    }

    const handleSearch = () => {
      pagination.page = 1
      loadDocuments()
    }

    const debouncedSearch = documentApiService.debounce(handleSearch, 500)

    const changePage = (page) => {
      if (page < 1 || page > pagination.totalPages) return
      pagination.page = page
      loadDocuments()
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

    const showCreateForm = () => {
      documentForm.value.show()
    }

    const showEditForm = (doc) => {
      documentForm.value.show(doc)
    }

    const handleDocumentSaved = () => {
      loadDocuments()
      loadCategories()
    }

    const deleteDocument = async (doc) => {
      try {
        await confirmDialog.value.showDelete(
          `确定要删除文档 "${doc.title}" 吗？此操作不可恢复！`
        )
        
        await documentApiService.deleteDocument(doc.id)
        loadDocuments()
        loadCategories()
      } catch (error) {
        if (error !== false) {
          showMessage('删除文档失败: ' + error.message, 'error')
        }
      }
    }

    const batchUpdateCategory = async () => {
      if (!batchCategory.value) return
      
      try {
        await confirmDialog.value.show({
          title: '批量更改分类',
          message: `确定要将选中的 ${selectedDocuments.value.length} 个文档的分类更改为 "${batchCategory.value}" 吗？`,
          type: 'info'
        })
        
        await documentApiService.updateDocumentsCategory(selectedDocuments.value, batchCategory.value)
        selectedDocuments.value = []
        batchCategory.value = ''
        loadDocuments()
        loadCategories()
      } catch (error) {
        if (error !== false) {
          showMessage('批量更改分类失败: ' + error.message, 'error')
        }
      }
    }

    const batchDelete = async () => {
      try {
        await confirmDialog.value.showDelete(
          `确定要删除选中的 ${selectedDocuments.value.length} 个文档吗？此操作不可恢复！`
        )
        
        await documentApiService.deleteDocuments(selectedDocuments.value)
        selectedDocuments.value = []
        loadDocuments()
        loadCategories()
      } catch (error) {
        if (error !== false) {
          showMessage('批量删除失败: ' + error.message, 'error')
        }
      }
    }

    const getSummary = (content) => {
      return documentApiService.getDocumentSummary(content, 120)
    }

    const getDocumentSize = (content) => {
      return documentApiService.getDocumentSize(content)
    }

    const getTags = (tags) => {
      return documentApiService.formatTags(tags)
    }

    const getCategoryClass = (category) => {
      return `badge-${documentApiService.getCategoryColor(category)}`
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
      loadDocuments()
      loadCategories()
    })

    return {
      // 数据
      loading,
      documents,
      selectedDocuments,
      searchKeyword,
      categoryFilter,
      categories,
      batchCategory,
      pagination,
      
      // 引用
      documentForm,
      confirmDialog,
      messageToast,
      
      // 方法
      loadDocuments,
      handleSearch,
      debouncedSearch,
      changePage,
      getPageNumbers,
      showCreateForm,
      showEditForm,
      handleDocumentSaved,
      deleteDocument,
      batchUpdateCategory,
      batchDelete,
      getSummary,
      getDocumentSize,
      getTags,
      getCategoryClass,
      formatDate,
      showMessage
    }
  }
}
</script>

<style scoped>
.document-list {
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
  flex-wrap: wrap;
  gap: 1rem;
}

.selected-info {
  color: #2c3e50;
  font-weight: 500;
}

.batch-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.batch-category-select {
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  padding: 0.375rem 0.5rem;
  outline: none;
  font-size: 0.8125rem;
}

/* 文档网格样式 */
.table-container {
  margin-bottom: 2rem;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.document-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 2px solid transparent;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.document-card.selected {
  border-color: #4c63d2;
  box-shadow: 0 0 0 3px rgba(76, 99, 210, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0 1rem;
}

.card-checkbox {
  transform: scale(1.2);
}

.card-actions {
  display: flex;
  gap: 0.25rem;
}

.card-body {
  padding: 1rem;
}

.doc-title {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-summary {
  color: #7f8c8d;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.doc-size {
  color: #6c757d;
  font-size: 0.75rem;
}

.doc-tags {
  margin-bottom: 1rem;
}

.tag {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
}

.doc-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #6c757d;
}

.doc-author,
.doc-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  padding: 4rem 2rem;
}

.empty-state-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

.empty-state-description {
  color: #7f8c8d;
  font-size: 1.1rem;
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
    align-items: stretch;
  }
  
  .batch-buttons {
    justify-content: space-between;
  }
  
  .document-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    justify-content: center;
  }
}
</style>