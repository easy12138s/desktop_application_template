import BaseApiService from './BaseApiService';

/**
 * 设置API服务
 */
class SettingsApiService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * 获取设置列表
   * @param {Object} options 查询选项
   * @returns {Promise} 设置列表数据
   */
  async getSettings(options = {}) {
    return this.handleResponse(
      this.api.settings.list(options)
    );
  }

  /**
   * 搜索设置
   * @param {string} keyword 搜索关键词
   * @param {Object} filters 过滤条件
   * @returns {Promise} 搜索结果
   */
  async searchSettings(keyword = '', filters = {}) {
    const options = {
      search: keyword,
      ...filters
    };
    return this.getSettings(options);
  }

  /**
   * 获取分页设置列表
   * @param {number} page 页码
   * @param {number} limit 每页数量
   * @param {Object} filters 过滤条件
   * @returns {Promise} 分页结果
   */
  async getSettingsPaginated(page = 1, limit = 10, filters = {}) {
    const options = {
      page,
      limit,
      ...filters
    };
    return this.getSettings(options);
  }

  /**
   * 获取设置值
   * @param {string} key 设置键名
   * @returns {Promise} 设置信息
   */
  async getSetting(key) {
    return this.handleResponse(
      this.api.settings.get(key)
    );
  }

  /**
   * 设置值
   * @param {string} key 键名
   * @param {*} value 值
   * @param {string} description 描述
   * @param {string} dataType 数据类型
   * @returns {Promise} 设置结果
   */
  async setSetting(key, value, description = '', dataType = null) {
    try {
      const result = await this.handleValidatedResponse(
        this.api.settings.set(key, value, description, dataType)
      );
      this.showSuccess('设置保存成功');
      return result.data;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 删除设置
   * @param {string} key 设置键名
   * @returns {Promise} 删除结果
   */
  async deleteSetting(key) {
    try {
      await this.handleResponse(
        this.api.settings.delete(key)
      );
      this.showSuccess('设置删除成功');
      return true;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 批量设置
   * @param {Object} settings 设置对象
   * @returns {Promise} 设置结果
   */
  async batchSetSettings(settings) {
    try {
      const result = await this.handleResponse(
        this.api.settings.batchSet(settings)
      );
      this.showSuccess(`成功保存 ${result.length} 个设置项`);
      return result;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 获取所有设置
   * @returns {Promise} 所有设置
   */
  async getAllSettings() {
    return this.handleResponse(
      this.api.settings.all()
    );
  }

  /**
   * 导出设置
   * @returns {Promise} 导出数据
   */
  async exportSettings() {
    try {
      const result = await this.handleResponse(
        this.api.settings.export()
      );
      this.showSuccess('设置导出成功');
      return result;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 验证设置数据
   * @param {Object} settingData 设置数据
   * @returns {Object} 验证结果
   */
  validateSettingData(settingData) {
    const errors = [];
    const warnings = [];
    const { key, value, description, data_type } = settingData;

    // 验证键名
    if (!key || key.trim().length === 0) {
      errors.push({ field: 'key', message: '设置键名不能为空' });
    } else if (key.length > 100) {
      errors.push({ field: 'key', message: '键名长度不能超过100个字符' });
    } else if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(key)) {
      errors.push({ field: 'key', message: '键名必须以字母开头，只能包含字母、数字、下划线和点号' });
    } else if (key.split('.').length > 5) {
      errors.push({ field: 'key', message: '键名层级不能超过5级' });
    }

    // 验证描述
    if (description && description.length > 500) {
      errors.push({ field: 'description', message: '设置描述长度不能超过500个字符' });
    }

    // 验证数据类型
    if (data_type && !['string', 'number', 'boolean', 'json'].includes(data_type)) {
      errors.push({ field: 'data_type', message: '数据类型必须是 string, number, boolean, json 中的一个' });
    }

    // 根据数据类型验证值
    if (data_type && value !== null && value !== undefined) {
      switch (data_type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push({ field: 'value', message: '数字类型的设置值必须是有效数字' });
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== '1' && value !== '0') {
            errors.push({ field: 'value', message: '布尔类型的设置值必须是 true/false 或 1/0' });
          }
          break;
        case 'json':
          if (typeof value === 'string') {
            try {
              JSON.parse(value);
            } catch (e) {
              errors.push({ field: 'value', message: 'JSON格式不正确' });
            }
          }
          break;
        case 'string':
          if (typeof value === 'string' && value.length > 10000) {
            errors.push({ field: 'value', message: '字符串长度不能超过10000个字符' });
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 清理设置数据
   * @param {Object} settingData 设置数据
   * @returns {Object} 清理后的数据
   */
  sanitizeSettingData(settingData) {
    const sanitized = {};

    if (settingData.key !== undefined) {
      sanitized.key = settingData.key.trim().toLowerCase();
    }

    if (settingData.value !== undefined) {
      sanitized.value = this.sanitizeValue(settingData.value, settingData.data_type);
    }

    if (settingData.description !== undefined) {
      sanitized.description = settingData.description ? settingData.description.trim() : '';
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
  sanitizeValue(value, dataType) {
    if (value === null || value === undefined) {
      return null;
    }

    switch (dataType) {
      case 'string':
        return String(value).trim();
      case 'number': {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      }
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
        return String(value).trim();
    }
  }

  /**
   * 格式化设置值显示
   * @param {*} value 值
   * @param {string} dataType 数据类型
   * @returns {string} 格式化后的显示值
   */
  formatValueDisplay(value, dataType) {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (dataType) {
      case 'boolean':
        return value ? '是' : '否';
      case 'json':
        return JSON.stringify(value, null, 2);
      case 'number':
        return String(value);
      default:
        return String(value);
    }
  }

  /**
   * 获取数据类型显示名称
   * @param {string} dataType 数据类型
   * @returns {string} 显示名称
   */
  getDataTypeDisplay(dataType) {
    const typeMap = {
      'string': '字符串',
      'number': '数字',
      'boolean': '布尔值',
      'json': 'JSON对象'
    };
    return typeMap[dataType] || '未知';
  }

  /**
   * 获取数据类型颜色
   * @param {string} dataType 数据类型
   * @returns {string} 颜色类名
   */
  getDataTypeColor(dataType) {
    const colorMap = {
      'string': 'primary',
      'number': 'success',
      'boolean': 'warning',
      'json': 'info'
    };
    return colorMap[dataType] || 'default';
  }

  /**
   * 解析键名层级
   * @param {string} key 键名
   * @returns {Array} 层级数组
   */
  parseKeyLevels(key) {
    return key ? key.split('.') : [];
  }

  /**
   * 获取键名分组
   * @param {Array} settings 设置列表
   * @returns {Object} 分组对象
   */
  groupSettingsByPrefix(settings) {
    const groups = {};
    
    settings.forEach(setting => {
      const levels = this.parseKeyLevels(setting.key);
      const prefix = levels.length > 1 ? levels[0] : 'general';
      
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(setting);
    });
    
    return groups;
  }

  /**
   * 验证JSON字符串
   * @param {string} jsonStr JSON字符串
   * @returns {Object} 验证结果
   */
  validateJsonString(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return {
        isValid: true,
        parsed,
        error: null
      };
    } catch (error) {
      return {
        isValid: false,
        parsed: null,
        error: error.message
      };
    }
  }

  /**
   * 格式化JSON字符串
   * @param {string} jsonStr JSON字符串
   * @returns {string} 格式化后的JSON
   */
  formatJsonString(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonStr;
    }
  }
}

// 创建单例实例
const settingsApiService = new SettingsApiService();
export default settingsApiService;