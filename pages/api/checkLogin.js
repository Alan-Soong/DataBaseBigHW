import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '仅支持 GET 方法' });
  }

  try {
    // 从 cookie 中获取登录状态
    const loginToken = req.cookies.login_token;
    
    if (!loginToken) {
      return res.status(200).json({ 
        isLoggedIn: false,
        message: '未登录'
      });
    }

    // 从数据库中获取用户信息
    const connection = await getConnection();
    try {
      // 获取当前登录的用户信息
      const [users] = await connection.execute(
        'SELECT user_id, username FROM Users WHERE user_id = ?',
        [req.cookies.user_id] // 使用cookie中存储的用户ID
      );
      
      if (users.length === 0) {
        return res.status(200).json({
          isLoggedIn: false,
          message: '未找到用户'
        });
      }

      const user = users[0];
      return res.status(200).json({
        isLoggedIn: true,
        userId: user.user_id,
        username: user.username,
        message: '已登录'
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return res.status(500).json({
      isLoggedIn: false,
      message: '服务器错误'
    });
  }
} 