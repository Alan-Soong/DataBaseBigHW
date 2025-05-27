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
    
    // 检查用户是否为管理员
    const [result] = await connection.execute(
      'SELECT is_admin FROM UserIsAdmin WHERE user_id = ?',
      [userId]
    );
    
    await connection.end();
    
    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    return res.status(200).json({ 
      isAdmin: result[0].is_admin === 1 
    });
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
}
