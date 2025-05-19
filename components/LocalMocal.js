import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/utils.module.css';

export default function LoginModal({ isOpen, onClose }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '登录失败');
        return;
      }

      // 登录成功
      onClose();
      router.push('/posts/user_mode');
    } catch (err) {
      console.error(err);
      setError('网络错误或服务器异常');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>登录</h2>
        <form className={styles.modalForm} onSubmit={(e) => e.preventDefault()}>
          <label>
            用户名：
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            密码：
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.button}
              onClick={handleLogin}
            >
              登录
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.modalClose}`}
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
