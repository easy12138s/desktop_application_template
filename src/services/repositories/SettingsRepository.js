const BaseRepository = require('./BaseRepository');

/**
 * 设置数据访问层
 */
class SettingsRepository extends BaseRepository {
  constructor(dbService) {
    super(dbService, 'settings');
  }

  /**
   * 根据键名查找设置
   * @param {string} key 键名
   * @returns {Object|null} 设置信息
   */
  findByKey(key) {
    const sql = 'SELECT * FROM settings WHERE key = ?';
    return this.db.get(sql, [key]);
  }

  /**
   * 获取设置值
   * @param {string} key 键名
   * @param {*} defaultValue 默认值
   * @returns {*} 设置值
   */
  getValue(key, defaultValue = null) {
    const setting = this.findByKey(key);
    if (!setting) {
      return defaultValue;
    }

    return this.parseValue(setting.value, setting.data_type);
  }

  /**
   * 设置值
   * @param {string} key 键名
   * @param {*} value 值
   * @param {string} description 描述
   * @param {string} dataType 数据类型
   * @returns {Object} 设置记录
   */
  setValue(key, value, description = '', dataType = null) {
    if (!key) {
      throw new Error('设置键名不能为空');
    }

    // 自动检测数据类型
    const detectedType = dataType || this.detectDataType(value);
    const serializedValue = this.serializeValue(value, detectedType);

    const existing = this.findByKey(key);
    const settingData = {
      key,
      value: serializedValue,
      description,
      data_type: detectedType,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // 更新现有设置
      const sql = `
        UPDATE settings 
        SET value = ?, description = ?, data_type = ?, updated_at = ?
        WHERE key = ?
      `;
      this.db.execute(sql, [
        settingData.value,
        settingData.description,
        settingData.data_type,
        settingData.updated_at,
        key
      ]);
      
      return this.findByKey(key);
    } else {
      // 创建新设置
      const sql = `
        INSERT INTO settings (key, value, description, data_type, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      this.db.execute(sql, [
        settingData.key,
        settingData.value,
        settingData.description,
        settingData.data_type,
        settingData.updated_at
      ]);
      
      return this.findByKey(key);
    }
  }

  /**
   * 批量设置值
   * @param {Object} settings 设置对象 {key: value, ...}
   * @param {string} description 描述
   * @returns {Array} 设置记录数组
   */
  setMultiple(settings, description = '') {
    const results = [];
    
    Object.entries(settings).forEach(([key, value]) => {
      results.push(this.setValue(key, value, description));
    });
    
    return results;
  }

  /**
   * 批量获取设置值
   * @param {Array} keys 键名数组
   * @returns {Object} 设置值对象
   */
  getMultiple(keys) {
    if (!keys || keys.length === 0) {
      return {};
    }

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `SELECT * FROM settings WHERE key IN (${placeholders})`;
    const settings = this.db.query(sql, keys);
    
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = this.parseValue(setting.value, setting.data_type);
    });
    
    return result;
  }

  /**
   * 获取所有设置
   * @returns {Object} 所有设置值
   */
  getAll() {
    const settings = this.db.query('SELECT * FROM settings ORDER BY key');
    const result = {};
    
    settings.forEach(setting => {
      result[setting.key] = this.parseValue(setting.value, setting.data_type);
    });
    
    return result;
  }

  /**
   * 获取设置列表（用于管理界面）
   * @param {Object} options 查询选项
   * @returns {Object} 分页结果
   */
  getList(options = {}) {
    const searchOptions = {
      ...options,
      searchFields: ['key', 'description'],
      orderBy: 'key',
      orderDirection: 'ASC'
    };
    
    return this.paginate(searchOptions);
  }

  /**
   * 删除设置
   * @param {string} key 键名
   * @returns {boolean} 是否删除成功
   */
  deleteByKey(key) {
    const sql = 'DELETE FROM settings WHERE key = ?';
    const result = this.db.execute(sql, [key]);
    return result.changes > 0;
  }

  /**
   * 批量删除设置
   * @param {Array} keys 键名数组
   * @returns {number} 删除的设置数
   */
  deleteMultiple(keys) {
    if (!keys || keys.length === 0) {
      return 0;
    }

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `DELETE FROM settings WHERE key IN (${placeholders})`;
    const result = this.db.execute(sql, keys);
    return result.changes;
  }

  /**
   * 检查设置是否存在
   * @param {string} key 键名
   * @returns {boolean} 是否存在
   */
  hasKey(key) {
    const sql = 'SELECT 1 FROM settings WHERE key = ? LIMIT 1';
    const result = this.db.get(sql, [key]);
    return !!result;
  }

  /**
   * 获取设置统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const totalSql = 'SELECT COUNT(*) as total FROM settings';
    const typesSql = `
      SELECT 
        data_type,
        COUNT(*) as count
      FROM settings 
      GROUP BY data_type
      ORDER BY count DESC
    `;
    
    const total = this.db.get(totalSql)?.total || 0;
    const types = this.db.query(typesSql);
    
    return {
      total,
      types: types.reduce((acc, type) => {
        acc[type.data_type] = type.count;
        return acc;
      }, {})
    };
  }

  /**
   * 导出所有设置
   * @returns {Object} 设置数据
   */
  exportSettings() {
    const settings = this.db.query('SELECT * FROM settings ORDER BY key');
    return settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: this.parseValue(setting.value, setting.data_type),
        description: setting.description,
        data_type: setting.data_type,
        updated_at: setting.updated_at
      };
      return acc;
    }, {});
  }

  /**
   * 导入设置
   * @param {Object} settings 设置数据
   * @param {boolean} overwrite 是否覆盖现有设置
   * @returns {number} 导入的设置数
   */
  importSettings(settings, overwrite = false) {
    let imported = 0;
    
    Object.entries(settings).forEach(([key, data]) => {
      if (!overwrite && this.hasKey(key)) {
        return; // 跳过已存在的设置
      }
      
      this.setValue(
        key,
        data.value,
        data.description || '',
        data.data_type
      );
      imported++;
    });
    
    return imported;
  }

  /**
   * 检测数据类型
   * @param {*} value 值
   * @returns {string} 数据类型
   */
  detectDataType(value) {
    if (value === null || value === undefined) {
      return 'string';
    }
    
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    
    if (typeof value === 'number') {
      return 'number';
    }
    
    if (typeof value === 'object') {
      return 'json';
    }
    
    return 'string';
  }

  /**
   * 序列化值
   * @param {*} value 值
   * @param {string} dataType 数据类型
   * @returns {string} 序列化后的值
   */
  serializeValue(value, dataType) {
    if (value === null || value === undefined) {
      return null;
    }
    
    switch (dataType) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? '1' : '0';
      case 'number':
        return String(value);
      default:
        return String(value);
    }
  }

  /**
   * 解析值
   * @param {string} value 序列化的值
   * @param {string} dataType 数据类型
   * @returns {*} 解析后的值
   */
  parseValue(value, dataType) {
    if (value === null || value === undefined) {
      return null;
    }
    
    switch (dataType) {
      case 'json':
        try {
          return JSON.parse(value);
        } catch (e) {
          return null;
        }
      case 'boolean':
        return value === '1' || value === 'true';
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      default:
        return value;
    }
  }
}

module.exports = SettingsRepository;