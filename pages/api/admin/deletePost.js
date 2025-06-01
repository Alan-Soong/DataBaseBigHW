import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ success: false, message: '缺少帖子ID' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // 开始事务
    await conn.beginTransaction();

    // 删除与帖子相关的评论
    // await conn.query('DELETE FROM comment WHERE post_id = ?', [postId]);
    // 删除与帖子相关的评论 (使用 JOIN 方式)
    await conn.query('DELETE c FROM comment c JOIN post p ON c.post_id = p.post_id WHERE p.post_id = ?', [postId]);

    // 删除与帖子相关的点赞
    // 注意：这里需要根据你的 Likes 表结构来调整 SQL 语句
    // 假设 Likes 表有 target_id 和 target_type (post或comment)
    await conn.query('DELETE FROM likes WHERE target_id = ? AND target_type = \'post\'', [postId]);

    // 删除帖子
    await conn.query('DELETE FROM post WHERE post_id = ?', [postId]);

    // 提交事务
    await conn.commit();

    conn.end();
    res.status(200).json({ success: true, message: '帖子删除成功' });
  } catch (err) {
    if (conn) {
      // 回滚事务
      await conn.rollback();
      conn.end();
    }
    console.error('删除帖子失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 