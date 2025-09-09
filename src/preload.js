const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本 - 安全地暴露API到渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作API
  database: {
    /**
     * 执行SQL查询
     * @param {string} sql SQL语句
     * @param {Array} params 参数数组
     * @returns {Promise} 执行结果
     */
    execute: (sql, params = []) => ipcRenderer.invoke('database-execute', { sql, params }),

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
    backup: (backupPath) => ipcRenderer.invoke('database-backup', backupPath)
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