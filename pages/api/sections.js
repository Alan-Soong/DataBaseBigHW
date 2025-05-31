import { getConnection } from './db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const connection = await getConnection();
      
      // 获取所有频道
      const [sections] = await connection.execute(`
        SELECT 
          s.section_id, 
          s.section_name, 
          s.description,
          COUNT(bt.post_id) AS post_count
        FROM Section s
        LEFT JOIN Belonging_to bt ON s.section_id = bt.section_id
        GROUP BY s.section_id, s.section_name, s.description
      `);
      
      await connection.end();
      
      // 如果没有频道，创建默认频道
      if (sections.length === 0) {
        const defaultSections = await createDefaultSections();
        return res.status(200).json({ success: true, sections: defaultSections });
      }
      
      return res.status(200).json({ success: true, sections });
    } catch (error) {
      console.error('获取频道失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else if (req.method === 'POST') {
    // 创建新频道
    const { userId, sectionName, description } = req.body;
    
    if (!userId || !sectionName) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    try {
      const connection = await getConnection();
      
      // 插入新频道
      const [result] = await connection.execute(
        'INSERT INTO Section (user_id, section_name, description) VALUES (?, ?, ?)',
        [userId, sectionName, description || '']
      );
      
      const sectionId = result.insertId;
      
      // 获取新创建的频道信息
      const [sections] = await connection.execute(
        'SELECT section_id, section_name, description FROM Section WHERE section_id = ?',
        [sectionId]
      );
      
      await connection.end();
      
      return res.status(201).json({ 
        success: true, 
        section: sections[0] 
      });
    } catch (error) {
      console.error('创建频道失败:', error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 创建默认频道
async function createDefaultSections() {
  try {
    const connection = await getConnection();
    
    // 默认频道数据
    const defaultSections = [
      { name: '校园生活', description: '分享校园日常生活、活动和趣事' },
      { name: '学术交流', description: '讨论学术问题、分享学习资源和经验' },
      { name: '社团活动', description: '发布社团活动信息、招新和活动回顾' },
      { name: '失物招领', description: '发布校园内丢失和拾获物品的信息' },
      { name: '二手交易', description: '发布二手物品交易信息' }
    ];
    
    // 插入默认频道
    const createdSections = [];
    for (const section of defaultSections) {
      const [result] = await connection.execute(
        'INSERT INTO Section (section_id, user_id, section_name, description) VALUES (?, NULL, ?, ?)',
        [createdSections.length + 1, section.name, section.description]
      );
      
      createdSections.push({
        section_id: createdSections.length + 1,
        section_name: section.name,
        description: section.description
      });
    }
    
    await connection.end();
    return createdSections;
  } catch (error) {
    console.error('创建默认频道失败:', error);
    throw error;
  }
}
