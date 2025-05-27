import { getConnection } from '../db';
import { parse } from 'cookie';

export default async function handler(req, res) {
  try {
    // 获取cookie中的登录token
    const cookies = parse(req.headers.cookie || '');
    const loginToken = cookies.login_token;

    if (!loginToken || loginToken !== 'valid') {
      return res.status(401).json({ message: '未登录或会话已过期' });
    }

    // 这里应该从session或token中解析用户ID
    // 由于当前系统使用简单cookie验证，我们需要从请求中获取用户名
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ message: '缺少用户名参数' });
    }

    const connection = await getConnection();
    
    // 根据用户名查询用户信息
    const [users] = await connection.execute(
      'SELECT user_id, username, level_id, experience, level, major FROM Users WHERE username = ?',
      [username]
    );
    
    await connection.end();
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 返回用户信息
    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('获取会话信息失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}
