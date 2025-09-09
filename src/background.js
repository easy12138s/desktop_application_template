'use strict'

import { app, protocol, BrowserWindow, ipcMain, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path')
const isDevelopment = process.env.NODE_ENV !== 'production'

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
  ipcMain.handle('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.maximize()
  })

  ipcMain.handle('window-unmaximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.unmaximize()
  })

  ipcMain.handle('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  // 监听窗口状态变化
  ipcMain.on('get-window-state', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      event.reply('window-maximized', win.isMaximized())
      event.reply('window-unmaximized', !win.isMaximized())
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
