import Head from 'next/head'
import styles from '../components_styles/layout.module.css'
import utilStyles from '../styles/utils.module.css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ExitConfirmModal from './ExitConfirmModal'
import { useState } from 'react'

const name = '独属于你自己的BBS！'
export const siteTitle = '属于你自己的BBS！'

export default function Layout({ children, home }) {
  const router = useRouter()
  const [showBackConfirm, setShowBackConfirm] = useState(false)

  const handleBackToHome = (e) => {
    e.preventDefault()
    setShowBackConfirm(true)
  }

  const confirmBackToHome = () => {
    router.push('/')
    setShowBackConfirm(false)
  }

  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Learn how to build a personal website using Next.js"
        />
        <meta
          property="og:image"
          content={`https://og-image.now.sh/${encodeURI(
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className={styles.header}>
        {home ? (
          <>
            <img
              src="/images/title.jpg"
              className={`${styles.headerHomeImage} ${utilStyles.borderCircle}`}
              alt={name}
            />
            <h1 className={utilStyles.heading2Xl}>{name}</h1>
          </>
        ) : (
          <>
            <Link href="/">
                <img
                  src="/images/title.jpg"
                  className={`${styles.headerImage} ${utilStyles.borderCircle}`}
                  alt={name}
                />
              
            </Link>
            <h2 className={utilStyles.headingLg}>
              <Link href="/" className={utilStyles.colorInherit}>
                {name}
              </Link>
            </h2>
          </>
        )}
      </header>
      <main className={styles.mainContent}>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href="/level-rules" className={styles.backLink}>
            等级规则
          </Link>
          <a href="#" onClick={handleBackToHome} className={styles.backLink}>
            ← Back to home
          </a>
        </div>
      )}

      <ExitConfirmModal
        isOpen={showBackConfirm}
        onClose={() => setShowBackConfirm(false)}
        onConfirm={confirmBackToHome}
      />

    </div>
  )
}