import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import Link from 'next/link';
import Head from 'next/head';

export default function UserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 获取当前登录用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { username } = router.query;
        if (!username) return;

        const res = await fetch(`/api/auth/session?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          
          // 检查是否已关注该用户
          checkRelationStatus(data.user.user_id, id);
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
      }
    };

    if (router.isReady && router.query.username) {
      fetchCurrentUser();
    }
  }, [router.isReady, router.query, id]);

  // 获取用户资料
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/userProfile?userId=${id}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  // 检查关注和拉黑状态
  const checkRelationStatus = async (currentUserId, targetUserId) => {
    if (!currentUserId || !targetUserId) return;
    
    try {
      // 检查是否已关注
      const followRes = await fetch(`/api/checkRelation?userId=${currentUserId}&targetId=${targetUserId}&type=follow`);
      const followData = await followRes.json();
      setIsFollowing(followData.exists);
      
      // 检查是否已拉黑
      const blockRes = await fetch(`/api/checkRelation?userId=${currentUserId}&targetId=${targetUserId}&type=block`);
      const blockData = await blockRes.json();
      setIsBlocked(blockData.exists);
    } catch (error) {
      console.error('检查关系状态失败:', error);
    }
  };

  // 处理关注/取消关注
  const handleFollowAction = async () => {
    if (!currentUser || !id || actionLoading) return;
    
    setActionLoading(true);
    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch('/api/userRelation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.user_id,
          targetId: id,
          action
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsFollowing(!isFollowing);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理拉黑/取消拉黑
  const handleBlockAction = async () => {
    if (!currentUser || !id || actionLoading) return;
    
    setActionLoading(true);
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const res = await fetch('/api/userRelation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.user_id,
          targetId: id,
          action
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsBlocked(!isBlocked);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('拉黑操作失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Layout>
      <Head>
        <title>{userProfile ? `${userProfile.username}的个人主页` : '用户主页'}</title>
      </Head>
      
      <div className={utilStyles.profileContainer}>
        <div className={utilStyles.profileSidebar}>
          <h3 className={utilStyles.sidebarTitle}>导航</h3>
          <ul className={utilStyles.sidebarMenu}>
            <li><Link href="/">返回首页</Link></li>
            <li>
              <Link href={{
                pathname: '/posts/user_mode',
                query: { username: router.query.username }
              }}>
                返回论坛
              </Link>
            </li>
          </ul>
          
          {currentUser && (
            <div className={utilStyles.sidebarSection}>
              <h4>当前用户</h4>
              <div className={utilStyles.userInfo}>
                <div className={utilStyles.avatar}>
                  {currentUser.username?.charAt(0) || '?'}
                </div>
                <span>{currentUser.username}</span>
                <div className={utilStyles.userLevel}>
                  等级: {currentUser.level || 1}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <main className={utilStyles.profileMain}>
          {loading ? (
            <div className={utilStyles.loading}>加载中...</div>
          ) : userProfile ? (
            <>
              <div className={utilStyles.profileHeader}>
                <div className={utilStyles.profileAvatar}>
                  {userProfile.username.charAt(0)}
                </div>
                <div className={utilStyles.profileInfo}>
                  <h1 className={utilStyles.profileName}>{userProfile.username}</h1>
                  <div className={utilStyles.profileMeta}>
                    <span>等级: {userProfile.level_name} ({userProfile.level})</span>
                    <span>经验值: {userProfile.experience}</span>
                    {userProfile.major && <span>专业: {userProfile.major}</span>}
                  </div>
                  
                  {currentUser && currentUser.user_id !== parseInt(id) && (
                    <div className={utilStyles.profileActions}>
                      <button 
                        onClick={handleFollowAction}
                        className={`${utilStyles.actionButton} ${isFollowing ? utilStyles.following : ''}`}
                        disabled={actionLoading}
                      >
                        {isFollowing ? '已关注' : '关注'}
                      </button>
                      <button 
                        onClick={handleBlockAction}
                        className={`${utilStyles.actionButton} ${isBlocked ? utilStyles.blocked : ''}`}
                        disabled={actionLoading}
                      >
                        {isBlocked ? '已拉黑' : '拉黑'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={utilStyles.profileStats}>
                <div className={utilStyles.statItem}>
                  <div className={utilStyles.statValue}>{userProfile.post_count}</div>
                  <div className={utilStyles.statLabel}>发帖数</div>
                </div>
                <div className={utilStyles.statItem}>
                  <div className={utilStyles.statValue}>{userProfile.comment_count}</div>
                  <div className={utilStyles.statLabel}>评论数</div>
                </div>
                <div className={utilStyles.statItem}>
                  <div className={utilStyles.statValue}>{userProfile.like_count}</div>
                  <div className={utilStyles.statLabel}>获赞数</div>
                </div>
                <div className={utilStyles.statItem}>
                  <div className={utilStyles.statValue}>{userProfile.following_count}</div>
                  <div className={utilStyles.statLabel}>关注</div>
                </div>
                <div className={utilStyles.statItem}>
                  <div className={utilStyles.statValue}>{userProfile.follower_count}</div>
                  <div className={utilStyles.statLabel}>粉丝</div>
                </div>
              </div>
              
              <div className={utilStyles.profileContent}>
                <h2 className={utilStyles.sectionTitle}>最近发布的帖子</h2>
                {userProfile.recent_posts && userProfile.recent_posts.length > 0 ? (
                  <div className={utilStyles.recentPosts}>
                    {userProfile.recent_posts.map(post => (
                      <div key={post.post_id} className={utilStyles.postItem}>
                        <h3 className={utilStyles.postTitle}>
                          <Link href={`/posts/${post.post_id}`}>
                            {post.title}
                          </Link>
                        </h3>
                        <div className={utilStyles.postMeta}>
                          <span>发布于: {formatDate(post.post_time)}</span>
                          <span>评论: {post.comment_count}</span>
                          <span>点赞: {post.like_count}</span>
                        </div>
                        <div className={utilStyles.postExcerpt}>
                          {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={utilStyles.emptyState}>暂无发帖</div>
                )}
              </div>
            </>
          ) : (
            <div className={utilStyles.errorState}>用户不存在或已被删除</div>
          )}
        </main>
      </div>
    </Layout>
  );
}
