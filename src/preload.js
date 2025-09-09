const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本 - 安全地暴露API到渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // 用户管理API
  users: {
    /**
     * 获取用户列表
     * @param {Object} options 查询选项
     * @returns {Promise} 用户列表
     */
    list: (options = {}) => ipcRenderer.invoke('users-list', options),

    /**
     * 获取用户详情
     * @param {number} id 用户ID
     * @returns {Promise} 用户信息
     */
    get: (id) => ipcRenderer.invoke('users-get', id),

    /**
     * 创建用户
     * @param {Object} userData 用户数据
     * @returns {Promise} 创建结果
     */
    create: (userData) => ipcRenderer.invoke('users-create', userData),

    /**
     * 更新用户
     * @param {number} id 用户ID
     * @param {Object} userData 用户数据
     * @returns {Promise} 更新结果
     */
    update: (id, userData) => ipcRenderer.invoke('users-update', { id, userData }),

    /**
     * 删除用户
     * @param {number} id 用户ID
     * @returns {Promise} 删除结果
     */
    delete: (id) => ipcRenderer.invoke('users-delete', id),

    /**
     * 批量操作用户
     * @param {string} operation 操作类型
     * @param {Array} ids 用户ID数组
     * @param {*} data 操作数据
     * @returns {Promise} 操作结果
     */
    batch: (operation, ids, data = null) => ipcRenderer.invoke('users-batch', { operation, ids, data }),

    /**
     * 获取用户统计信息
     * @returns {Promise} 统计数据
     */
    statistics: () => ipcRenderer.invoke('users-statistics')
  },

  // 文档管理API
  documents: {
    /**
     * 获取文档列表
     * @param {Object} options 查询选项
     * @returns {Promise} 文档列表
     */
    list: (options = {}) => ipcRenderer.invoke('documents-list', options),

    /**
     * 获取文档详情
     * @param {number} id 文档ID
     * @returns {Promise} 文档信息
     */
    get: (id) => ipcRenderer.invoke('documents-get', id),

    /**
     * 创建文档
     * @param {Object} docData 文档数据
     * @returns {Promise} 创建结果
     */
    create: (docData) => ipcRenderer.invoke('documents-create', docData),

    /**
     * 更新文档
     * @param {number} id 文档ID
     * @param {Object} docData 文档数据
     * @returns {Promise} 更新结果
     */
    update: (id, docData) => ipcRenderer.invoke('documents-update', { id, docData }),

    /**
     * 删除文档
     * @param {number} id 文档ID
     * @returns {Promise} 删除结果
     */
    delete: (id) => ipcRenderer.invoke('documents-delete', id),

    /**
     * 批量操作文档
     * @param {string} operation 操作类型
     * @param {Array} ids 文档ID数组
     * @param {*} data 操作数据
     * @returns {Promise} 操作结果
     */
    batch: (operation, ids, data = null) => ipcRenderer.invoke('documents-batch', { operation, ids, data }),

    /**
     * 获取文档分类
     * @returns {Promise} 分类列表
     */
    categories: () => ipcRenderer.invoke('documents-categories'),

    /**
     * 获取文档标签
     * @returns {Promise} 标签列表
     */
    tags: () => ipcRenderer.invoke('documents-tags'),

    /**
     * 获取文档统计信息
     * @returns {Promise} 统计数据
     */
    statistics: () => ipcRenderer.invoke('documents-statistics')
  },

  // 设置管理API
  settings: {
    /**
     * 获取设置列表
     * @param {Object} options 查询选项
     * @returns {Promise} 设置列表
     */
    list: (options = {}) => ipcRenderer.invoke('settings-list', options),

    /**
     * 获取设置值
     * @param {string} key 设置键名
     * @returns {Promise} 设置信息
     */
    get: (key) => ipcRenderer.invoke('settings-get', key),

    /**
     * 设置值
     * @param {string} key 键名
     * @param {*} value 值
     * @param {string} description 描述
     * @param {string} data_type 数据类型
     * @returns {Promise} 设置结果
     */
    set: (key, value, description = '', data_type = null) => 
      ipcRenderer.invoke('settings-set', { key, value, description, data_type }),

    /**
     * 删除设置
     * @param {string} key 设置键名
     * @returns {Promise} 删除结果
     */
    delete: (key) => ipcRenderer.invoke('settings-delete', key),

    /**
     * 批量设置
     * @param {Object} settings 设置对象
     * @returns {Promise} 设置结果
     */
    batchSet: (settings) => ipcRenderer.invoke('settings-batch-set', settings),

    /**
     * 获取所有设置
     * @returns {Promise} 所有设置
     */
    all: () => ipcRenderer.invoke('settings-all'),

    /**
     * 导出设置
     * @returns {Promise} 导出数据
     */
    export: () => ipcRenderer.invoke('settings-export')
  },

  // 数据库操作API（兼容性）
  database: {
    /**
     * 执行SQL查询
     * @param {string} sql SQL语句
     * @param {Array} params 参数数组
     * @returns {Promise} 执行结果
     */
    execute: (sql, params = []) => ipcRenderer.invoke('database-execute', { sql, params }),

    /**
     * 执行SQL查询（专用）
     * @param {string} sql SQL语句
     * @param {Array} params 参数数组
     * @returns {Promise} 查询结果
     */
    query: (sql, params = []) => ipcRenderer.invoke('database-query', { sql, params }),

    /**
     * 执行事务
     * @param {Array} operations 操作数组
     * @returns {Promise} 执行结果
     */
    executeTransaction: (operations) => ipcRenderer.invoke('database-transaction', operations),

    /**
     * 备份数据库
     * @param {string} backupPath 备份路径
     * @returns {Promise} 备份结果
     */
    backup: (backupPath) => ipcRenderer.invoke('database-backup', backupPath),

    /**
     * 获取数据库信息
     * @returns {Promise} 数据库信息
     */
    info: () => ipcRenderer.invoke('database-info')
  },

  // 工具方法
  utils: {
    /**
     * 获取用户数据目录
     * @returns {Promise} 目录路径
     */
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

    /**
     * 显示消息对话框
     * @param {string} message 消息内容
     * @param {string} type 消息类型
     */
    showMessage: (message, type = 'info') => ipcRenderer.invoke('show-message', { message, type })
  }
});

// 监听主进程消息
ipcRenderer.on('database-error', (event, error) => {
  console.error('数据库错误:', error);
});

ipcRenderer.on('database-connected', (event, message) => {
  console.log('数据库连接状态:', message);
});