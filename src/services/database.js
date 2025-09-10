/**
 * 简洁数据库服务模块
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

class DatabaseManager {
  constructor() {
    this.db = null
    this.dbPath = null
  }

  /**
   * 获取数据库路径
   */
  getDbPath() {
    // 在预加载脚本中，使用固定的相对路径或从主进程获取
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      // 开发环境使用项目根目录
      return path.join(__dirname, '../../user_data/app.db')
    } else {
      // 生产环境使用用户数据目录，通过IPC获取
      // 这里假设预加载脚本会设置好路径
      const userDataPath = process.env.USER_DATA_PATH || path.join(__dirname, '../../user_data')
      return path.join(userDataPath, 'app.db')
    }
  }

  /**
   * 初始化数据库连接
   */
  async init() {
    if (this.db) return

    const dbPath = this.getDbPath()
    
    // 确保目录存在
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    try {
      this.db = new Database(dbPath)
      console.log('数据库连接成功:', dbPath)
      await this.initTables()
    } catch (error) {
      console.error('数据库连接失败:', error)
      throw error
    }
  }

  /**
   * 初始化基础表
   */
  async initTables() {
    // 用户表
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 设置表
    await this.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 日志表
    await this.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        message TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  /**
   * 查询所有记录
   */
  async all(sql, params = []) {
    const stmt = this.db.prepare(sql)
    return stmt.all(params)
  }

  /**
   * 查询单条记录
   */
  async get(sql, params = []) {
    const stmt = this.db.prepare(sql)
    return stmt.get(params)
  }

  /**
   * 执行更新操作
   */
  async run(sql, params = []) {
    const stmt = this.db.prepare(sql)
    const result = stmt.run(params)
    return { lastID: result.lastInsertRowid, changes: result.changes }
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    if (this.db) {
      this.db.close()
      console.log('数据库连接已关闭')
      this.db = null
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      connected: !!this.db,
      path: this.dbPath
    }
  }
}

// 单例模式
let dbInstance = null

const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance
}

module.exports = {
  DatabaseManager,
  getDatabase
}