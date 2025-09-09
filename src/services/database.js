const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

/**
 * 增强的数据库服务类
 * 专用于处理better-sqlite3数据库的连接和操作
 */
class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = this.getDatabasePath();
    this.isConnected = false;
    this.init();
  }

  /**
   * 获取数据库文件路径
   * 使用Electron的用户数据目录确保跨平台兼容性
   */
  getDatabasePath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'app.db');
  }

  /**
   * 初始化数据库连接
   */
  init() {
    try {
      // 配置数据库选项
      const options = {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null,
        fileMustExist: false,
        timeout: 5000,
        readonly: false
      };
      
      this.db = new Database(this.dbPath, options);
      
      // 配置数据库性能优化
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = MEMORY');
      
      this.isConnected = true;
      console.log('✅ Better-sqlite3数据库连接成功');
      console.log(`📁 数据库路径: ${this.dbPath}`);
      
      this.createTables();
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error.message);
      throw new Error(`数据库初始化失败: ${error.message}`);
    }
  }

  /**
   * 创建数据表
   */
  createTables() {
    const tables = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        avatar_url TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 文档表
      `CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        category TEXT DEFAULT 'default',
        tags TEXT DEFAULT '[]',
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )`,
      // 设置表
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        description TEXT,
        data_type TEXT DEFAULT 'string' CHECK(data_type IN ('string', 'number', 'boolean', 'json')),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)',
      'CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)'
    ];

    try {
      // 创建表
      tables.forEach(sql => {
        this.db.exec(sql);
      });
      
      // 创建索引
      indexes.forEach(sql => {
        this.db.exec(sql);
      });
      
      console.log('✅ 数据库表和索引初始化完成');
    } catch (error) {
      console.error('❌ 创建数据表失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行查询操作
   * @param {string} sql SQL语句
   * @param {Array} params 参数数组
   * @returns {Array} 查询结果
   */
  query(sql, params = []) {
    this.validateConnection();
    try {
      const stmt = this.db.prepare(sql);
      return params.length > 0 ? stmt.all(params) : stmt.all();
    } catch (error) {
      console.error('❌ 数据库查询错误:', error.message);
      throw new Error(`查询失败: ${error.message}`);
    }
  }

  /**
   * 执行更新/插入/删除操作
   * @param {string} sql SQL语句
   * @param {Array} params 参数数组
   * @returns {Object} 执行结果
   */
  execute(sql, params = []) {
    this.validateConnection();
    try {
      const stmt = this.db.prepare(sql);
      const result = params.length > 0 ? stmt.run(params) : stmt.run();
      return {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
    } catch (error) {
      console.error('❌ 数据库执行错误:', error.message);
      throw new Error(`执行失败: ${error.message}`);
    }
  }

  /**
   * 获取单个记录
   * @param {string} sql SQL语句
   * @param {Array} params 参数数组
   * @returns {Object|null} 查询结果
   */
  get(sql, params = []) {
    this.validateConnection();
    try {
      const stmt = this.db.prepare(sql);
      return params.length > 0 ? stmt.get(params) : stmt.get();
    } catch (error) {
      console.error('❌ 数据库获取错误:', error.message);
      throw new Error(`获取失败: ${error.message}`);
    }
  }

  /**
   * 验证数据库连接状态
   */
  validateConnection() {
    if (!this.isConnected || !this.db) {
      throw new Error('数据库连接未建立');
    }
  }

  /**
   * 执行事务
   * @param {Array} operations 操作数组 [{sql: string, params: array, type: 'execute'|'query'}]
   * @returns {Object} 执行结果
   */
  executeTransaction(operations) {
    this.validateConnection();
    
    const transaction = this.db.transaction((ops) => {
      const results = [];
      
      for (const op of ops) {
        try {
          const stmt = this.db.prepare(op.sql);
          const params = op.params || [];
          
          if (op.type === 'query') {
            results.push(params.length > 0 ? stmt.all(params) : stmt.all());
          } else {
            const result = params.length > 0 ? stmt.run(params) : stmt.run();
            results.push({
              changes: result.changes,
              lastInsertRowid: result.lastInsertRowid
            });
          }
        } catch (error) {
          throw new Error(`事务操作失败: ${error.message}`);
        }
      }
      
      return results;
    });
    
    try {
      const results = transaction(operations);
      return { success: true, results };
    } catch (error) {
      console.error('❌ 事务执行失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db && this.isConnected) {
      try {
        this.db.close();
        this.isConnected = false;
        console.log('✅ 数据库连接已关闭');
      } catch (error) {
        console.error('❌ 关闭数据库连接失败:', error.message);
      }
    }
  }

  /**
   * 备份数据库
   * @param {string} backupPath 备份路径
   * @returns {Promise<boolean>} 备份结果
   */
  async backup(backupPath) {
    this.validateConnection();
    
    try {
      const fs = require('fs').promises;
      await fs.copyFile(this.dbPath, backupPath);
      console.log(`✅ 数据库已备份到: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('❌ 数据库备份失败:', error.message);
      throw new Error(`备份失败: ${error.message}`);
    }
  }

  /**
   * 获取数据库信息
   * @returns {Object} 数据库信息
   */
  getInfo() {
    this.validateConnection();
    
    return {
      path: this.dbPath,
      isConnected: this.isConnected,
      tables: this.getTables(),
      size: this.getSize()
    };
  }

  /**
   * 获取所有表名
   * @returns {Array} 表名数组
   */
  getTables() {
    try {
      const result = this.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      return result.map(row => row.name);
    } catch (error) {
      console.error('❌ 获取表列表失败:', error.message);
      return [];
    }
  }

  /**
   * 获取数据库文件大小
   * @returns {number} 文件大小（字节）
   */
  getSize() {
    try {
      const fs = require('fs');
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    } catch (error) {
      console.error('❌ 获取数据库大小失败:', error.message);
      return 0;
    }
  }
}

module.exports = DatabaseService;