import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '仅支持 POST 方法' });
  }

  const { username, password, student_id, major  } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  try {
    const connection = await getConnection();

    // 1. 检查用户名是否存在 (REMOVED - Handled by database unique constraint/trigger)
    /*
    const [existingUsers] = await connection.execute(
      'SELECT user_id FROM Users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(409).json({ message: '用户名已存在' });
    }
    */

    // 2. 插入 Users 表（默认经验值为 0，等级为 1，level_id 假设为 1）
    //    数据库的唯一约束或触发器会确保用户名唯一性
    const [userResult] = await connection.execute(
      `INSERT INTO Users (username, password, level_id, experience, level, student_id, major)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, password, 1, 0, 1, student_id ?? null, major ?? null]
    );

    const userId = userResult.insertId;

    // 3. 插入 UserIsAdmin 表，注册用户只能是普通用户
    await connection.execute(
      `INSERT INTO UserIsAdmin (user_id, is_admin)
       VALUES (?, ?)`,
      [userId, false]
    );

    // 4. 可选：后续可添加 UserIdentity 的逻辑（跳过）

    await connection.end();
    return res.status(201).json({ message: '注册成功' });
  } catch (err) {
    console.error('注册失败：', err);

    // 检查是否是触发器（或其他发出 SIGNAL 45000）产生的特定错误
    // 根据后端控制台输出的错误信息，错误码为 1644，SQLSTATE 为 45000
    if (err.errno === 1644 || err.sqlState === '45000') {
        // 根据数据库返回的具体错误消息来判断是用户名还是学号重复
        if (err.sqlMessage && err.sqlMessage.includes('Username already exists')) {
             const chineseMessage = '用户名已存在，请选择其他用户名！'; // 用户名重复的中文错误信息
             return res.status(409).json({ message: chineseMessage });
        } else if (err.sqlMessage && err.sqlMessage.includes('Student ID already exists')) {
             const chineseMessage = '学号已存在，无法重复注册！'; // 学号重复的中文错误信息
             return res.status(409).json({ message: chineseMessage });
        } else {
             // 如果是其他 SIGNAL 45000 错误，返回通用提示
             return res.status(409).json({ message: '数据重复，请检查输入' });
        }

    } else if (err.errno === 1062 || err.sqlState === '23000') {
         // 仍然保留对其他可能的唯一约束错误的通用处理
        if (err.message.includes('Users.student_id')) { // 示例：检查错误消息是否包含学号唯一索引名
             return res.status(409).json({ message: '学号已存在' }); // 学号重复的中文提示
        } else {
             return res.status(409).json({ message: '数据重复，请检查输入' }); // 其他重复的中文提示
        }

    } else {
        // 其他数据库或服务器错误
        return res.status(500).json({ message: '服务器错误，请稍后再试' });
    }
  }
}
