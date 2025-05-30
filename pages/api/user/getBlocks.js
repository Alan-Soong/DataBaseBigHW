import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 从请求中获取用户ID
  const { userId } = req.query;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  try {
    const connection = await getConnection();

    // 获取用户的拉黑列表
    const [blockedList] = await connection.execute(
      `SELECT u.user_id, u.username, u.level
       FROM Users u
       INNER JOIN blockrelation b ON u.user_id = b.blocked_id
       WHERE b.blocker_id = ?`,
      [userId]
    );

    await connection.end();

    return res.status(200).json({
      success: true,
      blockedList
    });
  } catch (error) {
    console.error('获取拉黑列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取拉黑列表失败'
    });
  }
} 