const { ValidationResult, BaseValidator } = require('./BaseValidator');

/**
 * 设置数据验证器
 */
class SettingsValidator extends BaseValidator {
  /**
   * 验证设置数据
   * @param {Object} settingData 设置数据
   * @returns {ValidationResult} 验证结果
   */
  static validate(settingData) {
    const result = new ValidationResult();
    const { key, value, description, data_type } = settingData;

    // 验证键名
    this.validateRequired(key, '设置键名', result);
    this.validateSettingKey(key, result);

    // 验证值（根据数据类型）
    if (value !== undefined) {
      this.validateSettingValue(value, data_type, result);
    }

    // 验证描述
    if (description !== undefined && description !== null) {
      this.validateLength(description, '设置描述', 0, 500, result);
    }

    // 验证数据类型
    if (data_type !== undefined) {
      this.validateOptions(
        data_type, 
        ['string', 'number', 'boolean', 'json'], 
        '数据类型', 
        result
      );
    }

    return result;
  }

  /**
   * 验证设置键名
   * @param {string} key 键名
   * @param {ValidationResult} result 验证结果
   */
  static validateSettingKey(key, result) {
    if (key) {
      // 长度验证
      this.validateLength(key, '设置键名', 1, 100, result);
      
      // 键名格式验证（只允许字母、数字、下划线、点号）
      const keyPattern = /^[a-zA-Z][a-zA-Z0-9_.]*$/;
      this.validatePattern(
        key,
        keyPattern,
        '设置键名',
        '键名必须以字母开头，只能包含字母、数字、下划线和点号',
        result
      );

      // 保留键名验证
      const reservedKeys = [
        'system.version',
        'system.config',
        'app.secret',
        'database.password'
      ];
      if (reservedKeys.includes(key.toLowerCase())) {
        result.addError('设置键名', '该键名为系统保留，不能使用');
      }

      // 键名层级验证（不超过5级）
      const levels = key.split('.');
      if (levels.length > 5) {
        result.addError('设置键名', '键名层级不能超过5级');
      }
    }
  }

  /**
   * 验证设置值
   * @param {*} value 值
   * @param {string} dataType 数据类型
   * @param {ValidationResult} result 验证结果
   */
  static validateSettingValue(value, dataType, result) {
    if (value === null || value === undefined) {
      return; // 允许空值
    }

    switch (dataType) {
      case 'string':
        this.validateStringValue(value, result);
        break;
      case 'number':
        this.validateNumberValue(value, result);
        break;
      case 'boolean':
        this.validateBooleanValue(value, result);
        break;
      case 'json':
        this.validateJsonValue(value, result);
        break;
      default:
        // 如果没有指定类型，进行基本验证
        this.validateLength(String(value), '设置值', 0, 10000, result);
    }
  }

  /**
   * 验证字符串值
   * @param {*} value 值
   * @param {ValidationResult} result 验证结果
   */
  static validateStringValue(value, result) {
    if (typeof value !== 'string') {
      result.addError('设置值', '字符串类型的设置值必须是字符串');
      return;
    }
    
    this.validateLength(value, '设置值', 0, 10000, result);
  }

  /**
   * 验证数字值
   * @param {*} value 值
   * @param {ValidationResult} result 验证结果
   */
  static validateNumberValue(value, result) {
    const num = Number(value);
    if (isNaN(num)) {
      result.addError('设置值', '数字类型的设置值必须是有效数字');
      return;
    }
    
    // 检查是否为安全整数范围
    if (!Number.isSafeInteger(num) && Number.isInteger(num)) {
      result.addWarning('设置值', '数字值超出安全整数范围，可能导致精度损失');
    }
  }

  /**
   * 验证布尔值
   * @param {*} value 值
   * @param {ValidationResult} result 验证结果
   */
  static validateBooleanValue(value, result) {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== '1' && value !== '0') {
      result.addError('设置值', '布尔类型的设置值必须是 true/false 或 1/0');
    }
  }

  /**
   * 验证JSON值
   * @param {*} value 值
   * @param {ValidationResult} result 验证结果
   */
  static validateJsonValue(value, result) {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // 检查JSON大小
        if (JSON.stringify(parsed).length > 50000) {
          result.addError('设置值', 'JSON数据过大，不能超过50KB');
        }
      } catch (e) {
        result.addError('设置值', 'JSON格式不正确');
      }
    } else if (typeof value === 'object') {
      try {
        const jsonStr = JSON.stringify(value);
        if (jsonStr.length > 50000) {
          result.addError('设置值', 'JSON数据过大，不能超过50KB');
        }
      } catch (e) {
        result.addError('设置值', '对象无法序列化为JSON');
      }
    } else {
      result.addError('设置值', 'JSON类型的设置值必须是对象或有效的JSON字符串');
    }
  }

  /**
   * 清理设置数据
   * @param {Object} settingData 设置数据
   * @returns {Object} 清理后的设置数据
   */
  static sanitize(settingData) {
    const sanitized = {};

    if (settingData.key !== undefined) {
      sanitized.key = this.sanitizeString(settingData.key).toLowerCase();
    }

    if (settingData.value !== undefined) {
      sanitized.value = this.sanitizeValue(settingData.value, settingData.data_type);
    }

    if (settingData.description !== undefined) {
      sanitized.description = settingData.description ? this.sanitizeString(settingData.description) : '';
    }

    if (settingData.data_type !== undefined) {
      sanitized.data_type = settingData.data_type || 'string';
    }

    return sanitized;
  }

  /**
   * 清理设置值
   * @param {*} value 值
   * @param {string} dataType 数据类型
   * @returns {*} 清理后的值
   */
  static sanitizeValue(value, dataType) {
    if (value === null || value === undefined) {
      return null;
    }

    switch (dataType) {
      case 'string':
        return this.sanitizeString(String(value));
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      case 'boolean':
        if (typeof value === 'boolean') {
          return value;
        }
        return value === 'true' || value === '1' || value === 1;
      case 'json':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            return null;
          }
        }
        return value;
      default:
        return this.sanitizeString(String(value));
    }
  }

  /**
   * 验证批量设置操作
   * @param {Object|Array} settings 设置数据
   * @returns {ValidationResult} 验证结果
   */
  static validateBatchOperation(settings) {
    const result = new ValidationResult();

    if (!settings || (typeof settings !== 'object' && !Array.isArray(settings))) {
      result.addError('设置数据', '设置数据必须是对象或数组');
      return result;
    }

    const settingsArray = Array.isArray(settings) ? settings : Object.entries(settings).map(([key, value]) => ({ key, value }));

    if (settingsArray.length === 0) {
      result.addError('设置数据', '设置数据不能为空');
      return result;
    }

    if (settingsArray.length > 100) {
      result.addError('批量操作', '单次批量操作不能超过100个设置项');
      return result;
    }

    // 验证每个设置项
    settingsArray.forEach((setting, index) => {
      const settingResult = this.validate(setting);
      if (!settingResult.isValid) {
        settingResult.errors.forEach(error => {
          result.addError(`设置[${index}].${error.field}`, error.message);
        });
      }
    });

    // 检查重复键名
    const keys = settingsArray.map(s => s.key).filter(Boolean);
    const uniqueKeys = [...new Set(keys)];
    if (uniqueKeys.length !== keys.length) {
      result.addError('设置数据', '存在重复的键名');
    }

    return result;
  }

  /**
   * 验证设置导入数据
   * @param {Object} importData 导入数据
   * @returns {ValidationResult} 验证结果
   */
  static validateImportData(importData) {
    const result = new ValidationResult();

    if (!importData || typeof importData !== 'object') {
      result.addError('导入数据', '导入数据必须是对象格式');
      return result;
    }

    const entries = Object.entries(importData);
    if (entries.length === 0) {
      result.addError('导入数据', '导入数据不能为空');
      return result;
    }

    if (entries.length > 500) {
      result.addError('导入数据', '单次导入不能超过500个设置项');
      return result;
    }

    // 验证每个设置项
    entries.forEach(([key, settingData]) => {
      if (typeof settingData !== 'object') {
        result.addError(`设置[${key}]`, '设置数据必须是对象格式');
        return;
      }

      const setting = { key, ...settingData };
      const settingResult = this.validate(setting);
      if (!settingResult.isValid) {
        settingResult.errors.forEach(error => {
          result.addError(`设置[${key}].${error.field}`, error.message);
        });
      }
    });

    return result;
  }

  /**
   * 验证设置搜索参数
   * @param {Object} searchParams 搜索参数
   * @returns {ValidationResult} 验证结果
   */
  static validateSearchParams(searchParams) {
    const result = new ValidationResult();
    const { search, data_type, page, limit } = searchParams;

    // 验证搜索关键词
    if (search !== undefined && search !== null) {
      this.validateLength(search, '搜索关键词', 0, 100, result);
    }

    // 验证数据类型过滤
    if (data_type !== undefined && data_type !== null && data_type !== '') {
      this.validateOptions(
        data_type,
        ['string', 'number', 'boolean', 'json'],
        '数据类型过滤',
        result
      );
    }

    // 验证分页参数
    if (page !== undefined) {
      this.validateRange(page, '页码', 1, null, result);
    }

    if (limit !== undefined) {
      this.validateRange(limit, '每页数量', 1, 100, result);
    }

    return result;
  }
}

module.exports = SettingsValidator;