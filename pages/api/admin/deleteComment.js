import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { commentId } = req.body;

  if (!commentId) {
    return res.status(400).json({ success: false, message: '缺少评论ID' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // 开始事务
    await conn.beginTransaction();

    // 删除评论
    await conn.query('DELETE FROM comment WHERE comment_id = ?', [commentId]);

    // 提交事务
    await conn.commit();

    conn.end();
    res.status(200).json({ success: true, message: '评论删除成功' });
  } catch (err) {
    if (conn) {
      // 回滚事务
      await conn.rollback();
      conn.end();
    }
    console.error('删除评论失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 