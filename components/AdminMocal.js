import { useRouter } from 'next/router';
import utilStyles from '../styles/utils.module.css';

export default function AdminModal({ isOpen, onClose }) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className={utilStyles.modalOverlay} onClick={onClose}>
      <div
        className={utilStyles.modalContent}
        onClick={(e) => e.stopPropagation()} // 防止点击内容关闭模态
      >
        <h2 className={utilStyles.modalTitle}>管理员模式</h2>
        <p>请输入管理员凭据或选择管理选项</p>
        <form className={utilStyles.modalForm}>
          <label>
            用户名：
            <input type="text" className={utilStyles.input} />
          </label>
          <label>
            密码：
            <input type="password" className={utilStyles.input} />
          </label>
          <div className={utilStyles.buttonContainer}>
            <button
              type="button"
              className={utilStyles.button}
              onClick={() => {
                alert('管理员登录（示例）');
                onClose();
                router.push('/posts/admin_mode'); // 登录成功跳转
              }}
            >
              登录
            </button>
            <button
              className={`${utilStyles.button} ${utilStyles.modalClose}`}
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