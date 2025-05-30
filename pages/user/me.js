import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
import Link from 'next/link';
import Head from 'next/head';

export default function MyProfile() {
  const router = useRouter();
  // 不从URL获取id，而是获取当前登录用户
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [visibilitySettings, setVisibilitySettings] = useState({});
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [editingField, setEditingField] = useState(null);

  // 获取当前登录用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // 获取登录状态，包含当前用户ID
        const res = await fetch('/api/checkLogin');
        const data = await res.json();
        
        if (data.isLoggedIn && data.userId) {
          setCurrentUser({ user_id: data.userId, username: data.username }); // 假设checkLogin返回userId和username
        } else {
          // 如果未登录，跳转到登录页
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
        router.push('/auth/login'); // 获取失败也跳转到登录页
      }
    };

    fetchCurrentUser();
  }, [router]); // 依赖router，确保router可用

  // 获取当前登录用户的资料 (依赖于 currentUser)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser || !currentUser.user_id) {
        // 如果没有当前用户或用户ID，则不执行获取资料
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 使用当前登录用户的ID获取资料
        const res = await fetch(`/api/userProfile?userId=${currentUser.user_id}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
        } else {
          console.error('获取用户资料失败:', data.message);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) { // 当 currentUser 可用时才执行获取资料
       fetchUserProfile();
       // 由于这个页面只显示当前用户资料，无需检查关注/拉黑状态，也无需获取可见性设置
    }
  }, [currentUser]); // 依赖 currentUser

  // 格式化日期 (从 [id].js 复制过来)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };
  
  // handleDeletePost 函数 (从 [id].js 复制过来，需要确保 API 可用)
  const handleDeletePost = async (postId) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    if (!confirm('确定要删除该帖子吗？此操作不可撤销，将同时删除该帖子的所有评论。')) {
      return;
    }

    try {
      const res = await fetch('/api/user/deletePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: currentUser.user_id
        })
      });

      const data = await res.json();
      if (data.success) {
        // 从用户资料中的帖子列表中移除被删除的帖子
        setUserProfile(prev => ({
          ...prev,
          recent_posts: prev.recent_posts.filter(post => post.post_id !== postId)
        }));
        alert('帖子删除成功'); // 或者使用toast提示
      } else {
        alert(data.message || '删除失败'); // 或者使用toast提示
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('删除失败，请稍后重试'); // 或者使用toast提示
    }
  };

  if (loading || !currentUser) return <Layout><p className={utilStyles.loading}>加载中...</p></Layout>;
  if (!userProfile) return <Layout><p>无法加载用户资料。</p></Layout>;

  return (
    <Layout>
      {/* 页面标题 */}
      <Head><title>我的个人主页 - {userProfile.username}</title></Head>

      {/* 个人主页容器 */}
      <div className={userModeStyles.profileContainer}> 

        {/* 1. 基础信息区 */}
        <div className={userModeStyles.profileBase}> 
          <div className={userModeStyles.profileAvatar}> 
            {userProfile.username?.charAt(0)}
          </div>
          <div className={userModeStyles.profileInfo}> 
            <div className={userModeStyles.infoBlock}> 
              <h1>{userProfile.username}</h1>
            </div>
            <div className={userModeStyles.infoBlock}>
              等级：{userProfile.level_name}（{userProfile.level}）
            </div>
            <div className={userModeStyles.infoBlock}>
              经验值：{userProfile.experience}
            </div>
            <div className={userModeStyles.infoBlock}>
              专业：{userProfile.major || '未填写'}
            </div>
            {/* 可见性设置入口 (可选) */}
            {/* <button onClick={() => setShowVisibilityModal(true)}>设置资料可见性</button> */}
          </div>
        </div>

        {/* 2. 统计信息区 */}
        <div className={userModeStyles.profileStats}> 
          <div className={userModeStyles.statBlock}> 
            发帖数：{userProfile.post_count}
          </div>
          <div className={userModeStyles.statBlock}> 
            评论数：{userProfile.comment_count}
          </div>
          <div className={userModeStyles.statBlock}> 
            获赞数：{userProfile.like_count}
          </div>
          <div className={userModeStyles.statBlock}> 
            关注：{userProfile.following_count}
          </div>
          <div className={userModeStyles.statBlock}> 
            粉丝：{userProfile.follower_count}
          </div>
        </div>

        {/* 3. 操作区 - 我的主页不显示关注/拉黑自己的按钮 */}
        {/* 如果需要编辑资料按钮可以在这里添加 */}

        {/* 4. 最近发帖区 */}
        <div className={userModeStyles.profileRecentPosts}> 
          <h2>最近发布的帖子</h2>
          {userProfile.recent_posts && userProfile.recent_posts.length > 0 ? (
            <div className={utilStyles.section}> {/* 注意这里使用了 utilStyles.section 和 utilStyles.list */}
              <ul className={utilStyles.list}>
                {userProfile.recent_posts.map(post => (
                  <li key={post.post_id} className={utilStyles.listItem}> 
                    <Link href={{
                      pathname: '/posts/[id]',
                      query: { id: post.post_id }
                    }}>
                      {post.title}
                    </Link>
                    <div className={utilStyles.listMeta}> 
                      <span>{formatDate(post.post_time)}</span>
                      <span>评论: {post.comment_count || 0}</span>
                      <span>点赞: {post.like_count || 0}</span>
                      {/* 在我的主页显示删除按钮 */}
                      <button
                          onClick={(e) => {
                            e.preventDefault(); // 阻止Link的默认跳转
                            handleDeletePost(post.post_id);
                          }}
                          className={userModeStyles.deleteButton} 
                          title="删除帖子"
                        >
                          删除
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={userModeStyles.emptyState}>暂无发帖</div> 
          )}
        </div>

        {/* 可见性设置模态框 (可选) */}
        {/* {showVisibilityModal && ( */}
          {/* <VisibilityModal */}
            {/* settings={visibilitySettings} */}
            {/* onClose={() => setShowVisibilityModal(false)} */}
            {/* onSave={updateVisibilitySetting} */}
          {/* /> */}
        {/* )} */}

      </div>
    </Layout>
  );
} 