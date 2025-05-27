import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../components_styles/LoginModal.module.css';

export default function LoginModal({ isOpen, onClose }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '登录失败，请检查凭证');
        return;
      }

      // 登录成功后，先获取用户信息
      const userRes = await fetch(`/api/auth/session?username=${encodeURIComponent(username)}`);
      
      if (!userRes.ok) {
        setError('获取用户信息失败');
        return;
      }
      
      // 关闭登录窗口
      onClose();
      
      // 跳转到用户模式页面
      router.push({
        pathname: '/posts/user_mode',
        query: { username }
      });
    } catch (err) {
      console.error('登录错误:', err);
      setError('网络连接异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>用户登录</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        
        <form onSubmit={handleLogin} className={styles.modalBody}>
          <div className={styles.inputGroup}>
            <label>账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '立即登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
