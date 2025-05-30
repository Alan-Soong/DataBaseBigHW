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

  if (action !== 'block' && action !== 'unblock') {
    return res.status(400).json({ success: false, message: '无效的操作' });
  }

  if (parseInt(userId) === parseInt(targetUserId)) {
      return res.status(400).json({ success: false, message: '不能关注或拉黑自己' });
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    if (action === 'block') {
      // 检查是否已经拉黑
      const [existingBlock] = await connection.execute(
        'SELECT 1 FROM BlockRelation WHERE blocker_id = ? AND blocked_id = ?',
        [userId, targetUserId]
      );

      if (existingBlock.length > 0) {
        await connection.rollback();
        return res.status(200).json({ success: true, message: '已拉黑', action: 'already_blocked' });
      }

      // 添加拉黑记录
      await connection.execute(
        'INSERT INTO BlockRelation (blocker_id, blocked_id) VALUES (?, ?)',
        [userId, targetUserId]
      );

      // 如果用户之前关注了此人，取消关注（可选，取决于产品逻辑）
       await connection.execute(
         'DELETE FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
         [userId, targetUserId]
       );
       // 更新关注数（如果取消了关注）
       // 需要先查询是否关注了，才能确定是否减去 following_count
       // 这里的简化逻辑是：拉黑就直接尝试减少关注数，即使没关注也不会报错（如果following_count >= 0)
       await connection.execute(
          'UPDATE Users SET following_count = GREATEST(0, following_count - 1) WHERE user_id = ?',
          [userId]
       );
        await connection.execute(
          'UPDATE Users SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = ?',
          [targetUserId]
       );

    } else if (action === 'unblock') {
       // 检查是否已经拉黑
       const [existingBlock] = await connection.execute(
        'SELECT 1 FROM BlockRelation WHERE blocker_id = ? AND blocked_id = ?',
        [userId, targetUserId]
      );

      if (existingBlock.length === 0) {
        await connection.rollback();
        return res.status(200).json({ success: true, message: '未拉黑', action: 'not_blocked' });
      }

      // 删除拉黑记录
      await connection.execute(
        'DELETE FROM BlockRelation WHERE blocker_id = ? AND blocked_id = ?',
        [userId, targetUserId]
      );

      // 取消拉黑不影响关注关系，如果之前关注了，取消拉黑后不会自动恢复关注
    }

    await connection.commit();
    res.status(200).json({ success: true, action: action === 'block' ? 'blocked' : 'unblocked' });

  } catch (error) {
    await connection.rollback();
    console.error(`执行拉黑/取消拉黑操作失败: ${error}`);
    res.status(500).json({ success: false, message: '操作失败，请稍后重试' });
  } finally {
    if (connection) await connection.end();
  }
} 