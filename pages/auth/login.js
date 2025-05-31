import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import styles from '../../styles/Login.module.css'; // 假设使用单独的登录样式文件

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // 登录成功，重定向到用户模式页面
        router.push('/posts/user_mode');
      } else {
        setError(data.message || '登录失败，请检查用户名或密码');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      setError('登录过程中发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>用户登录</title>
      </Head>
      <div className={styles.container}> {/* 应用容器样式 */}
        <div className={styles.loginBox}> {/* 应用登录框样式 */}
          <h1 className={styles.title}>用户登录</h1> {/* 应用标题样式 */}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}> {/* 应用表单组样式 */}
              <label htmlFor="username" className={styles.label}>用户名:</label> {/* 应用标签样式 */}
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input} // 应用输入框样式
                required
              />
            </div>
            <div className={styles.formGroup}> {/* 应用表单组样式 */}
              <label htmlFor="password" className={styles.label}>密码:</label> {/* 应用标签样式 */}
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input} // 应用输入框样式
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>} {/* 应用错误信息样式 */}
            <button type="submit" disabled={loading} className={styles.button}> {/* 应用按钮样式 */}
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          {/* 可选：添加注册链接或返回首页链接 */}
          <p className={styles.switchLink}> {/* 应用切换链接样式 */}
            还没有账号？ <a href="/auth/register">立即注册</a>
          </p>
        </div>
      </div>
    </Layout>
  );
} 