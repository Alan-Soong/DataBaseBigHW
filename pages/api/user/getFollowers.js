import { getConnection } from '../db';

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

    // 获取用户的粉丝列表
    const [followers] = await connection.execute(
      `SELECT u.user_id, u.username, u.level
       FROM Users u
       INNER JOIN followrelation f ON u.user_id = f.follower_id
       WHERE f.followed_id = ?`,
      [userId]
    );

    await connection.end();

    return res.status(200).json({
      success: true,
      followers
    });
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取粉丝列表失败'
    });
  }
} 