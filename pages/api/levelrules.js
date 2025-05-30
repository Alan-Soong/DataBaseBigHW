import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const connection = await getConnection();
      const [rows] = await connection.execute('SELECT * FROM levelrule');
      await connection.end();
      res.status(200).json({ success: true, levelRules: rows });
    } catch (error) {
      console.error('获取 levelrule 数据失败:', error);
      res.status(500).json({ success: false, message: '获取 levelrule 数据失败' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 