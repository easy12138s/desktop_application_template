/**
 * 测试数据初始化脚本
 * 用于初始化一些测试用的用户数据
 */

const { getUserService } = require('./userService.js')

async function initTestData() {
  try {
    const userService = getUserService()
    
    // 确保用户服务已初始化
    await userService.init()
    
    // 检查是否已有用户数据
    const existingUsers = await userService.getAllUsers()
    
    if (existingUsers.length === 0) {
      console.log('初始化测试用户数据...')
      
      // 添加测试用户
      const testUsers = [
        {
          username: 'admin',
          email: 'admin@example.com'
        },
        {
          username: 'test_user',
          email: 'test@example.com'
        },
        {
          username: 'demo',
          email: 'demo@example.com'
        }
      ]
      
      for (const userData of testUsers) {
        try {
          await userService.addUser(userData)
          console.log(`✓ 添加用户: ${userData.username}`)
        } catch (error) {
          console.error(`✗ 添加用户 ${userData.username} 失败:`, error.message)
        }
      }
      
      console.log('测试数据初始化完成！')
    } else {
      console.log('用户数据已存在，跳过初始化')
    }
    
  } catch (error) {
    console.error('初始化测试数据失败:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initTestData()
    .then(() => {
      console.log('测试数据初始化脚本执行完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('测试数据初始化脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { initTestData }