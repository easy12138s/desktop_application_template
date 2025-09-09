import BaseApiService from './BaseApiService';

/**
 * 文档API服务
 */
class DocumentApiService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * 获取文档列表
   * @param {Object} options 查询选项
   * @returns {Promise} 文档列表数据
   */
  async getDocuments(options = {}) {
    return this.handleResponse(
      this.api.documents.list(options)
    );
  }

  /**
   * 搜索文档
   * @param {string} keyword 搜索关键词
   * @param {Object} filters 过滤条件
   * @returns {Promise} 搜索结果
   */
  async searchDocuments(keyword = '', filters = {}) {
    const options = {
      search: keyword,
      ...filters
    };
    return this.getDocuments(options);
  }

  /**
   * 获取分页文档列表
   * @param {number} page 页码
   * @param {number} limit 每页数量
   * @param {Object} filters 过滤条件
   * @returns {Promise} 分页结果
   */
  async getDocumentsPaginated(page = 1, limit = 10, filters = {}) {
    const options = {
      page,
      limit,
      ...filters
    };
    return this.getDocuments(options);
  }

  /**
   * 获取文档详情
   * @param {number} id 文档ID
   * @returns {Promise} 文档信息
   */
  async getDocument(id) {
    return this.handleResponse(
      this.api.documents.get(id)
    );
  }

  /**
   * 创建文档
   * @param {Object} docData 文档数据
   * @returns {Promise} 创建的文档信息
   */
  async createDocument(docData) {
    try {
      const result = await this.handleValidatedResponse(
        this.api.documents.create(docData)
      );
      this.showSuccess('文档创建成功');
      return result.data;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 更新文档
   * @param {number} id 文档ID
   * @param {Object} docData 文档数据
   * @returns {Promise} 更新的文档信息
   */
  async updateDocument(id, docData) {
    try {
      const result = await this.handleValidatedResponse(
        this.api.documents.update(id, docData)
      );
      this.showSuccess('文档更新成功');
      return result.data;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 删除文档
   * @param {number} id 文档ID
   * @returns {Promise} 删除结果
   */
  async deleteDocument(id) {
    try {
      await this.handleResponse(
        this.api.documents.delete(id)
      );
      this.showSuccess('文档删除成功');
      return true;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 批量删除文档
   * @param {Array} ids 文档ID数组
   * @returns {Promise} 删除结果
   */
  async deleteDocuments(ids) {
    try {
      const result = await this.handleResponse(
        this.api.documents.batch('delete', ids)
      );
      this.showSuccess(`成功删除 ${result.affected} 个文档`);
      return result;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 批量更新文档分类
   * @param {Array} ids 文档ID数组
   * @param {string} category 新分类
   * @returns {Promise} 更新结果
   */
  async updateDocumentsCategory(ids, category) {
    try {
      const result = await this.handleResponse(
        this.api.documents.batch('updateCategory', ids, category)
      );
      this.showSuccess(`成功更新 ${result.affected} 个文档的分类`);
      return result;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 获取文档分类列表
   * @returns {Promise} 分类列表
   */
  async getCategories() {
    return this.handleResponse(
      this.api.documents.categories()
    );
  }

  /**
   * 获取文档标签列表
   * @returns {Promise} 标签列表
   */
  async getTags() {
    return this.handleResponse(
      this.api.documents.tags()
    );
  }

  /**
   * 获取文档统计信息
   * @returns {Promise} 统计数据
   */
  async getDocumentStatistics() {
    return this.handleResponse(
      this.api.documents.statistics()
    );
  }

  /**
   * 验证文档数据
   * @param {Object} docData 文档数据
   * @param {boolean} isUpdate 是否为更新操作
   * @returns {Object} 验证结果
   */
  validateDocumentData(docData, isUpdate = false) {
    const errors = [];
    const warnings = [];

    // 前端验证逻辑
    if (!isUpdate || docData.title !== undefined) {
      if (!docData.title || docData.title.trim().length === 0) {
        errors.push({ field: 'title', message: '文档标题不能为空' });
      } else if (docData.title.length > 200) {
        errors.push({ field: 'title', message: '文档标题长度不能超过200个字符' });
      }
    }

    if (docData.content && docData.content.length > 50000) {
      errors.push({ field: 'content', message: '文档内容长度不能超过50000个字符' });
    }

    if (docData.category && docData.category.length > 50) {
      errors.push({ field: 'category', message: '分类名称长度不能超过50个字符' });
    }

    if (docData.tags) {
      if (Array.isArray(docData.tags)) {
        if (docData.tags.length > 10) {
          errors.push({ field: 'tags', message: '标签数量不能超过10个' });
        }
        docData.tags.forEach((tag, index) => {
          if (typeof tag !== 'string' || tag.length === 0) {
            errors.push({ field: `tags[${index}]`, message: '标签不能为空' });
          } else if (tag.length > 20) {
            errors.push({ field: `tags[${index}]`, message: '单个标签长度不能超过20个字符' });
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 清理文档数据
   * @param {Object} docData 文档数据
   * @returns {Object} 清理后的数据
   */
  sanitizeDocumentData(docData) {
    const sanitized = {};

    if (docData.title !== undefined) {
      sanitized.title = docData.title.trim();
    }

    if (docData.content !== undefined) {
      sanitized.content = docData.content || '';
    }

    if (docData.category !== undefined) {
      sanitized.category = docData.category ? docData.category.trim() : 'default';
    }

    if (docData.tags !== undefined) {
      if (Array.isArray(docData.tags)) {
        sanitized.tags = docData.tags
          .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
          .map(tag => tag.trim())
          .filter((tag, index, arr) => arr.indexOf(tag) === index) // 去重
          .slice(0, 10); // 限制数量
      } else {
        sanitized.tags = [];
      }
    }

    if (docData.user_id !== undefined) {
      sanitized.user_id = docData.user_id;
    }

    return sanitized;
  }

  /**
   * 格式化文档标签显示
   * @param {Array|string} tags 标签
   * @returns {Array} 标签数组
   */
  formatTags(tags) {
    if (typeof tags === 'string') {
      return this.safeJsonParse(tags, []);
    }
    return Array.isArray(tags) ? tags : [];
  }

  /**
   * 获取文档摘要
   * @param {string} content 文档内容
   * @param {number} maxLength 最大长度
   * @returns {string} 摘要
   */
  getDocumentSummary(content, maxLength = 100) {
    if (!content) return '';
    
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    return plainText.substring(0, maxLength) + '...';
  }

  /**
   * 格式化文档大小
   * @param {string} content 文档内容
   * @returns {string} 格式化的大小
   */
  getDocumentSize(content) {
    if (!content) return '0 字';
    
    const length = content.length;
    if (length < 1000) {
      return `${length} 字`;
    } else if (length < 10000) {
      return `${(length / 1000).toFixed(1)}K 字`;
    } else {
      return `${(length / 10000).toFixed(1)}万 字`;
    }
  }

  /**
   * 获取分类颜色
   * @param {string} category 分类名称
   * @returns {string} 颜色类名
   */
  getCategoryColor(category) {
    const colors = ['primary', 'success', 'warning', 'danger', 'info'];
    const hash = category.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }
}

// 创建单例实例
const documentApiService = new DocumentApiService();
export default documentApiService;