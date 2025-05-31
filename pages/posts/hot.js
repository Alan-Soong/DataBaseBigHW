import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function HotPosts() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/checkLogin');
      const data = await res.json();

      if (data.isLoggedIn && data.userId) {
        const profileRes = await fetch(`/api/userProfile?userId=${data.userId}`);
        const profileData = await profileRes.json();

        if (profileData.success) {
          setCurrentUser(profileData.user);
          sessionStorage.setItem('currentUser', JSON.stringify(profileData.user));
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('获取当前用户信息或资料失败:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    const fetchHotPosts = async () => {
      if (!currentUser) return;
      
      try {
        setPostsLoading(true);
        const res = await fetch(`/api/posts/hot?userId=${currentUser.user_id}`);
        if (!res.ok) throw new Error(`HTTP错误: ${res.status}`);
        const data = await res.json();
        
        if (data.success && data.posts) {
          setPosts(data.posts);
        } else {
          console.error('热门帖子数据格式不正确:', data);
          setPosts([]);
        }
      } catch (error) {
        console.error('获取热门帖子失败:', error);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    if (!loading && currentUser) {
      fetchHotPosts();
    }
  }, [loading, currentUser]);

  const handleLike = async (postId) => {
    if (!currentUser) return;
    
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          userId: currentUser.user_id,
          postId
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map(post => {
          if (post.post_id === postId) {
            return {
              ...post,
              liked: !post.liked,
              like_count: post.liked ? post.like_count - 1 : post.like_count + 1
            };
          }
          return post;
        }));
        fetchCurrentUser();
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Layout>
      <Head>
        <title>热门帖子 - 校园论坛</title>
      </Head>
      
      <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}>
        <div className={userModeStyles.postSidebar}>
          <h3 className={userModeStyles.sidebarTitle}>导航菜单</h3>
          <ul className={userModeStyles.sidebarMenu}>
            <li>
              <Link href="/posts/user_mode" className={userModeStyles.navItem}>
                返回主页
              </Link>
            </li>
          </ul>
          
          {currentUser && (
            <div key={currentUser.experience} className={userModeStyles.sidebarSection}>
              <h4>当前用户</h4>
              <div className={userModeStyles.userInfo}>
                <div className={userModeStyles.avatar}>
                  {currentUser.username?.charAt(0) || '?'}
                </div>
                <span className={userModeStyles.userName}>{currentUser.username}</span>
                <div className={userModeStyles.userLevel}>
                  等级: {currentUser.level_name || ''}
                </div>
                <div className={userModeStyles.userExp}>
                  经验值: {currentUser.experience || 0}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <main className={userModeStyles.mainContent}>
          <div className={userModeStyles.postCard} style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h1 className={userModeStyles.heading} style={{ margin: 0 }}>
              热门帖子
            </h1>
          </div>

          <div className={userModeStyles.postList}>
            {postsLoading ? (
              <div className={userModeStyles.loading}>加载帖子中...</div>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <div key={post.post_id} className={userModeStyles.postCard}>
                  <h2 className={userModeStyles.postCardTitle}>
                    <Link href={`/posts/${post.post_id}`}>
                      {post.title}
                    </Link>
                  </h2>
                  <div className={userModeStyles.postMeta}>
                    <span>作者: <Link 
                      href={currentUser && post.user_id === currentUser.user_id ? '/user/me' : `/user/${post.user_id}`} 
                      className={userModeStyles.userLink}
                    >
                      {post.username}
                    </Link></span>
                    <span>发布时间: {formatDate(post.post_time)}</span>
                    <span>评论数: {post.comment_count}</span>
                    <span>点赞数: {post.like_count}</span>
                  </div>
                  <div className={userModeStyles.postContent}>
                    {post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}
                  </div>
                  <div className={userModeStyles.postActions}>
                    <button 
                      onClick={() => handleLike(post.post_id)}
                      className={`${userModeStyles.likeButton} ${post.liked ? userModeStyles.active : ''}`}
                    >
                      {post.like_count}
                    </button>
                    <Link href={`/posts/${post.post_id}#comments`} className={userModeStyles.commentButton}>
                      评论 {post.comment_count}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className={userModeStyles.emptyState}>
                <p>暂无热门帖子</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
} 