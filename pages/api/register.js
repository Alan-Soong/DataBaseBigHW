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
    // 建立数据库连接
    // const connection = await mysql.createConnection({
    //   host: 'localhost',
    //   user: 'root',
    //   password: '120NKu418Szl,', // ← 替换为你的真实密码
    //   database: 'mybbs',
    // });
    const connection = await getConnection();

    // 1. 检查用户名是否存在
    const [existingUsers] = await connection.execute(
      'SELECT user_id FROM Users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(409).json({ message: '用户名已存在' });
    }

    // 2. 插入 Users 表（默认经验值为 0，等级为 1，level_id 假设为 1）
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
    return res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
}
