import { getConnection } from './db';

// 创建或更新个人信息可见范围设置
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // 获取用户的可见性设置
    const { userId } = req.query;
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的用户ID参数' 
      });
    }
    
    try {
      const connection = await getConnection();
      
      // 获取用户的所有可见性设置
      const [settings] = await connection.execute(
        `SELECT field_name, visible_to_admin_only, visible_to_followers_only, visible_to_all
         FROM profilevisibility
         WHERE user_id = ?`,
        [userId]
      );
      
      await connection.end();
      
      return res.status(200).json({ 
        success: true, 
        settings
      });
    } catch (error) {
        console.error('数据库操作失败:', error.message);
        console.error('SQL:', error.sql); // 输出原始SQL语句
        return res.status(500).json({
          success: false,
          message: `数据库错误: ${error.code || '未知错误'}`
        });
      }
    } 
  else if (req.method === 'POST') {
    // 更新用户的可见性设置
    const { userId, fieldName, visibleToAdminOnly, visibleToFollowersOnly, visibleToAll } = req.body;
    
    if (!userId || !fieldName) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数' 
      });
    }
    
    try {
      const connection = await getConnection();
      
      // 检查设置是否已存在
      const [existingSettings] = await connection.execute(
        `SELECT * FROM profilevisibility 
         WHERE user_id = ? AND field_name = ?`,
        [userId, fieldName]
      );
      
      if (existingSettings.length > 0) {
        // 更新现有设置
        await connection.execute(
          `UPDATE profilevisibility 
           SET visible_to_admin_only = ?, visible_to_followers_only = ?, visible_to_all = ?
           WHERE user_id = ? AND field_name = ?`,
          [visibleToAdminOnly ? 1 : 0, visibleToFollowersOnly ? 1 : 0, visibleToAll ? 1 : 0, userId, fieldName]
        );
      } else {
        // 创建新设置
        await connection.execute(
          `INSERT INTO profilevisibility 
           (user_id, field_name, visible_to_admin_only, visible_to_followers_only, visible_to_all)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, fieldName, visibleToAdminOnly ? 1 : 0, visibleToFollowersOnly ? 1 : 0, visibleToAll ? 1 : 0]
        );
      }
      
      await connection.end();
      
      return res.status(200).json({ 
        success: true, 
        message: '可见性设置已更新' 
      });
    } catch (error) {
      console.error('更新可见性设置失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '服务器错误' 
      });
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
