import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少用户ID参数' 
    });
  }

  try {
    const connection = await getConnection();
    
    // 获取用户基本信息
    const [users] = await connection.execute(
      `SELECT u.user_id, u.username, u.major, u.experience, u.level, l.level_name
       FROM Users u
       JOIN LevelRule l ON u.level_id = l.level_id
       WHERE u.user_id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    const user = users[0];
    
    // 获取用户发帖数量
    const [postCountResult] = await connection.execute(
      'SELECT COUNT(*) as post_count FROM Post WHERE user_id = ?',
      [userId]
    );
    
    // 获取用户评论数量
    const [commentCountResult] = await connection.execute(
      'SELECT COUNT(*) as comment_count FROM Comment WHERE user_id = ?',
      [userId]
    );
    
    // 获取用户获得的点赞数量
    const [likeCountResult] = await connection.execute(
      `SELECT COUNT(*) as like_count FROM Likes l
       JOIN Post p ON l.target_type = 'post' AND l.target_id = p.post_id
       WHERE p.user_id = ?`,
      [userId]
    );
    
    // 获取用户关注数量
    const [followingCountResult] = await connection.execute(
      'SELECT COUNT(*) as following_count FROM FollowRelation WHERE follower_id = ?',
      [userId]
    );
    
    // 获取用户粉丝数量
    const [followerCountResult] = await connection.execute(
      'SELECT COUNT(*) as follower_count FROM FollowRelation WHERE followed_id = ?',
      [userId]
    );
    
    // 获取用户最近的帖子
    const [recentPosts] = await connection.execute(
      `SELECT p.post_id, p.title, p.content, p.create_at, p.post_time,
              (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id) as comment_count,
              (SELECT COUNT(*) FROM Likes l WHERE l.target_type = 'post' AND l.target_id = p.post_id) as like_count
       FROM Post p
       WHERE p.user_id = ?
       ORDER BY p.post_time DESC
       LIMIT 5`,
      [userId]
    );
    
    await connection.end();
    
    return res.status(200).json({ 
      success: true, 
      user: {
        ...user,
        post_count: postCountResult[0].post_count,
        comment_count: commentCountResult[0].comment_count,
        like_count: likeCountResult[0].like_count,
        following_count: followingCountResult[0].following_count,
        follower_count: followerCountResult[0].follower_count,
        recent_posts: recentPosts
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
}
