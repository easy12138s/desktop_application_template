const BaseRepository = require('./BaseRepository');

/**
 * 用户数据访问层
 */
class UserRepository extends BaseRepository {
  constructor(dbService) {
    super(dbService, 'users');
  }

  /**
   * 根据用户名查找用户
   * @param {string} username 用户名
   * @returns {Object|null} 用户信息
   */
  findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    return this.db.get(sql, [username]);
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email 邮箱
   * @returns {Object|null} 用户信息
   */
  findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return this.db.get(sql, [email]);
  }

  /**
   * 检查用户名是否已存在
   * @param {string} username 用户名
   * @param {number} excludeId 排除的用户ID（用于更新时检查）
   * @returns {boolean} 是否存在
   */
  usernameExists(username, excludeId = null) {
    let sql = 'SELECT 1 FROM users WHERE username = ?';
    let params = [username];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = this.db.get(sql, params);
    return !!result;
  }

  /**
   * 检查邮箱是否已存在
   * @param {string} email 邮箱
   * @param {number} excludeId 排除的用户ID
   * @returns {boolean} 是否存在
   */
  emailExists(email, excludeId = null) {
    if (!email) return false;
    
    let sql = 'SELECT 1 FROM users WHERE email = ?';
    let params = [email];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = this.db.get(sql, params);
    return !!result;
  }

  /**
   * 搜索用户
   * @param {Object} options 搜索选项
   * @returns {Object} 搜索结果
   */
  search(options = {}) {
    const searchOptions = {
      ...options,
      searchFields: ['username', 'email']
    };
    
    return this.paginate(searchOptions);
  }

  /**
   * 获取活跃用户
   * @param {Object} options 查询选项
   * @returns {Array} 用户列表
   */
  getActiveUsers(options = {}) {
    const whereOptions = {
      ...options,
      where: "status = 'active'",
      whereParams: []
    };
    
    return this.paginate(whereOptions);
  }

  /**
   * 更新用户状态
   * @param {number} id 用户ID
   * @param {string} status 状态
   * @returns {Object|null} 更新后的用户信息
   */
  updateStatus(id, status) {
    return this.update(id, { status });
  }

  /**
   * 批量更新用户状态
   * @param {Array} ids 用户ID数组
   * @param {string} status 状态
   * @returns {number} 更新的用户数
   */
  batchUpdateStatus(ids, status) {
    if (!ids || ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const sql = `
      UPDATE users 
      SET status = ?, updated_at = ? 
      WHERE id IN (${placeholders})
    `;
    
    const params = [status, new Date().toISOString(), ...ids];
    const result = this.db.execute(sql, params);
    return result.changes;
  }

  /**
   * 创建用户（重写以添加验证）
   * @param {Object} userData 用户数据
   * @returns {Object} 创建的用户
   */
  create(userData) {
    const { username, email, avatar_url, status = 'active' } = userData;

    // 检查必需字段
    if (!username) {
      throw new Error('用户名不能为空');
    }

    // 检查用户名唯一性
    if (this.usernameExists(username)) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱唯一性
    if (email && this.emailExists(email)) {
      throw new Error('邮箱已存在');
    }

    const newUser = {
      username,
      email: email || null,
      avatar_url: avatar_url || null,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return super.create(newUser);
  }

  /**
   * 更新用户（重写以添加验证）
   * @param {number} id 用户ID
   * @param {Object} userData 更新数据
   * @returns {Object|null} 更新后的用户
   */
  update(id, userData) {
    const { username, email } = userData;

    // 检查用户名唯一性
    if (username && this.usernameExists(username, id)) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱唯一性
    if (email && this.emailExists(email, id)) {
      throw new Error('邮箱已存在');
    }

    return super.update(id, userData);
  }

  /**
   * 获取用户统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const totalSql = 'SELECT COUNT(*) as total FROM users';
    const activeSql = "SELECT COUNT(*) as active FROM users WHERE status = 'active'";
    const inactiveSql = "SELECT COUNT(*) as inactive FROM users WHERE status = 'inactive'";
    
    const total = this.db.get(totalSql)?.total || 0;
    const active = this.db.get(activeSql)?.active || 0;
    const inactive = this.db.get(inactiveSql)?.inactive || 0;
    
    return {
      total,
      active,
      inactive,
      activeRate: total > 0 ? (active / total * 100).toFixed(2) : 0
    };
  }

  /**
   * 获取最近创建的用户
   * @param {number} limit 数量限制
   * @returns {Array} 用户列表
   */
  getRecentUsers(limit = 10) {
    const sql = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    return this.db.query(sql, [limit]);
  }
}

module.exports = UserRepository;