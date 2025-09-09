const { ValidationResult, BaseValidator } = require('./BaseValidator');

/**
 * 文档数据验证器
 */
class DocumentValidator extends BaseValidator {
  /**
   * 验证文档数据
   * @param {Object} docData 文档数据
   * @param {boolean} isUpdate 是否为更新操作
   * @returns {ValidationResult} 验证结果
   */
  static validate(docData, isUpdate = false) {
    const result = new ValidationResult();
    const { title, content, category, tags, user_id } = docData;

    // 验证标题
    if (!isUpdate || title !== undefined) {
      this.validateRequired(title, '文档标题', result);
      this.validateLength(title, '文档标题', 1, 200, result);
    }

    // 验证内容（可选，但如果提供则验证长度）
    if (content !== undefined && content !== null) {
      this.validateLength(content, '文档内容', 0, 50000, result);
    }

    // 验证分类
    if (category !== undefined && category !== null) {
      this.validateCategory(category, result);
    }

    // 验证标签
    if (tags !== undefined && tags !== null) {
      this.validateTags(tags, result);
    }

    // 验证用户ID
    if (user_id !== undefined && user_id !== null) {
      this.validateRange(user_id, '用户ID', 1, null, result);
    }

    return result;
  }

  /**
   * 验证分类
   * @param {string} category 分类
   * @param {ValidationResult} result 验证结果
   */
  static validateCategory(category, result) {
    if (category) {
      this.validateLength(category, '文档分类', 1, 50, result);
      
      // 分类名只允许字母、数字、下划线、中文
      const categoryPattern = /^[\w\u4e00-\u9fa5]+$/;
      this.validatePattern(
        category,
        categoryPattern,
        '文档分类',
        '分类名只能包含字母、数字、下划线和中文字符',
        result
      );
    }
  }

  /**
   * 验证标签
   * @param {Array|string} tags 标签
   * @param {ValidationResult} result 验证结果
   */
  static validateTags(tags, result) {
    let tagArray = tags;

    // 如果是字符串，尝试解析为JSON
    if (typeof tags === 'string') {
      try {
        tagArray = JSON.parse(tags);
      } catch (e) {
        result.addError('标签', '标签格式不正确，应为JSON数组');
        return;
      }
    }

    // 验证是否为数组
    if (!Array.isArray(tagArray)) {
      result.addError('标签', '标签必须是数组格式');
      return;
    }

    // 验证标签数量
    if (tagArray.length > 10) {
      result.addError('标签', '标签数量不能超过10个');
    }

    // 验证每个标签
    tagArray.forEach((tag, index) => {
      if (typeof tag !== 'string') {
        result.addError(`标签[${index}]`, '标签必须是字符串');
        return;
      }

      if (tag.length === 0) {
        result.addError(`标签[${index}]`, '标签不能为空');
        return;
      }

      if (tag.length > 20) {
        result.addError(`标签[${index}]`, '单个标签长度不能超过20个字符');
      }

      // 标签只允许字母、数字、下划线、中文
      const tagPattern = /^[\w\u4e00-\u9fa5]+$/;
      if (!tagPattern.test(tag)) {
        result.addError(`标签[${index}]`, `标签"${tag}"只能包含字母、数字、下划线和中文字符`);
      }
    });

    // 检查重复标签
    const uniqueTags = [...new Set(tagArray)];
    if (uniqueTags.length !== tagArray.length) {
      result.addWarning('标签', '存在重复标签，将自动去重');
    }
  }

  /**
   * 清理文档数据
   * @param {Object} docData 文档数据
   * @returns {Object} 清理后的文档数据
   */
  static sanitize(docData) {
    const sanitized = {};

    if (docData.title !== undefined) {
      sanitized.title = this.sanitizeString(docData.title);
    }

    if (docData.content !== undefined) {
      // 对于文档内容，保留换行但清理HTML
      sanitized.content = docData.content ? this.sanitizeHtml(docData.content) : null;
    }

    if (docData.category !== undefined) {
      sanitized.category = docData.category ? this.sanitizeString(docData.category) : 'default';
    }

    if (docData.tags !== undefined) {
      sanitized.tags = this.sanitizeTags(docData.tags);
    }

    if (docData.user_id !== undefined) {
      sanitized.user_id = docData.user_id;
    }

    return sanitized;
  }

  /**
   * 清理标签数据
   * @param {Array|string} tags 标签
   * @returns {Array} 清理后的标签数组
   */
  static sanitizeTags(tags) {
    let tagArray = tags;

    // 如果是字符串，尝试解析
    if (typeof tags === 'string') {
      try {
        tagArray = JSON.parse(tags);
      } catch (e) {
        return [];
      }
    }

    if (!Array.isArray(tagArray)) {
      return [];
    }

    return tagArray
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => this.sanitizeString(tag))
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // 去重
      .slice(0, 10); // 限制数量
  }

  /**
   * 验证文档批量操作数据
   * @param {Array} docIds 文档ID数组
   * @param {string} operation 操作类型
   * @param {*} operationData 操作数据
   * @returns {ValidationResult} 验证结果
   */
  static validateBatchOperation(docIds, operation, operationData) {
    const result = new ValidationResult();

    // 验证文档ID数组
    if (!Array.isArray(docIds) || docIds.length === 0) {
      result.addError('文档ID', '请选择要操作的文档');
      return result;
    }

    // 验证每个ID
    docIds.forEach((id, index) => {
      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        result.addError(`文档ID[${index}]`, '文档ID必须是正整数');
      }
    });

    // 验证操作类型
    const validOperations = ['delete', 'updateCategory', 'updateTags'];
    if (!validOperations.includes(operation)) {
      result.addError('操作类型', `操作类型必须是: ${validOperations.join(', ')} 中的一个`);
      return result;
    }

    // 根据操作类型验证操作数据
    switch (operation) {
      case 'updateCategory':
        if (!operationData || typeof operationData !== 'string') {
          result.addError('分类', '请提供有效的分类名称');
        } else {
          this.validateCategory(operationData, result);
        }
        break;
      case 'updateTags':
        this.validateTags(operationData, result);
        break;
    }

    // 检查批量操作限制
    if (docIds.length > 50) {
      result.addError('批量操作', '单次批量操作不能超过50个文档');
    }

    return result;
  }

  /**
   * 验证文档搜索参数
   * @param {Object} searchParams 搜索参数
   * @returns {ValidationResult} 验证结果
   */
  static validateSearchParams(searchParams) {
    const result = new ValidationResult();
    const { search, category, tag, user_id, page, limit } = searchParams;

    // 验证搜索关键词
    if (search !== undefined && search !== null) {
      this.validateLength(search, '搜索关键词', 0, 100, result);
    }

    // 验证分类过滤
    if (category !== undefined && category !== null && category !== '') {
      this.validateCategory(category, result);
    }

    // 验证标签过滤
    if (tag !== undefined && tag !== null && tag !== '') {
      this.validateLength(tag, '标签过滤', 1, 20, result);
    }

    // 验证用户ID过滤
    if (user_id !== undefined && user_id !== null) {
      this.validateRange(user_id, '用户ID过滤', 1, null, result);
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

  /**
   * 验证文档导入数据
   * @param {Array} documents 文档数组
   * @returns {ValidationResult} 验证结果
   */
  static validateImportData(documents) {
    const result = new ValidationResult();

    if (!Array.isArray(documents)) {
      result.addError('导入数据', '导入数据必须是数组格式');
      return result;
    }

    if (documents.length === 0) {
      result.addError('导入数据', '导入数据不能为空');
      return result;
    }

    if (documents.length > 1000) {
      result.addError('导入数据', '单次导入不能超过1000个文档');
      return result;
    }

    // 验证每个文档
    documents.forEach((doc, index) => {
      const docResult = this.validate(doc, false);
      if (!docResult.isValid) {
        docResult.errors.forEach(error => {
          result.addError(`文档[${index}].${error.field}`, error.message);
        });
      }
    });

    return result;
  }
}

module.exports = DocumentValidator;