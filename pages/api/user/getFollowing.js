import { query } from '../db'; // 假设您的数据库查询函数在这里
import { authenticatedRoute } from '../auth/authenticatedRoute';


export default authenticatedRoute(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId } = req.query; // 获取要查询的用户的ID

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // 查询数据库获取该用户关注的人的列表
    // 假设有一个 follows 表，结构为 follower_id, following_id
    const result = await query(
      `SELECT u.user_id, u.username FROM follows f JOIN users u ON f.following_id = u.user_id WHERE f.follower_id = ?`,
      [userId]
    );

    res.status(200).json({ success: true, following: result });
  } catch (error) {
    console.error('Error fetching following list:', error.message); // 打印错误消息
    console.error('Error details:', error); // 打印完整的错误对象
    res.status(500).json({ success: false, message: 'Failed to fetch following list', error: error.message }); // 在响应中包含错误消息
  }
}); 