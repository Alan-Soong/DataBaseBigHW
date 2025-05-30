import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId, targetUserId, action } = req.body;

  if (!userId || !targetUserId || !action) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (action !== 'follow' && action !== 'unfollow') {
    return res.status(400).json({ success: false, message: '无效的操作' });
  }

  if (parseInt(userId) === parseInt(targetUserId)) {
      return res.status(400).json({ success: false, message: '不能关注或拉黑自己' });
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    if (action === 'follow') {
      // 检查是否已经关注
      const [existingFollow] = await connection.execute(
        'SELECT 1 FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
        [userId, targetUserId]
      );

      if (existingFollow.length > 0) {
        await connection.rollback();
        return res.status(200).json({ success: true, message: '已关注', action: 'already_following' });
      }

      // 添加关注记录
      await connection.execute(
        'INSERT INTO FollowRelation (follower_id, followed_id) VALUES (?, ?)',
        [userId, targetUserId]
      );

      // 更新用户关注数和粉丝数（假设 Users 表有 following_count 和 follower_count 字段）
      await connection.execute(
          'UPDATE Users SET following_count = following_count + 1 WHERE user_id = ?',
          [userId]
      );
      await connection.execute(
          'UPDATE Users SET follower_count = follower_count + 1 WHERE user_id = ?',
          [targetUserId]
      );

    } else if (action === 'unfollow') {
      // 检查是否已经关注
      const [existingFollow] = await connection.execute(
        'SELECT 1 FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
        [userId, targetUserId]
      );

      if (existingFollow.length === 0) {
        await connection.rollback();
        return res.status(200).json({ success: true, message: '未关注', action: 'not_following' });
      }
      
      // 删除关注记录
      await connection.execute(
        'DELETE FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
        [userId, targetUserId]
      );

       // 更新用户关注数和粉丝数
       await connection.execute(
          'UPDATE Users SET following_count = following_count - 1 WHERE user_id = ?',
          [userId]
      );
      await connection.execute(
          'UPDATE Users SET follower_count = follower_count - 1 WHERE user_id = ?',
          [targetUserId]
      );
    }

    await connection.commit();
    res.status(200).json({ success: true, action: action === 'follow' ? 'followed' : 'unfollowed' });

  } catch (error) {
    await connection.rollback();
    console.error(`执行关注/取消关注操作失败: ${error}`);
    res.status(500).json({ success: false, message: '操作失败，请稍后重试' });
  } finally {
    if (connection) await connection.end();
  }
} 