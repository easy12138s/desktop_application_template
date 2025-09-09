'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path')
const isDevelopment = process.env.NODE_ENV !== 'production'

// 导入数据库服务和Repository
const DatabaseService = require('./services/database')
const UserRepository = require('./services/repositories/UserRepository')
const DocumentRepository = require('./services/repositories/DocumentRepository')
const SettingsRepository = require('./services/repositories/SettingsRepository')

// 导入验证器
const UserValidator = require('./services/validators/UserValidator')
const DocumentValidator = require('./services/validators/DocumentValidator')
const SettingsValidator = require('./services/validators/SettingsValidator')

let dbService = null
let userRepository = null
let documentRepository = null
let settingsRepository = null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      // 启用预加载脚本
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// 初始化数据库服务
function initDatabase() {
  try {
    dbService = new DatabaseService()
    
    // 初始化Repository层
    userRepository = new UserRepository(dbService)
    documentRepository = new DocumentRepository(dbService)
    settingsRepository = new SettingsRepository(dbService)
    
    console.log('✅ 数据库服务和Repository层初始化成功')
  } catch (error) {
    console.error('❌ 数据库服务初始化失败:', error.message)
  }
}

// 注册IPC处理器
function registerIpcHandlers() {
  // ===================
  // 用户管理API
  // ===================
  
  // 获取用户列表
  ipcMain.handle('users-list', async (event, options = {}) => {
    try {
      const validation = UserValidator.validateSearchParams(options)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError() }
      }
      
      const result = userRepository.search(options)
      return { success: true, data: result }
    } catch (error) {
      console.error('获取用户列表错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取用户详情
  ipcMain.handle('users-get', async (event, id) => {
    try {
      const user = userRepository.findById(id)
      return { success: true, data: user }
    } catch (error) {
      console.error('获取用户详情错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 创建用户
  ipcMain.handle('users-create', async (event, userData) => {
    try {
      const validation = UserValidator.validate(userData, false)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError(), validation: validation.toObject() }
      }
      
      const sanitizedData = UserValidator.sanitize(userData)
      const user = userRepository.create(sanitizedData)
      return { success: true, data: user }
    } catch (error) {
      console.error('创建用户错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 更新用户
  ipcMain.handle('users-update', async (event, { id, userData }) => {
    try {
      const validation = UserValidator.validate(userData, true)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError(), validation: validation.toObject() }
      }
      
      const sanitizedData = UserValidator.sanitize(userData)
      const user = userRepository.update(id, sanitizedData)
      return { success: true, data: user }
    } catch (error) {
      console.error('更新用户错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 删除用户
  ipcMain.handle('users-delete', async (event, id) => {
    try {
      const success = userRepository.delete(id)
      return { success }
    } catch (error) {
      console.error('删除用户错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 批量操作用户
  ipcMain.handle('users-batch', async (event, { operation, ids, data }) => {
    try {
      const validation = UserValidator.validateBatchOperation(ids, operation)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError() }
      }
      
      let result
      switch (operation) {
        case 'delete':
          result = userRepository.deleteMany(ids)
          break
        case 'activate':
          result = userRepository.batchUpdateStatus(ids, 'active')
          break
        case 'deactivate':
          result = userRepository.batchUpdateStatus(ids, 'inactive')
          break
        default:
          return { success: false, error: '不支持的操作类型' }
      }
      
      return { success: true, data: { affected: result } }
    } catch (error) {
      console.error('批量操作用户错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取用户统计
  ipcMain.handle('users-statistics', async () => {
    try {
      const stats = userRepository.getStatistics()
      return { success: true, data: stats }
    } catch (error) {
      console.error('获取用户统计错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // ===================
  // 文档管理API
  // ===================
  
  // 获取文档列表
  ipcMain.handle('documents-list', async (event, options = {}) => {
    try {
      const validation = DocumentValidator.validateSearchParams(options)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError() }
      }
      
      const result = documentRepository.search(options)
      return { success: true, data: result }
    } catch (error) {
      console.error('获取文档列表错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取文档详情
  ipcMain.handle('documents-get', async (event, id) => {
    try {
      const document = documentRepository.getDetailById(id)
      return { success: true, data: document }
    } catch (error) {
      console.error('获取文档详情错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 创建文档
  ipcMain.handle('documents-create', async (event, docData) => {
    try {
      const validation = DocumentValidator.validate(docData, false)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError(), validation: validation.toObject() }
      }
      
      const sanitizedData = DocumentValidator.sanitize(docData)
      const document = documentRepository.create(sanitizedData)
      return { success: true, data: document }
    } catch (error) {
      console.error('创建文档错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 更新文档
  ipcMain.handle('documents-update', async (event, { id, docData }) => {
    try {
      const validation = DocumentValidator.validate(docData, true)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError(), validation: validation.toObject() }
      }
      
      const sanitizedData = DocumentValidator.sanitize(docData)
      const document = documentRepository.update(id, sanitizedData)
      return { success: true, data: document }
    } catch (error) {
      console.error('更新文档错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 删除文档
  ipcMain.handle('documents-delete', async (event, id) => {
    try {
      const success = documentRepository.delete(id)
      return { success }
    } catch (error) {
      console.error('删除文档错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 批量操作文档
  ipcMain.handle('documents-batch', async (event, { operation, ids, data }) => {
    try {
      const validation = DocumentValidator.validateBatchOperation(ids, operation, data)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError() }
      }
      
      let result
      switch (operation) {
        case 'delete':
          result = documentRepository.deleteMany(ids)
          break
        case 'updateCategory':
          result = documentRepository.batchUpdateCategory(ids, data)
          break
        default:
          return { success: false, error: '不支持的操作类型' }
      }
      
      return { success: true, data: { affected: result } }
    } catch (error) {
      console.error('批量操作文档错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取文档分类
  ipcMain.handle('documents-categories', async () => {
    try {
      const categories = documentRepository.getCategories()
      return { success: true, data: categories }
    } catch (error) {
      console.error('获取文档分类错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取文档标签
  ipcMain.handle('documents-tags', async () => {
    try {
      const tags = documentRepository.getTags()
      return { success: true, data: tags }
    } catch (error) {
      console.error('获取文档标签错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取文档统计
  ipcMain.handle('documents-statistics', async () => {
    try {
      const stats = documentRepository.getStatistics()
      return { success: true, data: stats }
    } catch (error) {
      console.error('获取文档统计错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // ===================
  // 设置管理API
  // ===================
  
  // 获取设置列表
  ipcMain.handle('settings-list', async (event, options = {}) => {
    try {
      const validation = SettingsValidator.validateSearchParams(options)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError() }
      }
      
      const result = settingsRepository.getList(options)
      return { success: true, data: result }
    } catch (error) {
      console.error('获取设置列表错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取设置值
  ipcMain.handle('settings-get', async (event, key) => {
    try {
      const setting = settingsRepository.findByKey(key)
      return { success: true, data: setting }
    } catch (error) {
      console.error('获取设置错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 设置值
  ipcMain.handle('settings-set', async (event, { key, value, description, data_type }) => {
    try {
      const validation = SettingsValidator.validate({ key, value, description, data_type })
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError(), validation: validation.toObject() }
      }
      
      const sanitizedData = SettingsValidator.sanitize({ key, value, description, data_type })
      const setting = settingsRepository.setValue(
        sanitizedData.key,
        sanitizedData.value,
        sanitizedData.description,
        sanitizedData.data_type
      )
      return { success: true, data: setting }
    } catch (error) {
      console.error('设置值错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 删除设置
  ipcMain.handle('settings-delete', async (event, key) => {
    try {
      const success = settingsRepository.deleteByKey(key)
      return { success }
    } catch (error) {
      console.error('删除设置错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 批量设置
  ipcMain.handle('settings-batch-set', async (event, settings) => {
    try {
      const validation = SettingsValidator.validateBatchOperation(settings)
      if (!validation.isValid) {
        return { success: false, error: validation.getFirstError() }
      }
      
      const result = settingsRepository.setMultiple(settings)
      return { success: true, data: result }
    } catch (error) {
      console.error('批量设置错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取所有设置
  ipcMain.handle('settings-all', async () => {
    try {
      const settings = settingsRepository.getAll()
      return { success: true, data: settings }
    } catch (error) {
      console.error('获取所有设置错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 导出设置
  ipcMain.handle('settings-export', async () => {
    try {
      const settings = settingsRepository.exportSettings()
      return { success: true, data: settings }
    } catch (error) {
      console.error('导出设置错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // ===================
  // 原有数据库API（兼容性）
  // ===================
  
  // 数据库执行处理器
  ipcMain.handle('database-execute', async (event, { sql, params }) => {
    try {
      const result = dbService.execute(sql, params)
      return { success: true, data: result }
    } catch (error) {
      console.error('数据库执行错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 数据库查询处理器
  ipcMain.handle('database-query', async (event, { sql, params }) => {
    try {
      const result = dbService.query(sql, params)
      return { success: true, data: result }
    } catch (error) {
      console.error('数据库查询错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 数据库事务处理器
  ipcMain.handle('database-transaction', async (event, operations) => {
    try {
      const result = dbService.executeTransaction(operations)
      return result
    } catch (error) {
      console.error('数据库事务错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 数据库备份处理器
  ipcMain.handle('database-backup', async (event, backupPath) => {
    try {
      await dbService.backup(backupPath)
      return { success: true }
    } catch (error) {
      console.error('数据库备份错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 获取数据库信息
  ipcMain.handle('database-info', async () => {
    try {
      const info = dbService.getInfo()
      return { success: true, data: info }
    } catch (error) {
      console.error('获取数据库信息错误:', error.message)
      return { success: false, error: error.message }
    }
  })

  // ===================
  // 系统工具API
  // ===================
  
  // 获取用户数据目录
  ipcMain.handle('get-user-data-path', async () => {
    return app.getPath('userData')
  })

  // 显示消息对话框
  ipcMain.handle('show-message', async (event, { message, type }) => {
    console.log(`${type.toUpperCase()}: ${message}`)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // 初始化数据库
  initDatabase()
  
  // 注册IPC处理器
  registerIpcHandlers()
  
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// 应用退出时关闭数据库连接
app.on('will-quit', () => {
  if (dbService) {
    dbService.close()
  }
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
