/**
 * 前端API服务基类
 * 提供通用的API调用方法和错误处理
 */
class BaseApiService {
  constructor() {
    this.api = window.electronAPI;
  }

  /**
   * 处理API响应
   * @param {Promise} apiCall API调用Promise
   * @returns {Promise} 处理后的结果
   */
  async handleResponse(apiCall) {
    try {
      const response = await apiCall;
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '操作失败');
      }
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  }

  /**
   * 处理带验证信息的API响应
   * @param {Promise} apiCall API调用Promise
   * @returns {Promise} 处理后的结果
   */
  async handleValidatedResponse(apiCall) {
    try {
      const response = await apiCall;
      
      if (response.success) {
        return {
          data: response.data,
          validation: response.validation
        };
      } else {
        const error = new Error(response.error || '操作失败');
        error.validation = response.validation;
        throw error;
      }
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  }

  /**
   * 显示成功消息
   * @param {string} message 消息内容
   */
  showSuccess(message) {
    this.api.utils.showMessage(message, 'success');
  }

  /**
   * 显示错误消息
   * @param {string|Error} error 错误信息
   */
  showError(error) {
    const message = error instanceof Error ? error.message : error;
    this.api.utils.showMessage(message, 'error');
  }

  /**
   * 显示警告消息
   * @param {string} message 消息内容
   */
  showWarning(message) {
    this.api.utils.showMessage(message, 'warning');
  }

  /**
   * 显示信息消息
   * @param {string} message 消息内容
   */
  showInfo(message) {
    this.api.utils.showMessage(message, 'info');
  }

  /**
   * 格式化错误消息
   * @param {Error} error 错误对象
   * @returns {string} 格式化后的错误消息
   */
  formatError(error) {
    if (error.validation && error.validation.errors && error.validation.errors.length > 0) {
      return error.validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
    }
    return error.message || '未知错误';
  }

  /**
   * 安全的JSON解析
   * @param {string} jsonStr JSON字符串
   * @param {*} defaultValue 默认值
   * @returns {*} 解析结果
   */
  safeJsonParse(jsonStr, defaultValue = null) {
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * 安全的JSON序列化
   * @param {*} obj 对象
   * @param {string} defaultValue 默认值
   * @returns {string} JSON字符串
   */
  safeJsonStringify(obj, defaultValue = '{}') {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * 防抖函数
   * @param {Function} func 要防抖的函数
   * @param {number} delay 延迟时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 节流函数
   * @param {Function} func 要节流的函数
   * @param {number} limit 限制时间（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

export default BaseApiService;