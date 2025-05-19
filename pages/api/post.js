// lib/post_data.js
import { getConnection } from './db';

import { serialize } from 'cookie';

export default async function handler(req, res) {
  res.setHeader('Set-Cookie', serialize('login_token', 'valid', {
    path: '/',
    httpOnly: true,
    maxAge: 3600, // 1 小时有效  
  }));

//   const {posts} = req.body;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '仅支持 POST 请求' }); 
  }

  const connection = await getConnection();

  try {

    const [posts] = await connection.execute(
      `SELECT p.post_id, p.title, p.content, p.create_at, u.username
      FROM Post p
      JOIN Users u ON p.user_id = u.user_id
      ORDER BY p.create_at DESC`
      [posts]
    );

    const [comments] = await connection.execute(
      `SELECT c.comment_id, c.post_id, c.content, c.create_at, u.username
      FROM Comment c
      JOIN Users u ON c.user_id = u.user_id`
      [comments] 
    );
    
    const [likes] = await connection.execute(`
      SELECT target_type, target_id, COUNT(*) as like_count
      FROM Likes
      GROUP BY target_type, target_id
    `);

    const commentsByPost = {};
    for (const post of posts) {
      commentsByPost[post.post_id] = comments.filter(c => c.post_id === post.post_id);
    }

    const likeCounts = { post: {}, comment: {} };
    for (const like of likes) {
      likeCounts[like.target_type][like.target_id] = like.like_count;
    }

    return { posts, commentsByPost, likeCounts };
  } catch (err) {
    console.error('数据库连接失败：', err);
    return { posts: [], commentsByPost: {}, likeCounts: {} };
  } finally {
    if (connection) await connection.end();
  }
}

