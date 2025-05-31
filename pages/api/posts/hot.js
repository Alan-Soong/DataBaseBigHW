import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  let connection;
  try {
    connection = await getConnection();

    // 查询过去 24 小时内发布的帖子
    // 您可以根据需要添加排序，例如按发布时间倒序或点赞数倒序
    const [rows] = await connection.execute(`
      SELECT p.post_id, p.title, p.content, p.create_at, p.post_time,
             u.user_id, u.username,
             s.section_id, s.section_name,
             (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.post_id) AS comment_count,
             (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'post' AND l.target_id = p.post_id) AS like_count
      FROM post p
      INNER JOIN users u ON p.user_id = u.user_id
      LEFT JOIN belonging_to bt ON p.post_id = bt.post_id
      LEFT JOIN section s ON bt.section_id = s.section_id
      WHERE p.post_time >= NOW() - INTERVAL 24 HOUR
      ORDER BY p.post_time DESC
    `);

    // 如果提供了用户ID，检查用户是否点赞 (可选，取决于前端是否需要显示点赞状态)
    if (req.query.userId && rows.length > 0) {
        const postIds = rows.map(p => p.post_id);
         const [likeRows] = await connection.execute(
            `SELECT target_id FROM Likes 
             WHERE user_id = ? 
             AND target_type = 'post' 
             AND target_id IN (${postIds.map(() => '?').join(',')})`,
            [req.query.userId, ...postIds]
         );

         const likedPostIds = new Set(likeRows.map(row => row.target_id));
         rows.forEach(post => {
             post.liked = likedPostIds.has(post.post_id);
         });
    }

    res.status(200).json({ success: true, posts: rows });

  } catch (error) {
    console.error('获取热门帖子失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
} 