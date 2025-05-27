import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../components_styles/RegisterModal.module.css'; // 新建专用样式文件

export default function RegisterModal({ isOpen, onClose }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    student_id: '',
    major: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, student_id, major } = formData;
    
    if (!username || !password || !student_id || !major) {
      setError('所有字段均为必填项');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '注册失败');

      onClose();
      router.push('/posts/user_mode');
    } catch (err) {
      console.error('注册错误:', err);
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>注册账号</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>用户名</label>
            <input
              type="text"
              name="username"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>密码</label>
            <input
              type="password"
              name="password"
              placeholder="至少6位密码"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>学号</label>
            <input
              type="text"
              name="student_id"
              placeholder="请输入学号"
              value={formData.student_id}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>专业</label>
            <input
              type="text"
              name="major"
              placeholder="请输入专业名称"
              value={formData.major}
              onChange={handleInputChange}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonGroup}>
            <button type="submit" disabled={isLoading}>
              {isLoading ? '注册中...' : '立即注册'}
            </button>
            <button type="button" onClick={onClose}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}
