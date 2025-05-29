import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.query(`
      SELECT c.comment_id, c.content, c.create_at, c.user_id, u.username, c.post_id
      FROM comment c
      JOIN users u ON c.user_id = u.user_id
      ORDER BY c.create_at DESC
    `);
    conn.end();
    res.status(200).json({ success: true, comments: rows });
  } catch (err) {
    console.error('获取评论列表失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 