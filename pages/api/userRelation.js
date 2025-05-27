import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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
      // 检查是否已经关注
      const [existingFollow] = await connection.execute(
        'SELECT * FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
        [userId, targetId]
      );
      
      if (existingFollow.length > 0) {
        await connection.end();
        return res.status(400).json({ 
          success: false, 
          message: '已经关注该用户' 
        });
      }
      
      // 添加关注关系
      await connection.execute(
        'INSERT INTO FollowRelation (follower_id, followed_id, follow_time) VALUES (?, ?, NOW())',
        [userId, targetId]
      );
      
      await connection.end();
      return res.status(200).json({ 
        success: true, 
        message: '关注成功' 
      });
    } 
    else if (action === 'unfollow') {
      // 取消关注
      await connection.execute(
        'DELETE FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
        [userId, targetId]
      );
      
      await connection.end();
      return res.status(200).json({ 
        success: true, 
        message: '取消关注成功' 
      });
    }
    else if (action === 'block') {
      // 检查是否已经拉黑
      const [existingBlock] = await connection.execute(
        'SELECT * FROM BlockRelation WHERE blocker_id = ? AND blocked_id = ?',
        [userId, targetId]
      );
      
      if (existingBlock.length > 0) {
        await connection.end();
        return res.status(400).json({ 
          success: false, 
          message: '已经拉黑该用户' 
        });
      }
      
      // 添加拉黑关系
      await connection.execute(
        'INSERT INTO BlockRelation (blocker_id, blocked_id, block_time) VALUES (?, ?, NOW())',
        [userId, targetId]
      );
      
      await connection.end();
      return res.status(200).json({ 
        success: true, 
        message: '拉黑成功' 
      });
    }
    else if (action === 'unblock') {
      // 取消拉黑
      await connection.execute(
        'DELETE FROM BlockRelation WHERE blocker_id = ? AND blocked_id = ?',
        [userId, targetId]
      );
      
      await connection.end();
      return res.status(200).json({ 
        success: true, 
        message: '取消拉黑成功' 
      });
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
