import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../components_styles/RegisterModal.module.css'; // 新建专用样式文件

export default function RegisterModal({ isOpen, onClose, onRegistrationSuccess }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    student_id: '',
    major: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessContent, setShowSuccessContent] = useState(false);
  const successTimerRef = useRef(null); // 添加一个 ref 来存储定时器 ID

  // 当模态框打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      setShowSuccessContent(false);
      // 也可以在这里重置表单数据，如果需要的话
      setFormData({ username: '', password: '', student_id: '', major: '' });
      setConfirmPassword('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, student_id, major } = formData;
    
    if (!username || !password || !student_id || !major) {
      setError('所有字段均为必填项');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, student_id, major }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message) {
          setError(data.message);
        } else {
          setError('注册失败');
        }
        setSuccessMessage('');
        setShowSuccessContent(false);
      } else {
        setError('');
        setSuccessMessage('注册成功！');
        setShowSuccessContent(true);

        // 延迟调用父级组件传递的处理函数，以显示成功消息一段时间
        successTimerRef.current = setTimeout(() => { // 将定时器 ID 存储在 ref 中
            if (onRegistrationSuccess) {
                onRegistrationSuccess(); // 调用父级函数切换模态框
            }
        }, 3000); // 延迟 3 秒

        // 清理定时器（例如当模态框关闭前） - 可选，防止在定时器触发前关闭模态框导致错误
        // return () => clearTimeout(successTimer); // 这个清理逻辑现在放在 handleSuccessConfirm 中处理部分情况
      }
    } catch (error) {
      console.error('注册请求错误：', error);
      setError('注册请求失败，请稍后再试');
      setSuccessMessage('');
      setShowSuccessContent(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
    setSuccessMessage('');
    setShowSuccessContent(false);
  };

  const handleSuccessConfirm = () => {
    // 用户点击确定时，立即调用父级组件处理函数，并清理潜在的自动跳转定时器
    if (successTimerRef.current) { // 检查并清理定时器
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (onRegistrationSuccess) {
        onRegistrationSuccess(); // 调用父级函数切换模态框
    }
    // onClose(); // 父级组件的 onRegistrationSuccess 会处理关闭
    // router.push('/login'); // 不需要在这里跳转
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{showSuccessContent ? '注册成功' : '注册账号'}</h2>

        {showSuccessContent ? (
          <div className={styles.successContent}>
            <p>{successMessage}</p>
            <div className={styles.buttonGroup}>
              <button type="button" onClick={handleSuccessConfirm}>确定</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>用户名</label>
              <input
                type="text"
                name="username"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
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
                autoComplete="new-password"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>确认密码</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
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
        )}
      </div>
    </div>
  );
}
