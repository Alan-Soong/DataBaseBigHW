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
      `SELECT u.user_id, u.username, u.major, u.experience, u.level, l.level_name, u.student_id
       FROM Users u
       LEFT JOIN LevelRule l ON u.level_id = l.level_id
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
    
    let user = users[0];

    // 获取可见性设置
    const [visibilitySettingsRows] = await connection.execute(
        'SELECT field_name, visible_to_admin_only, visible_to_followers_only, visible_to_all FROM ProfileVisibility WHERE user_id = ?',
        [userId]
      );

    const visibilitySettings = {};
    visibilitySettingsRows.forEach(row => {
        visibilitySettings[row.field_name] = {
            visibleToAdminOnly: row.visible_to_admin_only === 1,
            visibleToFollowersOnly: row.visible_to_followers_only === 1,
            visibleToAll: row.visible_to_all === 1,
        };
    });
    
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
      'SELECT COUNT(*) as following_count FROM followrelation WHERE follower_id = ?',
      [userId]
    );
    
    // 获取用户粉丝数量
    const [followerCountResult] = await connection.execute(
      'SELECT COUNT(*) as follower_count FROM followrelation WHERE followed_id = ?',
      [userId]
    );
    
    // 获取用户最近的帖子
    const [recentPosts] = await connection.execute(
      `SELECT p.post_id, p.title, p.content, p.create_at, p.post_time, s.section_name,
              (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id) as comment_count,
              (SELECT COUNT(*) FROM Likes l WHERE l.target_type = 'post' AND l.target_id = p.post_id) as like_count
       FROM Post p
       JOIN Belonging_to bt ON p.post_id = bt.post_id
       JOIN Section s ON bt.section_id = s.section_id
       WHERE p.user_id = ?
       ORDER BY p.post_time DESC
       LIMIT 5`,
      [userId]
    );

    // 检查查看者身份
    let isViewerAdmin = false;
    let isViewerFollowing = false;
    const viewerId = req.query.viewerId; 
    if (viewerId) {
        if (parseInt(viewerId) === parseInt(userId)) { // 查看者是自己
            // 自己可以看到所有信息，无需过滤
        } else { // 查看者是其他人
            // 检查查看者是否是管理员
            const [adminRows] = await connection.execute(
                'SELECT is_admin FROM UserIsAdmin WHERE user_id = ? AND is_admin = 1',
                [viewerId]
            );
            isViewerAdmin = adminRows.length > 0;

            // 检查查看者是否关注了该用户
            const [followRows] = await connection.execute(
                'SELECT 1 FROM followrelation WHERE follower_id = ? AND followed_id = ?',
                [viewerId, userId]
            );
            isViewerFollowing = followRows.length > 0;
            user.isFollowing = isViewerFollowing; // 添加 isFollowing 字段到返回结果

            // 检查查看者是否被拉黑 (如果被拉黑，可能需要隐藏一些信息)
            const [blockRows] = await connection.execute(
                'SELECT 1 FROM blockrelation WHERE blocker_id = ? AND blocked_id = ?',
                [userId, viewerId] // 注意这里的顺序，是被查看者拉黑了查看者
            );
            user.isBlocked = blockRows.length > 0; // 添加 isBlocked 字段到返回结果

            // 根据可见性设置过滤字段
            const filteredUser = { user_id: user.user_id, username: user.username }; // 默认返回ID和用户名

            const checkVisibility = (fieldName) => {
                const setting = visibilitySettings[fieldName];
                if (!setting) return true; // 默认可见
                if (setting.visibleToAll) return true;
                if (setting.visibleToAdminOnly && isViewerAdmin) return true;
                if (setting.visibleToFollowersOnly && isViewerFollowing) return true;
                return false;
            };

            // 过滤基本信息
            if (checkVisibility('level')) filteredUser.level = user.level;
            if (checkVisibility('level')) filteredUser.level_name = user.level_name;
            if (checkVisibility('experience')) filteredUser.experience = user.experience;
            if (checkVisibility('major')) filteredUser.major = user.major;
            if (checkVisibility('studentId')) filteredUser.student_id = user.student_id;
            // registrationDate 我们之前移除了，如果数据库中有需要再加回来并检查可见性

            // 过滤统计数据
            if (checkVisibility('stats')) {
                 filteredUser.post_count = postCountResult[0].post_count;
                 filteredUser.comment_count = commentCountResult[0].comment_count;
                 filteredUser.like_count = likeCountResult[0].like_count;
            }

             // 过滤关注/粉丝数量 (即使列表不可见，数量通常是公开的，除非可见性设置特别控制数量)
             // 这里假设数量是统计数据的一部分，或者独立控制。如果需要单独控制，需要更精细的过滤逻辑。
             // 目前将数量视为 stats 的一部分进行过滤
            if (checkVisibility('stats')) {
                 filteredUser.following_count = followingCountResult[0].following_count;
                 filteredUser.follower_count = followerCountResult[0].follower_count;
            }

            // 过滤最近发帖
            if (checkVisibility('recent_posts')) {
                 filteredUser.recent_posts = recentPosts;
            } else {
                filteredUser.recent_posts = []; // 如果不可见，返回空列表
            }

            // 列表数据 (关注、粉丝、拉黑) 不直接在这里返回完整列表，而是通过单独API获取并检查可见性
            // 这里只返回数量并在前端控制是否显示按钮或数量

            user = filteredUser; // 使用过滤后的用户对象
        }
    }
    
    // 如果 viewerId 不存在 (例如未登录用户)，则只返回对所有人可见的信息
    if (!viewerId) {
         const filteredUser = { user_id: user.user_id, username: user.username }; // 默认返回ID和用户名

         const checkVisibilityForAll = (fieldName) => {
              const setting = visibilitySettings[fieldName];
              if (!setting) return true; // 默认可见
              return setting.visibleToAll;
         };

         // 过滤基本信息
         if (checkVisibilityForAll('level')) filteredUser.level = user.level;
         if (checkVisibilityForAll('level')) filteredUser.level_name = user.level_name;
         if (checkVisibilityForAll('experience')) filteredUser.experience = user.experience;
         if (checkVisibilityForAll('major')) filteredUser.major = user.major;
         if (checkVisibilityForAll('studentId')) filteredUser.student_id = user.student_id;
         // registrationDate 如果存在且可见，再添加

         // 过滤统计数据
         if (checkVisibilityForAll('stats')) {
              filteredUser.post_count = postCountResult[0].post_count;
              filteredUser.comment_count = commentCountResult[0].comment_count;
              filteredUser.like_count = likeCountResult[0].like_count;
              filteredUser.following_count = followingCountResult[0].following_count;
              filteredUser.follower_count = followerCountResult[0].follower_count;
         }

         // 过滤最近发帖
         if (checkVisibilityForAll('recent_posts')) {
             filteredUser.recent_posts = recentPosts;
         } else {
             filteredUser.recent_posts = [];
         }

         user = filteredUser; // 使用过滤后的用户对象
    }
    
    await connection.end();
    
    return res.status(200).json({ 
      success: true, 
      user: user // 返回过滤后的用户对象
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
}
