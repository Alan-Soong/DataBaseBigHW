import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { userId, isAdmin } = req.body;

  if (userId === undefined || isAdmin === undefined) {
    return res.status(400).json({ success: false, message: '缺少必要的参数：userId 或 isAdmin' });
  }

  let connection;
  try {
    connection = await getConnection();

    // 检查当前操作用户是否为管理员 (这里需要您根据实际情况添加认证和授权逻辑)
    // 例如，可以从 session 或 token 中获取当前用户ID，并查询其 isAdmin 状态
    // 为了简化，这里暂时跳过管理员权限检查，实际应用中务必加上！
    // if (!currentUser || !currentUser.isAdmin) {
    //   return res.status(403).json({ success: false, message: '没有权限进行此操作' });
    // }

    const [result] = await connection.execute(
      'UPDATE Userisadmin SET is_admin = ? WHERE user_id = ?',
      [isAdmin ? 1 : 0, userId]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ success: true, message: '用户管理员权限设置成功' });
    } else {
      // 用户ID不存在或isAdmin值与当前相同
      res.status(400).json({ success: false, message: '用户不存在或管理员状态未改变' });
    }

  } catch (error) {
    console.error('设置管理员权限失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
} 