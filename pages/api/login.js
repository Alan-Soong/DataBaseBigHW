import { getConnection } from './db';

import { serialize } from 'cookie';


export default async function handler(req, res) {
  res.setHeader('Set-Cookie', serialize('login_token', 'valid', {
    path: '/',
    httpOnly: true,
    maxAge: 3600, // 1 小时有效
  }));

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '仅支持 POST 请求' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名或密码不能为空' });
  }

  try {
    const connection = await getConnection();

    // 设置登录界面，可以进行登录
    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE username = ? AND password = ?',
      [username, password]
    );

    await connection.end();

    if (rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    return res.status(200).json({ message: '登录成功' });
  } catch (err) {
    console.error('登录失败:', err);
    return res.status(500).json({ message: '服务器错误' });
  }
}
