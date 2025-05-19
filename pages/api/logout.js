import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '仅支持 POST 请求' });
  }

  // 清除 login_token Cookie
  res.setHeader('Set-Cookie', serialize('login_token', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,               // 清除
    sameSite: 'lax',         // 安全策略
    secure: process.env.NODE_ENV === 'production', // 仅 HTTPS 才设置 secure
  }));

  return res.status(200).json({ message: '已退出登录' });
}
