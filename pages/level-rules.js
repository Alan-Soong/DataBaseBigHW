import { useEffect, useState } from 'react';
import Head from 'next/head';
import userModeStyles from '../styles/user_mode.module.css'; // 导入 user_mode 的样式

const LevelRulesPage = () => {
  const [levelRules, setLevelRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLevelRules = async () => {
      try {
        const res = await fetch('/api/levelrules');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('API-back:',data);
        if (data.success) {
          setLevelRules(data.levelRules);
        } else {
          setError(data.message || '获取数据失败');
        }
      } catch (e) {
        console.error('Fetch error:', e);
        setError('无法获取数据');
      } finally {
        setLoading(false);
      }
    };

    fetchLevelRules();
  }, []);

  if (loading) {
    return <div className={userModeStyles.container}>加载中...</div>;
  }

  if (error) {
    return <div className={userModeStyles.container}>错误: {error}</div>;
  }

  return (
    <div className={userModeStyles.container}>
      <Head>
        <title>等级规则</title>
        <meta name="description" content="等级规则列表" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={userModeStyles.postCard}>
        <h1 className={userModeStyles.postCardTitle}>等级规则</h1>

        {levelRules.length > 0 ? (
          <table className={userModeStyles.table}>
            <thead>
              <tr>
                <th>等级名称</th>
                <th>所需经验</th>
                {/* 根据 levelrule 表的实际列名添加更多表头 */}
              </tr>
            </thead>
            <tbody>
              {levelRules.map((rule) => (
                <tr key={rule.level_id}>
                  <td>{rule.level_name}</td>
                  <td>{rule.min_exp}</td>
                  <td>{/* 根据需要展示其他字段 */''}</td>
                  {/* 根据 levelrule 表的实际列名添加更多单元格 */}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>没有等级规则数据。</p>
        )}
      </div>
    </div>
  );
};

export default LevelRulesPage; 