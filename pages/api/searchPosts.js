import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query, searchType } = req.query;

    if (!query || !searchType) {
      return res.status(400).json({ success: false, message: '缺少搜索关键词或搜索类型' });
    }

    let sqlQuery = `
      SELECT p.post_id, p.title, p.content, p.create_at, p.post_time,
             u.username,
             (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id) as comment_count,
             (SELECT COUNT(*) FROM Likes l WHERE l.target_type = 'post' AND l.target_id = p.post_id) as like_count
      FROM Post p
      INNER JOIN Users u ON p.user_id = u.user_id
    `;
    const params = [];

    if (searchType === 'title') {
      sqlQuery += ` WHERE p.title LIKE ?`;
      params.push(`%${query}%`);
    } else if (searchType === 'content') {
      sqlQuery += ` WHERE p.content LIKE ?`;
      params.push(`%${query}%`);
    } else {
      return res.status(400).json({ success: false, message: '无效的搜索类型' });
    }

    sqlQuery += ` ORDER BY p.post_time DESC`;

    try {
      const connection = await getConnection();
      const [rows] = await connection.execute(sqlQuery, params);
      await connection.end();
      res.status(200).json({ success: true, posts: rows });
    } catch (error) {
      console.error('搜索帖子失败:', error);
      res.status(500).json({ success: false, message: '搜索帖子失败' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 