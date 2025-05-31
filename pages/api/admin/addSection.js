import { getConnection } from '../db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sectionName, description } = req.body;

  if (!sectionName) {
    return res.status(400).json({ success: false, message: '缺少频道名称' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // 检查频道是否已存在
    const [existingSections] = await conn.query('SELECT section_id FROM section WHERE section_name = ?', [sectionName]);
    if (existingSections.length > 0) {
      conn.end();
      return res.status(409).json({ success: false, message: '频道已存在' });
    }

    // 插入新频道
    const [result] = await conn.query('INSERT INTO section (section_name, description) VALUES (?, ?)', [sectionName, description || '']);
    
    conn.end();
    res.status(201).json({ success: true, message: '频道添加成功', sectionId: result.insertId });
  } catch (err) {
    if (conn) {
      conn.end();
    }
    console.error('添加频道失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
} 