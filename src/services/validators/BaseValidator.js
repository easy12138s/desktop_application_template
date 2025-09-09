/**
 * 验证结果类
 */
class ValidationResult {
  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 添加错误
   * @param {string} field 字段名
   * @param {string} message 错误消息
   */
  addError(field, message) {
    this.isValid = false;
    this.errors.push({ field, message });
  }

  /**
   * 添加警告
   * @param {string} field 字段名
   * @param {string} message 警告消息
   */
  addWarning(field, message) {
    this.warnings.push({ field, message });
  }

  /**
   * 获取第一个错误消息
   * @returns {string|null} 错误消息
   */
  getFirstError() {
    return this.errors.length > 0 ? this.errors[0].message : null;
  }

  /**
   * 获取字段的错误消息
   * @param {string} field 字段名
   * @returns {Array} 错误消息数组
   */
  getFieldErrors(field) {
    return this.errors
      .filter(error => error.field === field)
      .map(error => error.message);
  }

  /**
   * 转换为简单对象
   * @returns {Object} 验证结果对象
   */
  toObject() {
    return {
      isValid: this.isValid,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

/**
 * 数据验证器基类
 */
class BaseValidator {
  /**
   * 验证是否为空
   * @param {*} value 值
   * @returns {boolean} 是否为空
   */
  static isEmpty(value) {
    return value === null || 
           value === undefined || 
           value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  /**
   * 验证必填字段
   * @param {*} value 值
   * @param {string} fieldName 字段名
   * @param {ValidationResult} result 验证结果
   */
  static validateRequired(value, fieldName, result) {
    if (this.isEmpty(value)) {
      result.addError(fieldName, `${fieldName}是必填字段`);
    }
  }

  /**
   * 验证字符串长度
   * @param {string} value 值
   * @param {string} fieldName 字段名
   * @param {number} minLength 最小长度
   * @param {number} maxLength 最大长度
   * @param {ValidationResult} result 验证结果
   */
  static validateLength(value, fieldName, minLength = 0, maxLength = null, result) {
    if (value && typeof value === 'string') {
      if (value.length < minLength) {
        result.addError(fieldName, `${fieldName}长度不能少于${minLength}个字符`);
      }
      if (maxLength && value.length > maxLength) {
        result.addError(fieldName, `${fieldName}长度不能超过${maxLength}个字符`);
      }
    }
  }

  /**
   * 验证邮箱格式
   * @param {string} email 邮箱
   * @param {string} fieldName 字段名
   * @param {ValidationResult} result 验证结果
   */
  static validateEmail(email, fieldName, result) {
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        result.addError(fieldName, `${fieldName}格式不正确`);
      }
    }
  }

  /**
   * 验证URL格式
   * @param {string} url URL
   * @param {string} fieldName 字段名
   * @param {ValidationResult} result 验证结果
   */
  static validateUrl(url, fieldName, result) {
    if (url && typeof url === 'string') {
      try {
        new URL(url);
      } catch (e) {
        result.addError(fieldName, `${fieldName}不是有效的URL格式`);
      }
    }
  }

  /**
   * 验证正则表达式
   * @param {string} value 值
   * @param {RegExp} pattern 正则表达式
   * @param {string} fieldName 字段名
   * @param {string} message 错误消息
   * @param {ValidationResult} result 验证结果
   */
  static validatePattern(value, pattern, fieldName, message, result) {
    if (value && typeof value === 'string') {
      if (!pattern.test(value)) {
        result.addError(fieldName, message || `${fieldName}格式不正确`);
      }
    }
  }

  /**
   * 验证数字范围
   * @param {number} value 值
   * @param {string} fieldName 字段名
   * @param {number} min 最小值
   * @param {number} max 最大值
   * @param {ValidationResult} result 验证结果
   */
  static validateRange(value, fieldName, min = null, max = null, result) {
    if (value !== null && value !== undefined) {
      const num = Number(value);
      if (isNaN(num)) {
        result.addError(fieldName, `${fieldName}必须是数字`);
        return;
      }
      
      if (min !== null && num < min) {
        result.addError(fieldName, `${fieldName}不能小于${min}`);
      }
      if (max !== null && num > max) {
        result.addError(fieldName, `${fieldName}不能大于${max}`);
      }
    }
  }

  /**
   * 验证选项值
   * @param {*} value 值
   * @param {Array} options 有效选项
   * @param {string} fieldName 字段名
   * @param {ValidationResult} result 验证结果
   */
  static validateOptions(value, options, fieldName, result) {
    if (value !== null && value !== undefined && !options.includes(value)) {
      result.addError(fieldName, `${fieldName}的值必须是: ${options.join(', ')} 中的一个`);
    }
  }

  /**
   * 清理字符串
   * @param {string} str 字符串
   * @returns {string} 清理后的字符串
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') {
      return str;
    }
    
    return str
      .trim()
      .replace(/\s+/g, ' ') // 多个空格替换为单个空格
      .replace(/[<>]/g, ''); // 移除尖括号
  }

  /**
   * 清理HTML标签
   * @param {string} str 字符串
   * @returns {string} 清理后的字符串
   */
  static sanitizeHtml(str) {
    if (typeof str !== 'string') {
      return str;
    }
    
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .trim();
  }

  /**
   * 验证JSON格式
   * @param {string} jsonStr JSON字符串
   * @param {string} fieldName 字段名
   * @param {ValidationResult} result 验证结果
   * @returns {*} 解析后的对象或原值
   */
  static validateJson(jsonStr, fieldName, result) {
    if (typeof jsonStr === 'string') {
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        result.addError(fieldName, `${fieldName}不是有效的JSON格式`);
        return jsonStr;
      }
    }
    return jsonStr;
  }
}

module.exports = {
  ValidationResult,
  BaseValidator
};