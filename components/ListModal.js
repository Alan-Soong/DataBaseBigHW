// components/ListModal.js
import { useState } from 'react';
import styles from '../styles/list_modal.module.css';

export default function ListModal({ isOpen, onClose, title, data, onUserClick }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.modalBody}>
          {data && data.length > 0 ? (
            <ul className={styles.userList}>
              {data.map(user => (
                <li key={user.user_id} className={styles.userItem}>
                  <div className={styles.userInfo}>
                    <span className={styles.username}>{user.username}</span>
                    <span className={styles.level}>等级: {user.level}</span>
                  </div>
                  {onUserClick && (
                    <button 
                      onClick={() => onUserClick(user)}
                      className={styles.viewProfileButton}
                    >
                      查看主页
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
} 