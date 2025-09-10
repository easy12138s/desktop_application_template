const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本 - 安全地暴露API到渲染进程
 * 为渲染进程提供安全的 Electron API 访问
 */

contextBridge.exposeInMainWorld('electronAPI', {
  // 系统信息
  platform: {
    /**
     * 获取当前平台
     * @returns {string} 平台标识
     */
    getPlatform: () => process.platform,
    
    /**
     * 是否为 Windows 系统
     * @returns {boolean}
     */
    isWindows: () => process.platform === 'win32',
    
    /**
     * 是否为 macOS 系统
     * @returns {boolean}
     */
    isMac: () => process.platform === 'darwin',
    
    /**
     * 是否为 Linux 系统
     * @returns {boolean}
     */
    isLinux: () => process.platform === 'linux'
  },

  // 窗口控制相关API
  window: {
    /**
     * 最小化窗口
     */
    minimize: () => ipcRenderer.send('window-minimize'),
    
    /**
     * 最大化窗口
     */
    maximize: () => ipcRenderer.send('window-maximize'),
    
    /**
     * 恢复窗口（取消最大化）
     */
    unmaximize: () => ipcRenderer.send('window-unmaximize'),
    
    /**
     * 关闭窗口
     */
    close: () => ipcRenderer.send('window-close'),
    
    /**
     * 获取窗口状态
     * @returns {Promise} 返回窗口是否最大化
     */
    getWindowState: () => ipcRenderer.invoke('get-window-state')
  },

  // 基础工具方法
  utils: {
    /**
     * 显示消息对话框
     * @param {string} message 消息内容
     * @param {string} type 消息类型
     */
    showMessage: (message, type = 'info') => ipcRenderer.invoke('show-message', { message, type }),
    
    /**
     * 获取用户数据目录
     * @returns {Promise} 目录路径
     */
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    
    /**
     * 打开外部链接
     * @param {string} url 链接地址
     * @returns {Promise} 操作结果
     */
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
  },

  // 数据库API
  database: {
    /**
     * 初始化数据库
     */
    init: async () => {
      try {
        const result = await ipcRenderer.invoke('db-init');
        if (!result.success) {
          throw new Error(result.error);
        }
        return true;
      } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
      }
    },

    /**
     * 执行查询
     */
    query: async (sql, params = []) => {
      try {
        const result = await ipcRenderer.invoke('db-query', sql, params);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('查询失败:', error);
        throw error;
      }
    },

    /**
     * 执行更新
     */
    run: async (sql, params = []) => {
      try {
        const result = await ipcRenderer.invoke('db-run', sql, params);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('执行失败:', error);
        throw error;
      }
    },

    /**
     * 获取单条记录
     */
    get: async (sql, params = []) => {
      try {
        const result = await ipcRenderer.invoke('db-get', sql, params);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('获取数据失败:', error);
        throw error;
      }
    }
  },

  // 用户管理API
  users: {
    /**
     * 初始化用户服务
     */
    initUsers: async () => {
      try {
        const result = await ipcRenderer.invoke('user-init');
        if (!result.success) {
          throw new Error(result.error);
        }
        return true;
      } catch (error) {
        console.error('用户服务初始化失败:', error);
        throw error;
      }
    },

    /**
     * 获取所有用户
     */
    getAllUsers: async () => {
      try {
        const result = await ipcRenderer.invoke('user-get-all');
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        throw error;
      }
    },

    /**
     * 添加用户
     */
    addUser: async (userData) => {
      try {
        const result = await ipcRenderer.invoke('user-add', userData);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('添加用户失败:', error);
        throw error;
      }
    },

    /**
     * 更新用户
     */
    updateUser: async (userData) => {
      try {
        const result = await ipcRenderer.invoke('user-update', userData);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('更新用户失败:', error);
        throw error;
      }
    },

    /**
     * 删除用户
     */
    deleteUser: async (userId) => {
      try {
        const result = await ipcRenderer.invoke('user-delete', userId);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('删除用户失败:', error);
        throw error;
      }
    },

    /**
     * 检查用户名是否存在
     */
    usernameExists: async (username, excludeId) => {
      try {
        const result = await ipcRenderer.invoke('user-username-exists', username, excludeId);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('检查用户名失败:', error);
        throw error;
      }
    },

    /**
     * 检查邮箱是否存在
     */
    emailExists: async (email, excludeId) => {
      try {
        const result = await ipcRenderer.invoke('user-email-exists', email, excludeId);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      } catch (error) {
        console.error('检查邮箱失败:', error);
        throw error;
      }
    }
  }
});