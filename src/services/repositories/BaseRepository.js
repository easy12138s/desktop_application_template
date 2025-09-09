/**
 * 基础Repository类
 * 提供通用的数据库操作方法
 */
class BaseRepository {
  constructor(dbService, tableName) {
    this.db = dbService;
    this.tableName = tableName;
  }

  /**
   * 分页查询
   * @param {Object} options 查询选项
   * @returns {Object} 分页结果
   */
  async paginate(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      searchFields = [],
      orderBy = 'id',
      orderDirection = 'DESC',
      where = '',
      whereParams = []
    } = options;

    const offset = (page - 1) * limit;
    
    // 构建基础查询条件
    let whereClause = where ? `WHERE ${where}` : '';
    let params = [...whereParams];
    
    // 添加搜索条件
    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => `${field} LIKE ?`);
      const searchClause = searchConditions.join(' OR ');
      
      if (whereClause) {
        whereClause += ` AND (${searchClause})`;
      } else {
        whereClause = `WHERE (${searchClause})`;
      }
      
      // 为每个搜索字段添加参数
      searchFields.forEach(() => {
        params.push(`%${search}%`);
      });
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const totalResult = this.db.get(countSql, params);
    const total = totalResult ? totalResult.total : 0;

    // 获取数据
    const dataSql = `
      SELECT * FROM ${this.tableName} 
      ${whereClause} 
      ORDER BY ${orderBy} ${orderDirection} 
      LIMIT ? OFFSET ?
    `;
    const data = this.db.query(dataSql, [...params, limit, offset]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * 根据ID查找记录
   * @param {number} id ID
   * @returns {Object|null} 记录或null
   */
  findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return this.db.get(sql, [id]);
  }

  /**
   * 查找所有记录
   * @param {Object} options 查询选项
   * @returns {Array} 记录数组
   */
  findAll(options = {}) {
    const { orderBy = 'id', orderDirection = 'ASC', limit = null } = options;
    
    let sql = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${orderDirection}`;
    const params = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    return this.db.query(sql, params);
  }

  /**
   * 根据条件查找记录
   * @param {Object} conditions 查询条件
   * @returns {Array} 记录数组
   */
  findWhere(conditions) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) {
      return this.findAll();
    }

    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const values = keys.map(key => conditions[key]);

    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    return this.db.query(sql, values);
  }

  /**
   * 创建新记录
   * @param {Object} data 数据
   * @returns {Object} 创建的记录
   */
  create(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => data[key]);

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')}) 
      VALUES (${placeholders})
    `;
    
    const result = this.db.execute(sql, values);
    
    if (result.lastInsertRowid) {
      return this.findById(result.lastInsertRowid);
    }
    
    throw new Error('创建记录失败');
  }

  /**
   * 更新记录
   * @param {number} id ID
   * @param {Object} data 更新数据
   * @returns {Object|null} 更新后的记录
   */
  update(id, data) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return this.findById(id);
    }

    // 添加更新时间
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    const updateKeys = Object.keys(updateData);
    const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
    const values = updateKeys.map(key => updateData[key]);

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = this.db.execute(sql, [...values, id]);
    
    if (result.changes > 0) {
      return this.findById(id);
    }
    
    return null;
  }

  /**
   * 删除记录
   * @param {number} id ID
   * @returns {boolean} 是否删除成功
   */
  delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = this.db.execute(sql, [id]);
    return result.changes > 0;
  }

  /**
   * 批量删除
   * @param {Array} ids ID数组
   * @returns {number} 删除的记录数
   */
  deleteMany(ids) {
    if (!ids || ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const sql = `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`;
    const result = this.db.execute(sql, ids);
    return result.changes;
  }

  /**
   * 检查记录是否存在
   * @param {number} id ID
   * @returns {boolean} 是否存在
   */
  exists(id) {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = this.db.get(sql, [id]);
    return !!result;
  }

  /**
   * 获取记录总数
   * @param {Object} conditions 查询条件
   * @returns {number} 记录总数
   */
  count(conditions = {}) {
    const keys = Object.keys(conditions);
    
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    let params = [];
    
    if (keys.length > 0) {
      const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params = keys.map(key => conditions[key]);
    }
    
    const result = this.db.get(sql, params);
    return result ? result.total : 0;
  }
}

module.exports = BaseRepository;