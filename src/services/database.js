const path = require('path');
const { app } = require('electron');

/**
 * 数据库服务类
 * 处理SQLite数据库的连接和操作
 */
class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = this.getDatabasePath();
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
      // 尝试使用better-sqlite3
      const Database = require('better-sqlite3');
      this.db = new Database(this.dbPath);
      console.log('✅ Better-sqlite3数据库连接成功');
      this.createTables();
    } catch (error) {
      console.warn('⚠️ Better-sqlite3加载失败，尝试使用sql.js:', error.message);
      this.fallbackToSqlJs();
    }
  }

  /**
   * 降级方案：使用sql.js
   */
  fallbackToSqlJs() {
    try {
      const initSqlJs = require('sql.js');
      const fs = require('fs');
      
      // 如果数据库文件存在，读取内容
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath);
        this.db = new initSqlJs.Database(data);
      } else {
        this.db = new initSqlJs.Database();
      }
      console.log('✅ SQL.js数据库连接成功（降级模式）');
      this.createTables();
    } catch (error) {
      console.error('❌ 所有数据库方案均失败:', error.message);
      throw new Error('数据库初始化失败');
    }
  }

  /**
   * 创建数据表
   */
  createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    tables.forEach(sql => {
      this.execute(sql);
    });
    
    console.log('✅ 数据库表初始化完成');
  }

  /**
   * 执行SQL查询
   * @param {string} sql SQL语句
   * @param {Array} params 参数数组
   * @returns {Object} 执行结果
   */
  execute(sql, params = []) {
    try {
      if (this.db.constructor.name === 'Database') {
        // better-sqlite3
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          const stmt = this.db.prepare(sql);
          return params.length > 0 ? stmt.all(...params) : stmt.all();
        } else {
          const stmt = this.db.prepare(sql);
          return params.length > 0 ? stmt.run(...params) : stmt.run();
        }
      } else {
        // sql.js
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          return this.db.exec(sql, params);
        } else {
          this.db.run(sql, params);
          return { changes: this.db.getRowsModified() };
        }
      }
    } catch (error) {
      console.error('❌ 数据库执行错误:', error.message);
      throw error;
    }
  }

  /**
   * 执行事务
   * @param {Array} operations 操作数组 [{sql: string, params: array}]
   * @returns {boolean} 是否成功
   */
  executeTransaction(operations) {
    try {
      if (this.db.constructor.name === 'Database') {
        // better-sqlite3事务
        const transaction = this.db.transaction(() => {
          operations.forEach(op => {
            const stmt = this.db.prepare(op.sql);
            stmt.run(...(op.params || []));
          });
        });
        transaction();
        return true;
      } else {
        // sql.js事务（模拟）
        operations.forEach(op => {
          this.execute(op.sql, op.params || []);
        });
        return true;
      }
    } catch (error) {
      console.error('❌ 事务执行失败:', error.message);
      return false;
    }
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      if (this.db.constructor.name === 'Database') {
        this.db.close();
      } else {
        // sql.js需要手动保存
        const fs = require('fs');
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
      }
      console.log('✅ 数据库连接已关闭');
    }
  }

  /**
   * 备份数据库
   * @param {string} backupPath 备份路径
   */
  backup(backupPath) {
    const fs = require('fs');
    if (fs.existsSync(this.dbPath)) {
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`✅ 数据库已备份到: ${backupPath}`);
    }
  }
}

module.exports = DatabaseService;