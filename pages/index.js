import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import { useState } from 'react'
import { useRouter } from 'next/router'
import AdminModal from '../components/AdminMocal'
import LoginModal from '../components/LocalMocal'
import RegisterModal from '../components/RegisterMocal'

export default function Home() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [showLogin, setShowLogin] = useState(false); // 👈 定义 showLogin
  const [showRegister, setShowRegister] = useState(false);

  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>

        <center>欢迎来到华北地区最具影响力的BBS系统！</center>

        {<p>
          在这里你可以自由发表观点和看法，关注学术大牛，和其他BBS用户进行交流。
          <b></b>
          <a href="https://github.com/Alan-Soong" target="_blank" rel="noopener noreferrer">这是作者的GitHub官网，可以点STAR！</a>
        </p>}

        <div className={utilStyles.buttonContainer}>
          <button
            className={utilStyles.button}
            // onClick={() => router.push('/posts/first-post')}
            onClick={() => setShowRegister(true)}
          >
            注册
          </button>
          <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
          <button
            className={utilStyles.button}
            onClick={() => setShowLogin(true)}
          >
            进入论坛
          </button>
          <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
          <button
            className={utilStyles.button}
            onClick={openModal}
          >
            管理员模式
          </button>
        </div>

      </section>
      <AdminModal isOpen={isModalOpen} onClose={closeModal} />
    </Layout>
  )
}