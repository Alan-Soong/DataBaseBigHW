import { useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import { parse } from 'cookie';
import styles from '../../styles/utils.module.css';

export async function getServerSideProps(context) {
  const cookies = parse(context.req.headers.cookie || '');
  const token = cookies.login_token;

  if (token !== 'valid') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function FirstPost() {
  const [activeSection, setActiveSection] = useState('about');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', message: '' });
  const [error, setError] = useState('');

  const sections = [
    { id: 'about', label: '关于我' },
    { id: 'project', label: '项目介绍' },
    { id: 'contact', label: '联系方式' },
  ];

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      setError('请填写所有字段');
      return;
    }
    // Simulate form submission (replace with actual API call)
    console.log('Form submitted:', formData);
    setFormData({ name: '', message: '' });
    setError('');
    setIsModalOpen(false);
  };

  return (
    <Layout>
      <Head>
        <title>作者简介</title>
      </Head>
      <div className={styles.postContainer}>
        {/* Left Sidebar */}
        <aside className={styles.postSidebar}>
          <h2 className={styles.sidebarTitle}>导航</h2>
          <ul className={styles.sidebarMenu}>
            {sections.map((section) => (
              <li
                key={section.id}
                className={`${styles.sidebarMenuItem} ${
                  activeSection === section.id ? styles.active : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </li>
            ))}
          </ul>
        </aside>

        {/* Right Content */}
        <main className={styles.postMain}>
          {activeSection === 'about' && (
            <div>
              <h1 className={styles.postTitle}>👋 你好，我是作者</h1>
              <p className={styles.lightText}>
                我是来自南开大学计算机学院的大三学生，目前正在开发一个基于 Next.js+React 和
                MySQL 的校园论坛系统，支持用户注册、登录、发帖、点赞、权限控制等功能。
              </p>
              <p>
                喜欢的朋友们可以移步我的{' '}
                <a
                  href="https://github.com/your-username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sidebarMenuLink}
                >
                  Github 主页
                </a>
                ，点个 star 哦~
              </p>
              <div className={styles.buttonContainer}>
                <button
                  className={styles.button}
                  onClick={() =>
                    window.open('https://github.com/your-username', '_blank')
                  }
                >
                  访问 Github
                </button>
              </div>
              {/* Uncomment if you want to add the image back */}
              {/* <Image
                src="/images/mypost.png"
                alt="作者头像"
                width={160}
                height={160}
                className={styles.borderCircle}
                placeholder="blur"
                blurDataURL="/images/profile-placeholder.jpg"
              /> */}
            </div>
          )}
          {activeSection === 'project' && (
            <div>
              <h1 className={styles.postTitle}>项目介绍</h1>
              <p className={styles.note}>
                注：项目源码已开源，欢迎 Star！
              </p>
              <p>
                我的校园论坛系统是一个基于 Next.js 和 MySQL 的全栈项目，旨在为学生提供一个交流平台。主要功能包括：
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>用户注册与登录：支持安全的身份验证。</li>
                <li className={styles.listItem}>发帖与评论：用户可以发布帖子并参与讨论。</li>
                <li className={styles.listItem}>点赞与权限控制：实现动态交互和角色管理。</li>
              </ul>
              <div className={styles.buttonContainer}>
                <button
                  className={styles.button}
                  onClick={() =>
                    window.open('https://github.com/your-username', '_blank')
                  }
                >
                  查看源码
                </button>
              </div>
            </div>
          )}
          {activeSection === 'contact' && (
            <div>
              <h1 className={styles.postTitle}>联系方式</h1>
              <p>有任何问题或建议？可以通过以下方式联系我，或者点击下方按钮发送消息。</p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Email: example@nankai.edu.cn</li>
                <li className={styles.listItem}>WeChat: your-wechat-id</li>
                <li className={styles.listItem}>
                  Github:{' '}
                  <a
                    href="https://github.com/your-username"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sidebarMenuLink}
                  >
                    your-username
                  </a>
                </li>
              </ul>
              <div className={styles.buttonContainer}>
                <button
                  className={styles.button}
                  onClick={() => setIsModalOpen(true)}
                >
                  发送消息
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Contact Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>发送消息</h2>
            <form className={styles.modalForm} onSubmit={handleFormSubmit}>
              <input
                type="text"
                className={styles.input}
                placeholder="姓名"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <textarea
                className={styles.input}
                placeholder="消息内容"
                rows="4"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.button}>
                  提交
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.modalClose}`}
                  onClick={() => setIsModalOpen(false)}
                >
                  关闭
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}