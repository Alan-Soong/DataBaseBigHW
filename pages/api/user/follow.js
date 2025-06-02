import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId, targetUserId, action } = req.body;

  if (!userId || !targetUserId || !action) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (action !== 'follow' && action !== 'unfollow') {
    return res.status(400).json({ success: false, message: '无效的操作' });
  }

  if (parseInt(userId) === parseInt(targetUserId)) {
      return res.status(400).json({ success: false, message: '不能关注或拉黑自己' });
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let result;
    if (action === 'follow') {
      // 先执行存储过程
      await connection.query('CALL sp_follow_user(?, ?, @success, @msg)', [userId, targetUserId]);
      // 再查询输出参数
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      result = resultRows[0];
    } else if (action === 'unfollow') {
      await connection.query('CALL sp_unfollow_user(?, ?, @success, @msg)', [userId, targetUserId]);
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      result = resultRows[0];
    }
    await connection.commit();
    if (result.success === 1 || result.success === true || result.success === '1') {
      // 查询最新粉丝数或关注数
      let newCount = 0;
      if (parseInt(userId) === parseInt(targetUserId)) {
        // 自己主页，查关注数
        const [rows] = await connection.query('SELECT COUNT(*) as cnt FROM followrelation WHERE follower_id = ?', [userId]);
        newCount = rows[0].cnt;
      } else {
        // 别人主页，查粉丝数
        const [rows] = await connection.query('SELECT COUNT(*) as cnt FROM followrelation WHERE followed_id = ?', [targetUserId]);
        newCount = rows[0].cnt;
      }
      res.status(200).json({ success: true, message: result.message, newCount });
    } else {
      res.status(200).json({ success: false, message: result.message });
    }
  } catch (error) {
    await connection.rollback();
    console.error(`执行关注/取消关注操作失败: ${error}`);
    res.status(500).json({ success: false, message: '操作失败，请稍后重试' });
  } finally {
    if (connection) await connection.end();
  }
} 