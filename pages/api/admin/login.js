import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '仅支持 POST 请求' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名或密码不能为空' });
  }

  try {
    const connection = await getConnection();

    // 查询用户是否存在且是否为管理员
    const [users] = await connection.execute(
      `SELECT u.user_id, u.username, a.is_admin 
       FROM Users u
       JOIN UserIsAdmin a ON u.user_id = a.user_id
       WHERE u.username = ? AND u.password = ?`,
      [username, password]
    );

    await connection.end();

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = users[0];
    
    if (!user.is_admin) {
      return res.status(403).json({ success: false, message: '您没有管理员权限' });
    }

    // 返回成功响应，包含用户信息
    // 设置登录 cookie
    res.setHeader('Set-Cookie', 'login_token=valid; Path=/; HttpOnly; Max-Age=604800'); // Max-Age 设置为一周 (60*60*24*7)
    return res.status(200).json({ 
      success: true, 
      message: '登录成功', 
      user: {
        user_id: user.user_id,
        username: user.username,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    console.error('管理员登录失败:', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
}
