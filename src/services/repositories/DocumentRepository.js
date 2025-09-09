const BaseRepository = require('./BaseRepository');

/**
 * 文档数据访问层
 */
class DocumentRepository extends BaseRepository {
  constructor(dbService) {
    super(dbService, 'documents');
  }

  /**
   * 根据用户ID查找文档
   * @param {number} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Object} 分页结果
   */
  findByUserId(userId, options = {}) {
    const whereOptions = {
      ...options,
      where: 'user_id = ?',
      whereParams: [userId]
    };
    
    return this.paginate(whereOptions);
  }

  /**
   * 根据分类查找文档
   * @param {string} category 分类
   * @param {Object} options 查询选项
   * @returns {Object} 分页结果
   */
  findByCategory(category, options = {}) {
    const whereOptions = {
      ...options,
      where: 'category = ?',
      whereParams: [category]
    };
    
    return this.paginate(whereOptions);
  }

  /**
   * 根据标签查找文档
   * @param {string} tag 标签
   * @param {Object} options 查询选项
   * @returns {Object} 分页结果
   */
  findByTag(tag, options = {}) {
    const whereOptions = {
      ...options,
      where: 'tags LIKE ?',
      whereParams: [`%"${tag}"%`]
    };
    
    return this.paginate(whereOptions);
  }

  /**
   * 搜索文档
   * @param {Object} options 搜索选项
   * @returns {Object} 搜索结果
   */
  search(options = {}) {
    const searchOptions = {
      ...options,
      searchFields: ['title', 'content', 'category']
    };
    
    return this.paginate(searchOptions);
  }

  /**
   * 获取文档详细信息（包含用户信息）
   * @param {number} id 文档ID
   * @returns {Object|null} 文档详情
   */
  getDetailById(id) {
    const sql = `
      SELECT 
        d.*,
        u.username,
        u.email as user_email
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `;
    
    return this.db.get(sql, [id]);
  }

  /**
   * 获取所有分类
   * @returns {Array} 分类列表
   */
  getCategories() {
    const sql = `
      SELECT 
        category,
        COUNT(*) as count
      FROM documents 
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category 
      ORDER BY count DESC, category ASC
    `;
    
    return this.db.query(sql);
  }

  /**
   * 获取所有标签
   * @returns {Array} 标签列表
   */
  getTags() {
    const sql = 'SELECT tags FROM documents WHERE tags IS NOT NULL AND tags != "[]"';
    const results = this.db.query(sql);
    
    const tagCount = {};
    
    results.forEach(row => {
      try {
        const tags = JSON.parse(row.tags);
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            if (tag && typeof tag === 'string') {
              tagCount[tag] = (tagCount[tag] || 0) + 1;
            }
          });
        }
      } catch (e) {
        // 忽略JSON解析错误
      }
    });
    
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 创建文档（重写以处理标签）
   * @param {Object} docData 文档数据
   * @returns {Object} 创建的文档
   */
  create(docData) {
    const {
      title,
      content = '',
      category = 'default',
      tags = [],
      user_id
    } = docData;

    if (!title) {
      throw new Error('文档标题不能为空');
    }

    const newDoc = {
      title,
      content,
      category,
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      user_id: user_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return super.create(newDoc);
  }

  /**
   * 更新文档（重写以处理标签）
   * @param {number} id 文档ID
   * @param {Object} docData 更新数据
   * @returns {Object|null} 更新后的文档
   */
  update(id, docData) {
    const updateData = { ...docData };
    
    // 处理标签
    if (updateData.tags !== undefined) {
      updateData.tags = JSON.stringify(Array.isArray(updateData.tags) ? updateData.tags : []);
    }

    return super.update(id, updateData);
  }

  /**
   * 批量更新文档分类
   * @param {Array} ids 文档ID数组
   * @param {string} category 新分类
   * @returns {number} 更新的文档数
   */
  batchUpdateCategory(ids, category) {
    if (!ids || ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const sql = `
      UPDATE documents 
      SET category = ?, updated_at = ? 
      WHERE id IN (${placeholders})
    `;
    
    const params = [category, new Date().toISOString(), ...ids];
    const result = this.db.execute(sql, params);
    return result.changes;
  }

  /**
   * 根据用户删除所有文档
   * @param {number} userId 用户ID
   * @returns {number} 删除的文档数
   */
  deleteByUserId(userId) {
    const sql = 'DELETE FROM documents WHERE user_id = ?';
    const result = this.db.execute(sql, [userId]);
    return result.changes;
  }

  /**
   * 获取文档统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const totalSql = 'SELECT COUNT(*) as total FROM documents';
    const categorySql = `
      SELECT 
        COUNT(DISTINCT category) as categories
      FROM documents 
      WHERE category IS NOT NULL AND category != ''
    `;
    
    const total = this.db.get(totalSql)?.total || 0;
    const categories = this.db.get(categorySql)?.categories || 0;
    
    // 计算标签数量
    const tags = this.getTags();
    const tagCount = tags.length;
    
    return {
      total,
      categories,
      tags: tagCount,
      averageContentLength: this.getAverageContentLength()
    };
  }

  /**
   * 获取平均内容长度
   * @returns {number} 平均长度
   */
  getAverageContentLength() {
    const sql = `
      SELECT AVG(LENGTH(content)) as avg_length 
      FROM documents 
      WHERE content IS NOT NULL
    `;
    
    const result = this.db.get(sql);
    return result ? Math.round(result.avg_length || 0) : 0;
  }

  /**
   * 获取最近更新的文档
   * @param {number} limit 数量限制
   * @returns {Array} 文档列表
   */
  getRecentDocuments(limit = 10) {
    const sql = `
      SELECT 
        d.*,
        u.username
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.updated_at DESC 
      LIMIT ?
    `;
    
    return this.db.query(sql, [limit]);
  }

  /**
   * 全文搜索文档
   * @param {string} keyword 关键词
   * @param {Object} options 查询选项
   * @returns {Object} 搜索结果
   */
  fullTextSearch(keyword, options = {}) {
    if (!keyword) {
      return this.paginate(options);
    }

    const searchOptions = {
      ...options,
      search: keyword,
      searchFields: ['title', 'content', 'category']
    };
    
    return this.paginate(searchOptions);
  }
}

module.exports = DocumentRepository;