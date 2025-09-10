/**
 * 用户API服务
 * 封装用户相关的数据库操作
 */

const { getDatabase } = require('./database.js')

class UserService {
  constructor() {
    this.db = null
  }

  /**
   * 初始化数据库连接
   */
  async init() {
    this.db = getDatabase()
    await this.db.init()
  }

  /**
   * 获取所有用户
   */
  async getAllUsers() {
    return await this.db.all('SELECT * FROM users ORDER BY created_at DESC')
  }

  /**
   * 添加用户
   */
  async addUser(user) {
    const result = await this.db.run(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      [user.username, user.email]
    )
    return {
      id: result.lastID,
      ...user,
      created_at: new Date().toISOString()
    }
  }

  /**
   * 更新用户
   */
  async updateUser(user) {
    await this.db.run(
      'UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.username, user.email, user.id]
    )
    return user
  }

  /**
   * 删除用户
   */
  async deleteUser(id) {
    const result = await this.db.run('DELETE FROM users WHERE id = ?', [id])
    return result.changes > 0
  }

  /**
   * 检查用户名是否存在
   */
  async usernameExists(username, excludeId = null) {
    const sql = excludeId 
      ? 'SELECT id FROM users WHERE username = ? AND id != ?'
      : 'SELECT id FROM users WHERE username = ?'
    const params = excludeId ? [username, excludeId] : [username]
    
    const user = await this.db.get(sql, params)
    return !!user
  }

  /**
   * 检查邮箱是否存在
   */
  async emailExists(email, excludeId = null) {
    const sql = excludeId 
      ? 'SELECT id FROM users WHERE email = ? AND id != ?'
      : 'SELECT id FROM users WHERE email = ?'
    const params = excludeId ? [email, excludeId] : [email]
    
    const user = await this.db.get(sql, params)
    return !!user
  }
}

// 创建单例实例
let instance = null

const getUserService = () => {
  if (!instance) {
    instance = new UserService()
  }
  return instance
}

module.exports = {
  UserService,
  getUserService
}