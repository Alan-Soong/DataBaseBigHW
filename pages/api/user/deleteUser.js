import { getConnection } from '../db';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // **重要：在这里添加权限验证逻辑**
    // 例如，可以通过检查 cookie 中的用户 ID 是否与请求中的 userId 一致来验证
    // 或者在更安全的认证系统中验证用户会话

    // 暂时的简易验证：确保请求中提供了有效的 userId
    const [userCheck] = await conn.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 开始事务
    await conn.beginTransaction();

    // 删除与用户相关的帖子（Post表）
    await conn.query('DELETE FROM post WHERE user_id = ?', [userId]);

    // 删除与用户相关的评论（Comment表）
    // 注意：这里需要先删除回复，再删除顶层评论，或者使用 ON DELETE CASCADE 外键约束
    // 假设 Comment 表有 parent_comment_id 和 user_id
    // 这里简单删除用户的所有评论，如果评论有回复，这些回复可能会变成"孤儿评论"
    // 更严谨的做法是根据数据库外键设置，或者递归删除评论
    await conn.query('DELETE FROM comment WHERE user_id = ?', [userId]);

    // 删除用户在点赞表中的记录（Likes表 - 用户点赞过的）
    await conn.query('DELETE FROM likes WHERE user_id = ?', [userId]);

    // 删除其他用户对该用户的点赞记录（如果 Likes 表设计支持）
    // 假设 Likes 表有一个指向用户ID的字段，例如 target_user_id (如果点赞目标是用户)
    // await conn.query('DELETE FROM likes WHERE target_user_id = ?', [userId]); // 根据实际表结构调整

    // 删除用户在 Belonging_to 表中的记录 (如果用户创建了频道)
    // await conn.query('DELETE FROM belonging_to WHERE user_id = ?', [userId]); // 根据实际表结构调整
    // 频道创建者（Section表）可能也需要处理，如果用户创建了频道
    // await conn.query('UPDATE section SET user_id = NULL WHERE user_id = ?', [userId]); // 例如设置为 NULL
    // 或者如果频道可以删除，可能需要删除用户创建的频道

    // 删除用户在关注关系表中的记录（FollowRelation表）
    // 用户关注别人的记录
    await conn.query('DELETE FROM followrelation WHERE follower_id = ?', [userId]);
    // 其他用户关注该用户的记录
    await conn.query('DELETE FROM followrelation WHERE followed_id = ?', [userId]);
    
    // 找出所有关注了该用户的用户，并更新他们的 following_count
    const [followersToUpdate] = await conn.query(
        'SELECT follower_id FROM followrelation WHERE followed_id = ?',
        [userId]
    );
    if (followersToUpdate.length > 0) {
        const followerIds = followersToUpdate.map(row => row.follower_id);
        await conn.query(
            `UPDATE users SET following_count = following_count - 1 WHERE user_id IN (${followerIds.map(() => '?').join(',')})`,
            followerIds
        );
    }

    // 找出所有被该用户拉黑的用户，并更新他们的 blocker_count
    // 假设 BlockRelation 表有 blocker_id 和 blocked_id 字段
    const [blockedToUpdate] = await conn.query(
        'SELECT blocked_id FROM blockrelation WHERE blocker_id = ?',
        [userId]
    );
     if (blockedToUpdate.length > 0) {
        const blockedIds = blockedToUpdate.map(row => row.blocked_id);
        await conn.query(
            `UPDATE users SET blocker_count = blocker_count - 1 WHERE user_id IN (${blockedIds.map(() => '?').join(',')})`,
            blockedIds
        );
    }
    
    // 找出所有拉黑了该用户的用户，并更新他们的 blocked_count
    const [blockersToUpdate] = await conn.query(
        'SELECT blocker_id FROM blockrelation WHERE blocked_id = ?',
        [userId]
    );
     if (blockersToUpdate.length > 0) {
        const blockerIds = blockersToUpdate.map(row => row.blocker_id);
        await conn.query(
            `UPDATE users SET blocked_count = blocked_count - 1 WHERE user_id IN (${blockerIds.map(() => '?').join(',')})`,
            blockerIds
        );
    }

    // 删除用户在 UserIsAdmin 表中的记录
    await conn.query('DELETE FROM userisadmin WHERE user_id = ?', [userId]);

    // 删除用户在 ProfileVisibility 表中的记录
    await conn.query('DELETE FROM profilevisibility WHERE user_id = ?', [userId]);

    // **重要：最后删除 Users 表中的用户记录**
    await conn.query('DELETE FROM users WHERE user_id = ?', [userId]);

    // 提交事务
    await conn.commit();

    conn.end();
    res.status(200).json({ success: true, message: '用户注销成功' });
  } catch (err) {
    if (conn) {
      // 回滚事务
      await conn.rollback();
      conn.end();
    }
    console.error('注销用户失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 