import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { postId, userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // 首先验证帖子是否属于该用户
    const [post] = await conn.query('SELECT user_id FROM post WHERE post_id = ?', [postId]);
    if (post.length === 0) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }
    if (post[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此帖子' });
    }
    
    // 开始事务
    await conn.beginTransaction();

    // 删除与帖子相关的评论
    // await conn.query('DELETE FROM comment WHERE post_id = ?', [postId]);
    await conn.query('DELETE c FROM comment c JOIN post p ON c.post_id = p.post_id WHERE p.post_id = ?', [postId]);

    // 删除与帖子相关的点赞
    await conn.query('DELETE FROM likes WHERE target_id = ? AND target_type = \'post\'', [postId]);

    // 删除 belonging_to 表中与帖子相关的记录
    await conn.query('DELETE FROM belonging_to WHERE post_id = ?', [postId]);

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