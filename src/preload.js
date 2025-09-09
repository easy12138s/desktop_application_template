const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本 - 安全地暴露API到渲染进程
 * 为渲染进程提供安全的 Electron API 访问
 */

contextBridge.exposeInMainWorld('electronAPI', {
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
  }
});