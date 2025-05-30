import styles from '../styles/user_mode.module.css'; // 引用 user_mode 的样式文件

export default function ExitConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogContent}>
        <h3 className={styles.dialogTitle}>确认退出</h3>
        <p className={styles.dialogMessage}>您确定要退出论坛吗？</p>
        <div className={styles.dialogActions}>
          <button onClick={onConfirm}>退出</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
} 