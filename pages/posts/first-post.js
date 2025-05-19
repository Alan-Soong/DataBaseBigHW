import Link from 'next/link'
import Head from 'next/head'
import Layout from '../../components/layout'

import { parse } from 'cookie';

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
  return (
    <Layout>
      <Head>
        <title>First Post</title>
      </Head>
      <h1>First Post</h1>
      { <h2>
        <Link href="/">Back to home</Link>
      </h2> }
      <h2>
        注意！！！新的版本不支持link里面嵌套了
      </h2>
    </Layout>
  )
}
