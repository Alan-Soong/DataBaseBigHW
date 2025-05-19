import Link from 'next/link'
import Head from 'next/head'
import Layout from '../../components/layout'
import utilStyles from '../../styles/utils.module.css'

export default function FirstPost() {
  return (
    <Layout>
      <Head>
        <title>First Post</title>
      </Head>
      <div className={utilStyles.postContainer}>
        {/* 左侧边栏 */}
        <aside className={utilStyles.postSidebar}>
          <h3 className={utilStyles.sidebarTitle}>导航</h3>
          <ul className={utilStyles.sidebarMenu}>
            <li>
              <Link href="/">返回首页</Link>
            </li>
            <li>
              <Link href="/posts/other-post">其他帖子</Link>
            </li>
            <li>
              <Link href="/about">关于我们</Link>
            </li>
          </ul>
        </aside>
        {/* 右侧主内容区域 */}
        <main className={utilStyles.postMain}>
          <h1 className={utilStyles.postTitle}>First Post</h1>
          <h2 className={utilStyles.note}>
            注意！！！新的版本不支持 Link 里面嵌套标签
          </h2>
          {/* 空白区域，可添加未来内容 */}
          <div className={utilStyles.placeholder}>
            <p>此处为空白区域，可添加内容</p>
          </div>
        </main>
      </div>
    </Layout>
  )
}
