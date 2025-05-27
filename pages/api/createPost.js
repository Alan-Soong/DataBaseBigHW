import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId, title, content, sectionId } = req.body;

  if (!userId || !title || !content || !sectionId) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少必要参数' 
    });
  }

  try {
    const connection = await getConnection();
    
    // 开始事务
    await connection.beginTransaction();
    
    try {
      // 1. 插入帖子
      const [postResult] = await connection.execute(
        `INSERT INTO Post (user_id, title, content, create_at, post_time) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [userId, title, content]
      );
      
      const postId = postResult.insertId;
      
      // 2. 关联帖子与频道
      await connection.execute(
        `INSERT INTO Belonging_to (section_id, post_id) 
         VALUES (?, ?)`,
        [sectionId, postId]
      );
      
      // 3. 更新用户经验值（每发帖增加10点经验）
      await connection.execute(
        `UPDATE Users SET experience = experience + 1 
         WHERE user_id = ?`,
        [userId]
      );
      
      // 4. 检查用户是否可以升级
      const [userResult] = await connection.execute(
        `SELECT u.experience, u.level_id, l.min_exp 
         FROM Users u
         JOIN LevelRule l ON u.level_id = l.level_id
         WHERE u.user_id = ?`,
        [userId]
      );
      
      if (userResult.length > 0) {
        const user = userResult[0];
        const currentExp = user.experience;
        
        // 获取下一级别的经验要求
        const [nextLevelResult] = await connection.execute(
          `SELECT level_id, min_exp 
           FROM LevelRule 
           WHERE level_id > ? 
           ORDER BY level_id ASC 
           LIMIT 1`,
          [user.level_id]
        );
        
        // 如果有下一级别且经验值达到要求，则升级
        if (nextLevelResult.length > 0 && currentExp >= nextLevelResult[0].min_exp) {
          await connection.execute(
            `UPDATE Users 
             SET level_id = ?, level = ? 
             WHERE user_id = ?`,
            [nextLevelResult[0].level_id, nextLevelResult[0].level_id, userId]
          );
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 获取新创建的帖子信息
      const [posts] = await connection.execute(
        `SELECT p.post_id, p.title, p.content, p.create_at, p.post_time, u.username
         FROM Post p
         JOIN Users u ON p.user_id = u.user_id
         WHERE p.post_id = ?`,
        [postId]
      );
      
      await connection.end();
      
      return res.status(201).json({ 
        success: true, 
        post: posts[0] 
      });
    } catch (error) {
      // 如果出错，回滚事务
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('发帖失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
}
