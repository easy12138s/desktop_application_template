'use strict'

import { app, protocol, BrowserWindow, ipcMain, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path')
const isDevelopment = process.env.NODE_ENV !== 'production'

// 引入数据库服务
const { getDatabase } = require('./services/database.js')
const { getUserService } = require('./services/userService.js')

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 移除默认标题栏
    titleBarStyle: 'hidden', // 隐藏标题栏
    webPreferences: {
      // 为了安全性，始终启用contextIsolation
      nodeIntegration: false,
      contextIsolation: true,
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

// 注册简化版的IPC处理器
function registerIpcHandlers() {
  // 获取用户数据目录
  ipcMain.handle('get-user-data-path', async () => {
    return app.getPath('userData')
  })

  // 显示消息对话框
  ipcMain.handle('show-message', async (event, { message, type }) => {
    console.log(`${type.toUpperCase()}: ${message}`)
  })

  // 打开外部链接
  ipcMain.handle('open-external', async (event, url) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 窗口控制
  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.maximize()
  })

  ipcMain.on('window-unmaximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.unmaximize()
  })

  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  // 获取窗口状态
  ipcMain.handle('get-window-state', async () => {
    const win = BrowserWindow.getFocusedWindow()
    return win ? win.isMaximized() : false
  })

  // 数据库相关IPC处理器
  ipcMain.handle('db-init', async () => {
    try {
      const db = getDatabase()
      await db.init()
      return { success: true }
    } catch (error) {
      console.error('数据库初始化失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db-query', async (event, sql, params = []) => {
    try {
      const db = getDatabase()
      const result = await db.all(sql, params)
      return { success: true, data: result }
    } catch (error) {
      console.error('数据库查询失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db-run', async (event, sql, params = []) => {
    try {
      const db = getDatabase()
      const result = await db.run(sql, params)
      return { success: true, data: result }
    } catch (error) {
      console.error('数据库执行失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db-get', async (event, sql, params = []) => {
    try {
      const db = getDatabase()
      const result = await db.get(sql, params)
      return { success: true, data: result }
    } catch (error) {
      console.error('数据库获取失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 用户管理相关IPC处理器
  ipcMain.handle('user-init', async () => {
    try {
      const userService = getUserService()
      await userService.init()
      return { success: true }
    } catch (error) {
      console.error('用户服务初始化失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('user-get-all', async () => {
    try {
      const userService = getUserService()
      const result = await userService.getAllUsers()
      return { success: true, data: result }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('user-add', async (event, userData) => {
    try {
      const userService = getUserService()
      const result = await userService.addUser(userData)
      return { success: true, data: result }
    } catch (error) {
      console.error('添加用户失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('user-update', async (event, userData) => {
    try {
      const userService = getUserService()
      const result = await userService.updateUser(userData)
      return { success: true, data: result }
    } catch (error) {
      console.error('更新用户失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('user-delete', async (event, userId) => {
    try {
      const userService = getUserService()
      const result = await userService.deleteUser(userId)
      return { success: true, data: result }
    } catch (error) {
      console.error('删除用户失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('user-username-exists', async (event, username, excludeId) => {
    try {
      const userService = getUserService()
      const result = await userService.usernameExists(username, excludeId)
      return { success: true, data: result }
    } catch (error) {
      console.error('检查用户名失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('user-email-exists', async (event, email, excludeId) => {
    try {
      const userService = getUserService()
      const result = await userService.emailExists(email, excludeId)
      return { success: true, data: result }
    } catch (error) {
      console.error('检查邮箱失败:', error)
      return { success: false, error: error.message }
    }
  })
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  try {
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
  } catch (error) {
    console.error('❌ 应用启动失败:', error.message)
    process.exit(1)
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
