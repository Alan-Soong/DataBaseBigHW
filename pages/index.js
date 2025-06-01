import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import { useState } from 'react'
import { useRouter } from 'next/router'
import AdminModal from '../components/AdminMocal'
import LoginModal from '../components/LocalMocal'
import RegisterModal from '../components/RegisterMocal'
import styles from '../styles/Home.module.css' // 新增样式文件

export default function Home() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // 处理注册成功，关闭注册模态框，打开登录模态框
  const handleRegistrationSuccess = () => {
    setShowRegister(false); // 关闭注册模态框
    setShowLogin(true); // 打开登录模态框
  };

  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={`${utilStyles.headingMd} ${styles.content}`}>
        <h1 className={styles.title}>欢迎来到华北地区最具影响力的BBS系统！</h1>

        <p className={styles.description}>
          在这里你可以自由发表观点和看法，关注学术大牛，和其他BBS用户进行交流。
          <a href="https://github.com/Alan-Soong" target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
            这是作者的GitHub官网，可以点STAR！
          </a>
        </p>

        <div className={styles.buttonContainer}>
          <button
            className={`${styles.button} ${styles.registerBtn}`}
            onClick={() => setShowRegister(true)}
          >
            注册
          </button>
          <button
            className={`${styles.button} ${styles.loginBtn}`}
            onClick={() => setShowLogin(true)}
          >
            进入论坛
          </button>
          <button
            className={`${styles.button} ${styles.adminBtn}`}
            onClick={openModal}
          >
            管理员模式
          </button>
        </div>
      </section>

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onRegistrationSuccess={handleRegistrationSuccess} // 传递注册成功处理函数
      />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <AdminModal isOpen={isModalOpen} onClose={closeModal} />
    </Layout>
  )
}