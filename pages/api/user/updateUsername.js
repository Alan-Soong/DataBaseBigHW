import { getConnection } from '../db';
import { parse } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 从 cookie 中获取用户 ID
    const cookies = parse(req.headers.cookie || '');
    const userId = cookies.user_id;

    if (!userId) {
        return res.status(401).json({ success: false, message: '未登录或会话过期' });
    }

    const { newUsername } = req.body;

    if (!newUsername || newUsername.trim() === '') {
        return res.status(400).json({ success: false, message: '新用户名不能为空' });
    }

    let connection;
    try {
        connection = await getConnection();

        // 调用存储过程更新用户名
        // 注意：调用存储过程的方式可能因数据库库而异，这里以 MySQL 为例
        // 我们使用 execute 来调用存储过程，并捕获可能的错误
        const [result] = await connection.execute(
            'CALL update_username(?, ?)',
            [userId, newUsername.trim()]
        );

        // 如果存储过程成功执行，没有抛出 SIGNAL，这里会继续执行
        res.status(200).json({ success: true, message: '用户名更新成功' });

    } catch (error) {
        console.error('更新用户名失败:', error);

        // 捕获存储过程抛出的错误
        if (error.sqlState === '45000') {
            return res.status(400).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: '服务器错误，更新失败' });

    } finally {
        if (connection) {
            await connection.end();
        }
    }
} 