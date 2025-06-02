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

  if (action !== 'block' && action !== 'unblock') {
    return res.status(400).json({ success: false, message: '无效的操作' });
  }

  if (parseInt(userId) === parseInt(targetUserId)) {
      return res.status(400).json({ success: false, message: '不能关注或拉黑自己' });
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let result;
    if (action === 'block') {
      await connection.query('CALL sp_block_user(?, ?, @success, @msg)', [userId, targetUserId]);
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      result = resultRows[0];
    } else if (action === 'unblock') {
      await connection.query('CALL sp_unblock_user(?, ?, @success, @msg)', [userId, targetUserId]);
      const [resultRows] = await connection.query('SELECT @success AS success, @msg AS message');
      result = resultRows[0];
    }
    await connection.commit();
    if (result.success === 1 || result.success === true || result.success === '1') {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(200).json({ success: false, message: result.message });
    }
  } catch (error) {
    await connection.rollback();
    console.error(`执行拉黑/取消拉黑操作失败: ${error}`);
    res.status(500).json({ success: false, message: '操作失败，请稍后重试' });
  } finally {
    if (connection) await connection.end();
  }
} 