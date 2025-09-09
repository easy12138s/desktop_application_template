<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEdit ? '编辑文档' : '新增文档' }}
          </h3>
          <button class="close-btn" @click="close" :disabled="loading">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-body">
          <div class="form-row">
            <!-- 文档标题 -->
            <div class="form-group">
              <label class="form-label">
                文档标题 <span class="required">*</span>
              </label>
              <input
                type="text"
                v-model="formData.title"
                class="form-control"
                :class="{ 'is-invalid': errors.title }"
                placeholder="请输入文档标题"
                :disabled="loading"
                maxlength="200"
                required
              />
              <div v-if="errors.title" class="invalid-feedback">
                {{ errors.title }}
              </div>
            </div>

            <!-- 分类 -->
            <div class="form-group">
              <label class="form-label">分类</label>
              <div class="category-input">
                <select 
                  v-model="selectedCategory" 
                  @change="handleCategoryChange"
                  class="form-control category-select"
                  :disabled="loading"
                >
                  <option value="">选择现有分类</option>
                  <option v-for="cat in categories" :key="cat.category" :value="cat.category">
                    {{ cat.category }}
                  </option>
                  <option value="__new__">+ 创建新分类</option>
                </select>
                <input
                  v-if="showNewCategory"
                  type="text"
                  v-model="formData.category"
                  class="form-control"
                  :class="{ 'is-invalid': errors.category }"
                  placeholder="输入新分类名称"
                  :disabled="loading"
                  maxlength="50"
                />
              </div>
              <div v-if="errors.category" class="invalid-feedback">
                {{ errors.category }}
              </div>
            </div>
          </div>

          <!-- 文档内容 -->
          <div class="form-group">
            <label class="form-label">文档内容</label>
            <textarea
              v-model="formData.content"
              class="form-control content-textarea"
              :class="{ 'is-invalid': errors.content }"
              placeholder="请输入文档内容..."
              :disabled="loading"
              rows="12"
            ></textarea>
            <div v-if="errors.content" class="invalid-feedback">
              {{ errors.content }}
            </div>
            <div class="form-text">
              当前字数: {{ contentLength }}/50000
            </div>
          </div>

          <!-- 标签 -->
          <div class="form-group">
            <label class="form-label">标签</label>
            <div class="tags-input">
              <div class="tag-list">
                <span 
                  v-for="(tag, index) in formData.tags" 
                  :key="index" 
                  class="tag-item"
                >
                  {{ tag }}
                  <button 
                    type="button" 
                    @click="removeTag(index)" 
                    class="tag-remove"
                    :disabled="loading"
                  >
                    ×
                  </button>
                </span>
              </div>
              <input
                type="text"
                v-model="newTag"
                @keydown.enter.prevent="addTag"
                @keydown="(e) => { if (e.key === ',') { e.preventDefault(); addTag(); } }"
                class="form-control tag-input"
                placeholder="输入标签后按回车键添加"
                :disabled="loading || formData.tags.length >= 10"
                maxlength="20"
              />
            </div>
            <div v-if="errors.tags" class="invalid-feedback">
              {{ errors.tags }}
            </div>
            <div class="form-text">
              最多可添加10个标签，每个标签长度不超过20个字符
            </div>
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { documentApiService } from '../../services/api'

export default {
  name: 'DocumentForm',
  emits: ['document-saved'],
  setup(props, { emit }) {
    // 响应式数据
    const visible = ref(false)
    const loading = ref(false)
    const isEdit = ref(false)
    const currentDocId = ref(null)
    const categories = ref([])
    const selectedCategory = ref('')
    const showNewCategory = ref(false)
    const newTag = ref('')
    
    const formData = reactive({
      title: '',
      content: '',
      category: 'default',
      tags: []
    })
    
    const errors = reactive({})
    const originalData = ref({})

    // 计算属性
    const contentLength = computed(() => {
      return formData.content ? formData.content.length : 0
    })

    const isFormValid = computed(() => {
      return formData.title.trim().length > 0 && Object.keys(errors).length === 0
    })

    // 监听表单数据变化，实时验证
    watch(() => ({ ...formData }), () => {
      validateForm()
    }, { deep: true })

    // 方法
    const loadCategories = async () => {
      try {
        categories.value = await documentApiService.getCategories()
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    }

    const show = async (document = null) => {
      await loadCategories()
      
      isEdit.value = !!document
      currentDocId.value = document?.id || null
      
      if (document) {
        // 编辑模式，填充现有数据
        const tags = documentApiService.formatTags(document.tags)
        Object.assign(formData, {
          title: document.title || '',
          content: document.content || '',
          category: document.category || 'default',
          tags: [...tags]
        })
        selectedCategory.value = document.category || ''
        originalData.value = { ...formData, tags: [...formData.tags] }
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
        title: '',
        content: '',
        category: 'default',
        tags: []
      })
      selectedCategory.value = ''
      showNewCategory.value = false
      newTag.value = ''
      originalData.value = {}
      currentDocId.value = null
      isEdit.value = false
    }

    const clearErrors = () => {
      Object.keys(errors).forEach(key => {
        delete errors[key]
      })
    }

    const validateForm = () => {
      clearErrors()
      
      // 验证标题
      if (!formData.title.trim()) {
        errors.title = '文档标题不能为空'
      } else if (formData.title.length > 200) {
        errors.title = '文档标题长度不能超过200个字符'
      }

      // 验证内容
      if (formData.content && formData.content.length > 50000) {
        errors.content = '文档内容长度不能超过50000个字符'
      }

      // 验证分类
      if (formData.category && formData.category.length > 50) {
        errors.category = '分类名称长度不能超过50个字符'
      } else if (formData.category && !/^[\w\u4e00-\u9fa5]+$/.test(formData.category)) {
        errors.category = '分类名称只能包含字母、数字、下划线和中文字符'
      }

      // 验证标签
      if (formData.tags.length > 10) {
        errors.tags = '标签数量不能超过10个'
      }
      
      formData.tags.forEach((tag) => {
        if (!tag || tag.trim().length === 0) {
          errors.tags = '标签不能为空'
        } else if (tag.length > 20) {
          errors.tags = '单个标签长度不能超过20个字符'
        } else if (!/^[\w\u4e00-\u9fa5]+$/.test(tag)) {
          errors.tags = `标签"${tag}"只能包含字母、数字、下划线和中文字符`
        }
      })

      return Object.keys(errors).length === 0
    }

    const handleCategoryChange = () => {
      if (selectedCategory.value === '__new__') {
        showNewCategory.value = true
        formData.category = ''
      } else {
        showNewCategory.value = false
        formData.category = selectedCategory.value || 'default'
      }
    }

    const addTag = () => {
      const tag = newTag.value.trim()
      if (!tag) return
      
      if (formData.tags.length >= 10) {
        errors.tags = '标签数量不能超过10个'
        return
      }
      
      if (formData.tags.includes(tag)) {
        errors.tags = '标签已存在'
        return
      }
      
      if (tag.length > 20) {
        errors.tags = '单个标签长度不能超过20个字符'
        return
      }
      
      if (!/^[\w\u4e00-\u9fa5]+$/.test(tag)) {
        errors.tags = '标签只能包含字母、数字、下划线和中文字符'
        return
      }
      
      formData.tags.push(tag)
      newTag.value = ''
      delete errors.tags
    }

    const removeTag = (index) => {
      formData.tags.splice(index, 1)
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      loading.value = true
      
      try {
        // 清理数据
        const submitData = documentApiService.sanitizeDocumentData({
          title: formData.title,
          content: formData.content || '',
          category: formData.category || 'default',
          tags: [...formData.tags]
        })

        let result
        if (isEdit.value) {
          // 只提交有变化的字段
          const changedData = {}
          Object.keys(submitData).forEach(key => {
            if (key === 'tags') {
              // 特殊处理标签数组
              if (JSON.stringify(submitData[key]) !== JSON.stringify(originalData.value[key])) {
                changedData[key] = submitData[key]
              }
            } else if (submitData[key] !== originalData.value[key]) {
              changedData[key] = submitData[key]
            }
          })
          
          if (Object.keys(changedData).length === 0) {
            // 没有任何变化
            close()
            return
          }
          
          result = await documentApiService.updateDocument(currentDocId.value, changedData)
        } else {
          result = await documentApiService.createDocument(submitData)
        }

        emit('document-saved', result)
        close()
      } catch (error) {
        // 处理验证错误
        if (error.validation && error.validation.errors) {
          error.validation.errors.forEach(err => {
            errors[err.field] = err.message
          })
        } else {
          // 显示通用错误
          errors.general = error.message
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

    // 生命周期
    onMounted(() => {
      loadCategories()
    })

    // 暴露方法给父组件
    return {
      // 数据
      visible,
      loading,
      isEdit,
      formData,
      errors,
      categories,
      selectedCategory,
      showNewCategory,
      newTag,
      
      // 计算属性
      contentLength,
      isFormValid,
      
      // 方法
      show,
      close,
      handleSubmit,
      handleOverlayClick,
      handleCategoryChange,
      addTag,
      removeTag
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
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content.large {
  max-width: 1000px;
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
  max-height: 70vh;
  overflow-y: auto;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
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

.content-textarea {
  resize: vertical;
  min-height: 200px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.category-input {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.category-select {
  margin-bottom: 0;
}

.tags-input {
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  padding: 0.5rem;
  min-height: 80px;
}

.tag-list {
  margin-bottom: 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  margin: 0.25rem 0.5rem 0.25rem 0;
  font-size: 0.8125rem;
  gap: 0.25rem;
}

.tag-remove {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
}

.tag-remove:hover {
  color: #0d47a1;
}

.tag-input {
  border: none;
  outline: none;
  width: 100%;
  padding: 0.25rem 0;
  background: transparent;
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
  
  .form-row {
    grid-template-columns: 1fr;
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