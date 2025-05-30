// components/ListModal.js
import React from 'react';
import Link from 'next/link';
import utilStyles from '../styles/utils.module.css'; // 引入样式

const ListModal = ({ isOpen, onClose, title, data }) => {
  if (!isOpen) return null;

  return (
    <div className={utilStyles.listModalOverlay}>
      <div className={utilStyles.listModalContent}>
        <h2 className={utilStyles.listModalTitle}>{title}</h2>
        {data && data.length > 0 ? (
          <ul className={utilStyles.modalList}>
            {data.map(item => (
              <li key={item.user_id} className={utilStyles.modalListItem}>
                 {/* 链接到用户主页 */}
                <Link href={`/user/${item.user_id}`}>
                   {item.username}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无用户。</p>
        )}
        <button onClick={onClose} className={utilStyles.listModalCloseButton}>关闭</button>
      </div>
    </div>
  );
};

export default ListModal; 