import { query } from '../db'; // 假设您的数据库查询函数在这里
import { auth } from '../auth/session'; // 假设您的认证中间件在这里

export default auth(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId } = req.query; // 获取要查询的用户的ID

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // 查询数据库获取该用户的粉丝列表
    // 假设有一个 follows 表，结构为 follower_id, following_id
    const result = await query(
      `SELECT u.user_id, u.username FROM follows f JOIN users u ON f.follower_id = u.user_id WHERE f.following_id = ?`,
      [userId]
    );

    res.status(200).json({ success: true, followers: result });
  } catch (error) {
    console.error('Error fetching followers list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch followers list' });
  }
}); 