import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.query(`
      SELECT p.post_id, p.title, p.content, p.post_time, u.username, 
             (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.post_id) AS comment_count
      FROM post p
      JOIN users u ON p.user_id = u.user_id
      ORDER BY p.post_time DESC
    `);
    conn.end();
    res.status(200).json({ success: true, posts: rows });
  } catch (err) {
    console.error('获取帖子列表失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 