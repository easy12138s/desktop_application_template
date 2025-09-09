const { ValidationResult, BaseValidator } = require('./BaseValidator');

/**
 * 用户数据验证器
 */
class UserValidator extends BaseValidator {
  /**
   * 验证用户数据
   * @param {Object} userData 用户数据
   * @param {boolean} isUpdate 是否为更新操作
   * @returns {ValidationResult} 验证结果
   */
  static validate(userData, isUpdate = false) {
    const result = new ValidationResult();
    const { username, email, avatar_url, status } = userData;

    // 验证用户名
    if (!isUpdate || username !== undefined) {
      this.validateRequired(username, '用户名', result);
      this.validateUsername(username, result);
    }

    // 验证邮箱（可选）
    if (email !== undefined && email !== null) {
      this.validateEmail(email, '邮箱', result);
    }

    // 验证头像URL（可选）
    if (avatar_url !== undefined && avatar_url !== null && avatar_url !== '') {
      this.validateUrl(avatar_url, '头像URL', result);
    }

    // 验证状态
    if (status !== undefined) {
      this.validateOptions(status, ['active', 'inactive'], '用户状态', result);
    }

    return result;
  }

  /**
   * 验证用户名
   * @param {string} username 用户名
   * @param {ValidationResult} result 验证结果
   */
  static validateUsername(username, result) {
    if (username) {
      // 长度验证
      this.validateLength(username, '用户名', 2, 50, result);
      
      // 字符验证（只允许字母、数字、下划线、中文）
      const usernamePattern = /^[\w\u4e00-\u9fa5]+$/;
      this.validatePattern(
        username, 
        usernamePattern, 
        '用户名', 
        '用户名只能包含字母、数字、下划线和中文字符', 
        result
      );

      // 不能以数字开头
      if (/^\d/.test(username)) {
        result.addError('用户名', '用户名不能以数字开头');
      }

      // 保留字验证
      const reservedWords = ['admin', 'root', 'system', 'user', 'guest', 'null', 'undefined'];
      if (reservedWords.includes(username.toLowerCase())) {
        result.addError('用户名', '该用户名为保留字，不能使用');
      }
    }
  }

  /**
   * 清理用户数据
   * @param {Object} userData 用户数据
   * @returns {Object} 清理后的用户数据
   */
  static sanitize(userData) {
    const sanitized = {};

    if (userData.username !== undefined) {
      sanitized.username = this.sanitizeString(userData.username);
    }

    if (userData.email !== undefined) {
      sanitized.email = userData.email ? this.sanitizeString(userData.email).toLowerCase() : null;
    }

    if (userData.avatar_url !== undefined) {
      sanitized.avatar_url = userData.avatar_url ? this.sanitizeString(userData.avatar_url) : null;
    }

    if (userData.status !== undefined) {
      sanitized.status = userData.status;
    }

    return sanitized;
  }

  /**
   * 验证用户批量操作数据
   * @param {Array} userIds 用户ID数组
   * @param {string} operation 操作类型
   * @returns {ValidationResult} 验证结果
   */
  static validateBatchOperation(userIds, operation) {
    const result = new ValidationResult();

    // 验证用户ID数组
    if (!Array.isArray(userIds) || userIds.length === 0) {
      result.addError('用户ID', '请选择要操作的用户');
      return result;
    }

    // 验证每个ID
    userIds.forEach((id, index) => {
      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        result.addError(`用户ID[${index}]`, '用户ID必须是正整数');
      }
    });

    // 验证操作类型
    const validOperations = ['delete', 'activate', 'deactivate'];
    if (!validOperations.includes(operation)) {
      result.addError('操作类型', `操作类型必须是: ${validOperations.join(', ')} 中的一个`);
    }

    // 检查批量操作限制
    if (userIds.length > 100) {
      result.addError('批量操作', '单次批量操作不能超过100个用户');
    }

    return result;
  }

  /**
   * 验证用户搜索参数
   * @param {Object} searchParams 搜索参数
   * @returns {ValidationResult} 验证结果
   */
  static validateSearchParams(searchParams) {
    const result = new ValidationResult();
    const { search, status, page, limit } = searchParams;

    // 验证搜索关键词
    if (search !== undefined && search !== null) {
      this.validateLength(search, '搜索关键词', 0, 100, result);
    }

    // 验证状态过滤
    if (status !== undefined && status !== null && status !== '') {
      this.validateOptions(status, ['active', 'inactive'], '状态过滤', result);
    }

    // 验证分页参数
    if (page !== undefined) {
      this.validateRange(page, '页码', 1, null, result);
    }

    if (limit !== undefined) {
      this.validateRange(limit, '每页数量', 1, 100, result);
    }

    return result;
  }
}

module.exports = UserValidator;