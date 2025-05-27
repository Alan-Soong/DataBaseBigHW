import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId, targetId, type } = req.query;

  if (!userId || !targetId || !type) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少必要参数' 
    });
  }

  try {
    const connection = await getConnection();
    
    if (type === 'follow') {
      // 检查是否已关注
      const [result] = await connection.execute(
        'SELECT * FROM FollowRelation WHERE follower_id = ? AND followed_id = ?',
        [userId, targetId]
      );
      
      await connection.end();
      return res.status(200).json({ 
        exists: result.length > 0 
      });
    } 
    else if (type === 'block') {
      // 检查是否已拉黑
      const [result] = await connection.execute(
        'SELECT * FROM BlockRelation WHERE blocker_id = ? AND blocked_id = ?',
        [userId, targetId]
      );
      
      await connection.end();
      return res.status(200).json({ 
        exists: result.length > 0 
      });
    }
    else {
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        message: '不支持的关系类型' 
      });
    }
  } catch (error) {
    console.error('检查用户关系失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
}
