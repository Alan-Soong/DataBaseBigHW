import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // 开始事务
    await conn.beginTransaction();

    // 获取用户的所有帖子ID
    const [posts] = await conn.query('SELECT post_id FROM post WHERE user_id = ?', [userId]);
    const postIds = posts.map(post => post.post_id);

    // 删除用户的所有评论
    await conn.query('DELETE FROM comment WHERE user_id = ?', [userId]);

    // 删除用户对帖子和评论的点赞
    await conn.query('DELETE FROM likes WHERE user_id = ?', [userId]);

    // 删除与用户帖子相关的评论
    if (postIds.length > 0) {
      await conn.query('DELETE FROM comment WHERE post_id IN (?)', [postIds]);

      // 删除与用户帖子相关的点赞
      // 注意：这里需要根据你的 Likes 表结构来调整 SQL 语句
      // 假设 Likes 表有 target_id 和 target_type (post或comment)
      await conn.query('DELETE FROM likes WHERE target_id IN (?) AND target_type = \'post\'', [postIds]);

      // 删除用户的所有帖子
      await conn.query('DELETE FROM post WHERE user_id = ?', [userId]);
    }

    // 删除用户本身
    await conn.query('DELETE FROM users WHERE user_id = ?', [userId]);

    // 提交事务
    await conn.commit();

    conn.end();
    res.status(200).json({ success: true, message: '用户删除成功' });
  } catch (err) {
    if (conn) {
      // 回滚事务
      await conn.rollback();
      conn.end();
    }
    console.error('删除用户失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 