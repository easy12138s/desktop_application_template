<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? '编辑设置' : '新增设置' }}</h2>
        <button @click="$emit('close')" class="close-btn" type="button">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="setting-form">
        <div class="form-body">
          <!-- 设置键 -->
          <div class="form-group">
            <label class="form-label required">设置键</label>
            <input
              v-model="formData.key"
              type="text"
              class="form-input"
              :class="{ 'error': errors.key }"
              placeholder="请输入设置键，如: app.theme"
              :disabled="isEditing"
              maxlength="100"
            />
            <div v-if="errors.key" class="error-text">{{ errors.key }}</div>
            <div class="form-help">设置的唯一标识符，创建后不可修改</div>
          </div>

          <!-- 数据类型 -->
          <div class="form-group">
            <label class="form-label required">数据类型</label>
            <select
              v-model="formData.data_type"
              class="form-select"
              :class="{ 'error': errors.data_type }"
            >
              <option value="string">字符串</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="json">JSON对象</option>
            </select>
            <div v-if="errors.data_type" class="error-text">{{ errors.data_type }}</div>
          </div>

          <!-- 设置值 -->
          <div class="form-group">
            <label class="form-label required">设置值</label>
            
            <!-- 字符串类型 -->
            <input
              v-if="formData.data_type === 'string'"
              v-model="formData.value"
              type="text"
              class="form-input"
              :class="{ 'error': errors.value }"
              placeholder="请输入字符串值"
              maxlength="1000"
            />
            
            <!-- 数字类型 -->
            <input
              v-else-if="formData.data_type === 'number'"
              v-model.number="formData.value"
              type="number"
              class="form-input"
              :class="{ 'error': errors.value }"
              placeholder="请输入数字值"
              step="any"
            />
            
            <!-- 布尔类型 -->
            <select
              v-else-if="formData.data_type === 'boolean'"
              v-model="formData.value"
              class="form-select"
              :class="{ 'error': errors.value }"
            >
              <option value="">请选择</option>
              <option value="true">是 (true)</option>
              <option value="false">否 (false)</option>
            </select>
            
            <!-- JSON类型 -->
            <textarea
              v-else-if="formData.data_type === 'json'"
              v-model="formData.value"
              class="form-textarea"
              :class="{ 'error': errors.value }"
              placeholder="请输入有效的JSON格式，例如: {&quot;key&quot;: &quot;value&quot;}"
              rows="6"
            ></textarea>
            
            <div v-if="errors.value" class="error-text">{{ errors.value }}</div>
            <div v-if="formData.data_type === 'json'" class="form-help">
              请输入有效的JSON格式数据
            </div>
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              :class="{ 'error': errors.description }"
              placeholder="请输入设置项的描述信息（可选）"
              rows="3"
              maxlength="500"
            ></textarea>
            <div v-if="errors.description" class="error-text">{{ errors.description }}</div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn btn-outline">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="loading-text">保存中...</span>
            <span v-else>{{ isEditing ? '更新' : '创建' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'

export default {
  name: 'SettingForm',
  props: {
    setting: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    // 响应式数据
    const loading = ref(false)
    const formData = reactive({
      key: '',
      value: '',
      description: '',
      data_type: 'string'
    })
    
    const errors = reactive({})

    // 计算属性
    const isEditing = computed(() => !!props.setting)

    // 监听设置数据变化
    watch(
      () => props.setting,
      (newSetting) => {
        if (newSetting) {
          formData.key = newSetting.key
          formData.value = newSetting.value || ''
          formData.description = newSetting.description || ''
          formData.data_type = newSetting.data_type || 'string'
        }
      },
      { immediate: true }
    )

    // 监听数据类型变化，重置值
    watch(
      () => formData.data_type,
      (newType, oldType) => {
        if (oldType && newType !== oldType) {
          formData.value = getDefaultValue(newType)
        }
      }
    )

    // 获取默认值
    const getDefaultValue = (dataType) => {
      switch (dataType) {
        case 'string':
          return ''
        case 'number':
          return 0
        case 'boolean':
          return 'false'
        case 'json':
          return '{}'
        default:
          return ''
      }
    }

    // 验证表单
    const validateForm = () => {
      Object.keys(errors).forEach(key => delete errors[key])
      let isValid = true

      // 验证键
      if (!formData.key.trim()) {
        errors.key = '设置键不能为空'
        isValid = false
      } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.key)) {
        errors.key = '设置键只能包含字母、数字、点号、下划线和短横线'
        isValid = false
      }

      // 验证数据类型
      if (!formData.data_type) {
        errors.data_type = '请选择数据类型'
        isValid = false
      }

      // 验证值
      if (formData.value === '' || formData.value === null || formData.value === undefined) {
        errors.value = '设置值不能为空'
        isValid = false
      } else {
        // 根据数据类型验证
        switch (formData.data_type) {
          case 'number':
            if (isNaN(Number(formData.value))) {
              errors.value = '请输入有效的数字'
              isValid = false
            }
            break
          case 'boolean':
            if (!['true', 'false'].includes(formData.value)) {
              errors.value = '请选择布尔值'
              isValid = false
            }
            break
          case 'json':
            try {
              JSON.parse(formData.value)
            } catch {
              errors.value = '请输入有效的JSON格式'
              isValid = false
            }
            break
        }
      }

      // 验证描述长度
      if (formData.description && formData.description.length > 500) {
        errors.description = '描述不能超过500个字符'
        isValid = false
      }

      return isValid
    }

    // 处理提交
    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      loading.value = true

      try {
        // 准备数据
        const settingData = {
          key: formData.key.trim(),
          value: String(formData.value),
          description: formData.description.trim(),
          data_type: formData.data_type
        }

        // 发送保存事件
        emit('save', settingData)
      } catch (error) {
        console.error('表单提交错误:', error)
      } finally {
        loading.value = false
      }
    }

    // 处理遮罩点击
    const handleOverlayClick = () => {
      emit('close')
    }

    // 组件挂载时初始化
    onMounted(() => {
      if (!props.setting) {
        formData.value = getDefaultValue(formData.data_type)
      }
    })

    return {
      loading,
      formData,
      errors,
      isEditing,
      handleSubmit,
      handleOverlayClick
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
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.form-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
  border-color: #dc3545;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: monospace;
}

.error-text {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

.form-help {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.loading-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.loading-text::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-container {
    max-height: 95vh;
  }
  
  .modal-header,
  .form-body,
  .modal-footer {
    padding: 16px;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .modal-footer .btn {
    width: 100%;
  }
}
</style>