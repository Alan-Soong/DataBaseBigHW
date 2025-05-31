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
    return <div className={`${userModeStyles.container} ${userModeStyles.mainContent}`}>加载中...</div>;
  }

  if (error) {
    return <div className={`${userModeStyles.container} ${userModeStyles.mainContent}`}>错误: {error}</div>;
  }

  return (
    <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}>
      <Head>
        <title>等级规则</title>
        <meta name="description" content="等级规则列表" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={userModeStyles.mainContent}>
        <div className={userModeStyles.postCard}>
          <h1 className={userModeStyles.postCardTitle} style={{ textAlign: 'center' }}>等级规则</h1>

          {levelRules.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>等级名称</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>所需经验</th>
                </tr>
              </thead>
              <tbody>
                {levelRules.map((rule) => (
                  <tr key={rule.level_id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{rule.level_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{rule.min_exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center' }}>没有等级规则数据。</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default LevelRulesPage; 