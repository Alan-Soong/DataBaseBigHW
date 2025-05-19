import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/utils.module.css';

export default function RegisterModal({ isOpen, onClose }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [student_id, setStudentId] = useState('');
  const [major, setMajor] = useState('');
  const [error, setError] = useState('');


  const handleRegister = async () => {
    if (!username || !password) {
      setError('请填写用户名和密码');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password,
          student_id,
          major }),
      });

      const data = await res.json();

      if (!res.ok) {
        // const data = await res.json();
        setError(data.message || '注册失败');
        return;
      }

      onClose();  // 关闭模态框
      router.push('/posts/user_mode'); // 注册成功跳转
    } catch (err) {
      console.error(err);
      setError('网络错误或服务器异常');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>注册账号</h2>
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
          <label>
            学号：
            <input className={styles.input} value={student_id} onChange={(e) => setStudentId(e.target.value)} />
          </label>
          <label>
            专业：
            <input className={styles.input} value={major} onChange={(e) => setMajor(e.target.value)} />
          </label>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.button} onClick={handleRegister}>
              注册
            </button>
            <button type="button" className={`${styles.button} ${styles.modalClose}`} onClick={onClose}>
              关闭
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
