import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // 查询状态
    const { userId, targetId } = req.query;
    if (!userId || !targetId) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    try {
      const connection = await getConnection();
      // 查询关注
      const [followRows] = await connection.execute(
        'SELECT 1 FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
        [userId, targetId]
      );
      // 查询拉黑
      const [blockRows] = await connection.execute(
        'SELECT 1 FROM BlockRelation WHERE blocker_id = ? AND blocked_id = ?',
        [userId, targetId]
      );
      await connection.end();
      return res.status(200).json({
        success: true,
        isFollowing: followRows.length > 0,
        isBlocked: blockRows.length > 0
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId, targetId, action } = req.body;

  if (!userId || !targetId || !action) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少必要参数' 
    });
  }

  try {
    const connection = await getConnection();
    
    if (action === 'follow') {
      // 调用存储过程关注
      await connection.query('CALL sp_follow_user(?, ?, @success, @msg)', [userId, targetId]);
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      const result = resultRows[0];
      await connection.end();
      return res.status(200).json({ success: !!result.success, message: result.message });
    } 
    else if (action === 'unfollow') {
      // 调用存储过程取消关注
      await connection.query('CALL sp_unfollow_user(?, ?, @success, @msg)', [userId, targetId]);
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      const result = resultRows[0];
      await connection.end();
      return res.status(200).json({ success: !!result.success, message: result.message });
    }
    else if (action === 'block') {
      // 调用存储过程拉黑
      await connection.query('CALL sp_block_user(?, ?, @success, @msg)', [userId, targetId]);
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      const result = resultRows[0];
      await connection.end();
      return res.status(200).json({ success: !!result.success, message: result.message });
    }
    else if (action === 'unblock') {
      // 调用存储过程取消拉黑
      await connection.query('CALL sp_unblock_user(?, ?, @success, @msg)', [userId, targetId]);
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      const result = resultRows[0];
      await connection.end();
      return res.status(200).json({ success: !!result.success, message: result.message });
    }
    else {
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作' 
      });
    }
  } catch (error) {
    console.error('用户关系操作失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
}
