import { getConnection } from './db';

// 封装 service 层函数
async function getPosts(page = 1, size = 10, connection, sectionId = null) {
  if (!connection) connection = await getConnection();
  const offset = (parseInt(page) - 1) * parseInt(size);
  try {
    let query = `
      SELECT post_id, user_id, title, content, create_at, post_time,
             section_id, section_name, author_username, comment_count, like_count
      FROM post_details_view
      WHERE post_time IS NOT NULL
    `;

    const params = [];
    
    // 如果指定了频道ID，添加筛选条件
    if (sectionId) {
      query += ` AND section_id = ?`;
      params.push(sectionId);
    }

    query += ` ORDER BY post_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(size), offset);

    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

// 修改后的 getPostById 函数
async function getPostById(postId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT p.post_id, p.title, p.content, p.create_at, p.post_time,
        u.username,
        s.section_id, s.section_name,
        (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id) as comment_count,
        (SELECT COUNT(*) FROM Likes l WHERE l.target_type = 'post' AND l.target_id = p.post_id) as like_count
      FROM Post p
      INNER JOIN Users u ON p.user_id = u.user_id
      LEFT JOIN belonging_to bt ON p.post_id = bt.post_id
      LEFT JOIN Section s ON bt.section_id = s.section_id
      WHERE p.post_id = ?
    `, [postId]);
    // 注意：如果帖子可能属于多个版块，需处理多行结果（如取第一个或聚合）
    return rows.length > 0 ? rows[0] : null;
  } finally {
    await connection.end();
  }
}

async function getComments(postId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT c.comment_id, c.content, c.create_at, c.user_id, u.username, c.parent_comment_id,
        (SELECT COUNT(*) FROM Likes l WHERE l.target_type = 'comment' AND l.target_id = c.comment_id) as like_count
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

async function checkUserLikes(userId, posts = [], comments = []) {
  if (!userId) return { posts: {}, comments: {} };

  const connection = await getConnection();
  try {
    const postLikes = {};
    const commentLikes = {};

    // 处理帖子点赞
    if (posts.length > 0) {
      const postIds = posts.map(p => p.post_id).filter(id => id); // 过滤无效ID
      
      if (postIds.length > 0) {
        const [postLikeRows] = await connection.execute(
          `SELECT target_id FROM Likes 
           WHERE user_id = ? 
           AND target_type = 'post' 
           AND target_id IN (${postIds.map(() => '?').join(',')})`,
          [userId, ...postIds] // 展开数组
        );

        postLikeRows.forEach(row => {
          postLikes[row.target_id] = true;
        });
      }
    }

    // 处理评论点赞（同理修改）
    if (comments.length > 0) {
      const commentIds = comments.map(c => c.comment_id).filter(id => id);
      
      if (commentIds.length > 0) {
        const [commentLikeRows] = await connection.execute(
          `SELECT target_id FROM Likes 
           WHERE user_id = ? 
           AND target_type = 'comment' 
           AND target_id IN (${commentIds.map(() => '?').join(',')})`,
          [userId, ...commentIds]
        );

        commentLikeRows.forEach(row => {
          commentLikes[row.target_id] = true;
        });
      }
    }

    return { posts: postLikes, comments: commentLikes };
  } finally {
    await connection.end();
  }
}

async function addLike(userId, targetType, targetId) {
  const connection = await getConnection();
  try {
    // 调用存储过程来切换点赞状态和更新作者经验值/等级
    await connection.execute(
      'CALL toggle_like(?, ?, ?)',
      [userId, targetType, targetId]
    );

    await connection.commit();

      // 查询最新点赞数
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM Likes WHERE target_type = ? AND target_id = ?',
        [targetType, targetId]
      );

    // 检查是否已点赞
    const [likeResult] = await connection.execute(
      'SELECT 1 FROM Likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
        [userId, targetType, targetId]
      );

    return { 
      success: true, 
      action: likeResult.length > 0 ? 'liked' : 'unliked', 
      count: countResult[0].count, 
      liked: likeResult.length > 0 
    };
  } finally {
    await connection.end();
  }
}

async function addComment(userId, postId, content, parentCommentId = null) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO Comment (user_id, post_id, content, parent_comment_id, create_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, postId, content, parentCommentId]
    );
    const commentId = result.insertId;

    const [rows] = await connection.execute(
      `SELECT c.comment_id, c.content, c.create_at, c.user_id, u.username, c.parent_comment_id,
        (SELECT COUNT(*) FROM Likes l WHERE l.target_type = 'comment' AND l.target_id = c.comment_id) as like_count
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
      // 获取单个帖子详情
      if (req.query.id) {
        const post = await getPostById(req.query.id);
        if (!post) {
          return res.status(404).json({ success: false, message: '帖子不存在' });
        }

        const comments = await getComments(req.query.id);

        // 如果提供了用户ID，检查用户是否点赞
        if (req.query.userId) {
          const likes = await checkUserLikes(req.query.userId, [post], comments);
          post.liked = !!likes.posts[post.post_id];
          comments.forEach(comment => {
            comment.liked = !!likes.comments[comment.comment_id];
          });
        }

        return res.status(200).json({
          success: true,
          post,
          comments,
          likeCount: post.like_count // 添加 likeCount，与前端一致
        });
      }

      // 处理分页查询
      if (req.query.page && req.query.size) {
        const connection = await getConnection();
        try {
          const posts = await getPosts(
            req.query.page, 
            req.query.size, 
            connection,
            req.query.sectionId
          );
          const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM Post WHERE post_time IS NOT NULL'
          );
          // ... 其他逻辑
        } finally {
          await connection.end();
        }
      }

      // 获取所有帖子
      const posts = await getPosts(1, 10, null, req.query.sectionId);

      // 如果提供了用户ID，检查用户是否点赞
      if (req.query.userId) {
        const likes = await checkUserLikes(req.query.userId, posts, []);
        posts.forEach(post => {
          post.liked = !!likes.posts[post.post_id];
        });
      }

      return res.status(200).json({
        success: true,
        posts
      });
    }

    if (req.method === 'POST') {
      const { action, userId, postId, commentId, content, parentCommentId } = req.body;

      if (action === 'like') {
        if (!userId || (!postId && !commentId)) {
          return res.status(400).json({
            success: false,
            message: '缺少必要参数'
          });
        }

        const targetType = postId ? 'post' : 'comment';
        const targetId = postId || commentId;

        const result = await addLike(userId, targetType, targetId);
        return res.status(200).json({
          success: true,
          ...result
        });
      }

      if (action === 'comment') {
        if (!userId || !postId || !content) {
          return res.status(400).json({
            success: false,
            message: '缺少必要参数'
          });
        }

        // 验证 parentCommentId 是否存在且有效 (可选，可以在前端做初步验证，后端做最终验证)
        if (parentCommentId) {
          // 可以在这里查询数据库验证 parentCommentId 是否存在于 comment 表
          // 为简化起见，这里先不加严格验证，依赖数据库外键约束
        }

        try {
          const newComment = await addComment(userId, postId, content, parentCommentId);
          return res.status(201).json({ success: true, comment: newComment });
        } catch (error) {
          console.error('发表评论失败:', error);
          return res.status(500).json({ success: false, message: '发表评论失败' });
        }
      }

      return res.status(400).json({
        success: false,
        message: '未知操作'
      });
    }

    if (req.method === 'DELETE') {
      const { postId } = req.body;
      if (!postId) {
        res.status(400).json({ success: false, message: '缺少postId' });
        return;
      }
      const conn = await getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM comment WHERE post_id = ?', [postId]);
        await conn.query('DELETE FROM likes WHERE post_id = ?', [postId]);
        await conn.query('DELETE FROM post WHERE post_id = ?', [postId]);
        await conn.commit();
        res.json({ success: true });
      } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: '删除失败', error: err.message });
      } finally {
        conn.end();
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('API 错误:', err);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
}
