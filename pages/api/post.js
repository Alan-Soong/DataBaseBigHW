import { getConnection } from './db';

// 封装 service 层函数
async function getPosts(page = 1, size = 10) {
  const connection = await getConnection();
  const offset = (parseInt(page) - 1) * parseInt(size);
  try {
    const [rows] = await connection.execute(`
      SELECT p.post_id, p.title, p.content, p.create_at, p.post_time, u.username,
        (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id) as comment_count
      FROM Post p
      INNER JOIN Users u ON p.user_id = u.user_id
      WHERE p.post_time IS NOT NULL
      ORDER BY p.post_time DESC
      LIMIT ? OFFSET ?
    `, [parseInt(size), offset]);
    return rows;
  } finally {
    await connection.end();
  }
}

async function getComments(postId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT c.comment_id, c.content, c.create_at, u.username 
       FROM Comment c 
       INNER JOIN Users u ON c.user_id = u.user_id 
       WHERE c.post_id = ? 
       ORDER BY c.create_at ASC`,
      [postId]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

async function getLikes(targetType, targetId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as like_count 
       FROM Likes 
       WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId]
    );
    return rows[0].like_count;
  } finally {
    await connection.end();
  }
}

async function addLike(userId, targetType, targetId) {
  const connection = await getConnection();
  try {
    await connection.execute(
      `INSERT INTO Likes (user_id, target_type, target_id, create_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, targetType, targetId]
    );
    return { success: true };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: '用户已对该内容点赞' };
    }
    throw error;
  } finally {
    await connection.end();
  }
}

async function addComment(userId, postId, content) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO Comment (user_id, post_id, content, create_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, postId, content]
    );
    const commentId = result.insertId;

    const [rows] = await connection.execute(
      `SELECT c.comment_id, c.content, c.create_at, u.username 
       FROM Comment c 
       JOIN Users u ON c.user_id = u.user_id 
       WHERE c.comment_id = ?`,
      [commentId]
    );
    return rows[0];
  } finally {
    await connection.end();
  }
}



export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // 获取帖子和点赞
      // 处理分页查询
      if (req.query.page && req.query.size) {
        const posts = await getPosts(req.query.page, req.query.size);
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM Post WHERE post_time IS NOT NULL');
        const total = countResult[0].total;
        return res.status(200).json({ posts, total });
      }

      if (req.query.targetType && req.query.targetId) {
        const count = await getLikes(req.query.targetType, req.query.targetId);
        return res.status(200).json({ count });
      }

      const posts = await getPosts();
      const commentsByPost = {};
      const likeCounts = { post: {}, comment: {} };

      for (const post of posts) {
        const comments = await getComments(post.post_id);
        commentsByPost[post.post_id] = comments;
        likeCounts.post[post.post_id] = await getLikes('post', post.post_id);
        for (const c of comments) {
          likeCounts.comment[c.comment_id] = await getLikes('comment', c.comment_id);
        }
      }

      return res.status(200).json({ posts, commentsByPost, likeCounts });
    }

    if (req.method === 'POST') {
      const { action, userId, targetType, targetId, postId, content } = req.body;

      if (action === 'like') {
        await addLike(userId, targetType, targetId);
        const count = await getLikes(targetType, targetId);
        return res.status(200).json({ count });
      }

      if (action === 'comment') {
        const newComment = await addComment(userId, postId, content);
        const commentCount = (await getComments(postId)).length;
        return res.status(200).json({ comment: newComment, count: commentCount });
      }

      return res.status(400).json({ error: '未知操作' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('API 错误:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
