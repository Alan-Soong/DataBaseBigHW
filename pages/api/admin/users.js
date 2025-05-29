import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: '仅支持 GET 请求' 
    });
  }

  try {
    const connection = await getConnection();

    // 从查询参数获取用户 ID（假设通过基本认证传递）
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少用户ID参数' 
      });
    }

    // 直接检查 UserIsAdmin 表
    const [adminCheck] = await connection.execute(
      `SELECT is_admin 
       FROM UserIsAdmin 
       WHERE user_id = ?`,
      [userId]
    );

    if (adminCheck.length === 0 || adminCheck[0].is_admin !== 1) {
      await connection.end();
      return res.status(403).json({ 
        success: false, 
        message: '无权访问此资源' 
      });
    }

    // 获取用户列表（排除密码字段）
    const [users] = await connection.execute(
      `SELECT 
        u.user_id, 
        u.username, 
        u.major, 
        u.level, 
        u.experience,
        a.is_admin
        FROM Users u
        JOIN UserIsAdmin a ON u.user_id = a.user_id`
    );

    await connection.end();

    return res.status(200).json({ 
      success: true, 
      users 
    });

  } catch (err) {
    console.error('获取用户列表失败:', err);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
}