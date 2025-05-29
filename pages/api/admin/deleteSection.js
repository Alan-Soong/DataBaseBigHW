import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sectionId } = req.body;

  if (!sectionId) {
    return res.status(400).json({ success: false, message: '缺少频道ID' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // 开始事务
    await conn.beginTransaction();

    // 获取该频道下的所有帖子ID
    const [posts] = await conn.query('SELECT post_id FROM post WHERE section_id = ?', [sectionId]);
    const postIds = posts.map(post => post.post_id);

    // 删除与这些帖子相关的评论
    if (postIds.length > 0) {
      await conn.query('DELETE FROM comment WHERE post_id IN (?)', [postIds]);

      // 删除与这些帖子相关的点赞
      // 假设 Likes 表有 target_id 和 target_type ('post' 或 'comment')
      await conn.query('DELETE FROM likes WHERE target_id IN (?) AND target_type = \'post\'', [postIds]);
      
      // 获取这些帖子下的所有评论ID (为了删除对评论的点赞)
      const [comments] = await conn.query('SELECT comment_id FROM comment WHERE post_id IN (?)', [postIds]);
      const commentIds = comments.map(comment => comment.comment_id);

      // 删除与这些评论相关的点赞
      if (commentIds.length > 0) {
         await conn.query('DELETE FROM likes WHERE target_id IN (?) AND target_type = \'comment\'', [commentIds]);
      }
    }

    // 删除该频道下的所有帖子
    await conn.query('DELETE FROM post WHERE section_id = ?', [sectionId]);
    
    // 删除频道本身
    await conn.query('DELETE FROM section WHERE section_id = ?', [sectionId]);

    // 提交事务
    await conn.commit();

    conn.end();
    res.status(200).json({ success: true, message: '频道删除成功' });
  } catch (err) {
    if (conn) {
      // 回滚事务
      await conn.rollback();
      conn.end();
    }
    console.error('删除频道失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 