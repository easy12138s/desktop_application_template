import BaseApiService from './BaseApiService';

/**
 * 用户API服务
 */
class UserApiService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * 获取用户列表
   * @param {Object} options 查询选项
   * @returns {Promise} 用户列表数据
   */
  async getUsers(options = {}) {
    return this.handleResponse(
      this.api.users.list(options)
    );
  }

  /**
   * 搜索用户
   * @param {string} keyword 搜索关键词
   * @param {Object} filters 过滤条件
   * @returns {Promise} 搜索结果
   */
  async searchUsers(keyword = '', filters = {}) {
    const options = {
      search: keyword,
      ...filters
    };
    return this.getUsers(options);
  }

  /**
   * 获取分页用户列表
   * @param {number} page 页码
   * @param {number} limit 每页数量
   * @param {Object} filters 过滤条件
   * @returns {Promise} 分页结果
   */
  async getUsersPaginated(page = 1, limit = 10, filters = {}) {
    const options = {
      page,
      limit,
      ...filters
    };
    return this.getUsers(options);
  }

  /**
   * 获取用户详情
   * @param {number} id 用户ID
   * @returns {Promise} 用户信息
   */
  async getUser(id) {
    return this.handleResponse(
      this.api.users.get(id)
    );
  }

  /**
   * 创建用户
   * @param {Object} userData 用户数据
   * @returns {Promise} 创建的用户信息
   */
  async createUser(userData) {
    try {
      const result = await this.handleValidatedResponse(
        this.api.users.create(userData)
      );
      this.showSuccess('用户创建成功');
      return result.data;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 更新用户
   * @param {number} id 用户ID
   * @param {Object} userData 用户数据
   * @returns {Promise} 更新的用户信息
   */
  async updateUser(id, userData) {
    try {
      const result = await this.handleValidatedResponse(
        this.api.users.update(id, userData)
      );
      this.showSuccess('用户更新成功');
      return result.data;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 删除用户
   * @param {number} id 用户ID
   * @returns {Promise} 删除结果
   */
  async deleteUser(id) {
    try {
      await this.handleResponse(
        this.api.users.delete(id)
      );
      this.showSuccess('用户删除成功');
      return true;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 批量删除用户
   * @param {Array} ids 用户ID数组
   * @returns {Promise} 删除结果
   */
  async deleteUsers(ids) {
    try {
      const result = await this.handleResponse(
        this.api.users.batch('delete', ids)
      );
      this.showSuccess(`成功删除 ${result.affected} 个用户`);
      return result;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 激活用户
   * @param {number|Array} ids 用户ID或ID数组
   * @returns {Promise} 操作结果
   */
  async activateUsers(ids) {
    const userIds = Array.isArray(ids) ? ids : [ids];
    try {
      const result = await this.handleResponse(
        this.api.users.batch('activate', userIds)
      );
      this.showSuccess(`成功激活 ${result.affected} 个用户`);
      return result;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 停用用户
   * @param {number|Array} ids 用户ID或ID数组
   * @returns {Promise} 操作结果
   */
  async deactivateUsers(ids) {
    const userIds = Array.isArray(ids) ? ids : [ids];
    try {
      const result = await this.handleResponse(
        this.api.users.batch('deactivate', userIds)
      );
      this.showSuccess(`成功停用 ${result.affected} 个用户`);
      return result;
    } catch (error) {
      this.showError(this.formatError(error));
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Promise} 统计数据
   */
  async getUserStatistics() {
    return this.handleResponse(
      this.api.users.statistics()
    );
  }

  /**
   * 验证用户数据
   * @param {Object} userData 用户数据
   * @param {boolean} isUpdate 是否为更新操作
   * @returns {Object} 验证结果
   */
  validateUserData(userData, isUpdate = false) {
    const errors = [];
    const warnings = [];

    // 前端验证逻辑
    if (!isUpdate || userData.username !== undefined) {
      if (!userData.username || userData.username.trim().length === 0) {
        errors.push({ field: 'username', message: '用户名不能为空' });
      } else if (userData.username.length < 2) {
        errors.push({ field: 'username', message: '用户名长度不能少于2个字符' });
      } else if (userData.username.length > 50) {
        errors.push({ field: 'username', message: '用户名长度不能超过50个字符' });
      }
    }

    if (userData.email && userData.email.trim().length > 0) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.push({ field: 'email', message: '邮箱格式不正确' });
      }
    }

    if (userData.avatar_url && userData.avatar_url.trim().length > 0) {
      try {
        new URL(userData.avatar_url);
      } catch (e) {
        errors.push({ field: 'avatar_url', message: '头像URL格式不正确' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 清理用户数据
   * @param {Object} userData 用户数据
   * @returns {Object} 清理后的数据
   */
  sanitizeUserData(userData) {
    const sanitized = {};

    if (userData.username !== undefined) {
      sanitized.username = userData.username.trim();
    }

    if (userData.email !== undefined) {
      sanitized.email = userData.email ? userData.email.trim().toLowerCase() : null;
    }

    if (userData.avatar_url !== undefined) {
      sanitized.avatar_url = userData.avatar_url ? userData.avatar_url.trim() : null;
    }

    if (userData.status !== undefined) {
      sanitized.status = userData.status;
    }

    return sanitized;
  }

  /**
   * 格式化用户显示名称
   * @param {Object} user 用户对象
   * @returns {string} 显示名称
   */
  getDisplayName(user) {
    if (!user) return '';
    return user.username || `用户${user.id}`;
  }

  /**
   * 获取用户状态文本
   * @param {string} status 状态值
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'active': '活跃',
      'inactive': '停用'
    };
    return statusMap[status] || '未知';
  }

  /**
   * 获取用户状态颜色
   * @param {string} status 状态值
   * @returns {string} 颜色类名
   */
  getStatusColor(status) {
    const colorMap = {
      'active': 'success',
      'inactive': 'warning'
    };
    return colorMap[status] || 'default';
  }
}

// 创建单例实例
const userApiService = new UserApiService();
export default userApiService;