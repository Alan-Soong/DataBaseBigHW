import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
import Link from 'next/link';
import Head from 'next/head';
import ListModal from '../../components/ListModal';

export default function MyProfile() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const [showListModal, setShowListModal] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalData, setListModalData] = useState([]);

  const visibilityFields = [
    { name: 'profileBase', label: '基本信息 (头像, 用户名)' },
    { name: 'level', label: '等级' },
    { name: 'experience', label: '经验值' },
    { name: 'major', label: '专业' },
    { name: 'studentId', label: '学号' },
    { name: 'registrationDate', label: '注册时间' },
    { name: 'stats', label: '统计数据 (发帖, 评论, 获赞)' },
    { name: 'recent_posts', label: '最近发帖' },
    { name: 'following_list', label: '关注列表' },
    { name: 'followers_list', label: '粉丝列表' },
    { name: 'blocked_list', label: '拉黑列表' },
  ];

  // 新增 State for username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameEditError, setUsernameEditError] = useState('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/checkLogin');
        const data = await res.json();
        
        if (data.isLoggedIn && data.userId) {
          const profileRes = await fetch(`/api/userProfile?userId=${data.userId}`);
          const profileData = await profileRes.json();

          if (profileData.success) {
             setCurrentUser(profileData.user);
             await fetchUserProfileData(data.userId);
             setLoading(false);
          } else {
             console.error('获取当前用户资料失败:', profileData.message);
             setCurrentUser(null);
             setLoading(false);
             showToast('获取用户资料失败: ' + profileData.message);
             router.push('/auth/login');
          }

        } else {
          setCurrentUser(null);
          setLoading(false);
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
        setCurrentUser(null);
        setLoading(false);
        showToast('获取当前用户信息失败');
        router.push('/auth/login');
      }
    };

    fetchCurrentUser();
  }, [router]);

   const fetchUserProfileData = async (userId) => {
      try {
          const res = await fetch(`/api/userProfile?userId=${userId}`);
           if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            if (data.success) {
              setUserProfile(data.user);
            } else {
              console.error('获取用户资料失败:', data.message);
              setUserProfile(null);
              showToast('获取用户资料失败: ' + data.message);
            }
      } catch (error) {
           console.error('获取用户资料失败:', error);
           setUserProfile(null);
           showToast('获取用户资料失败: ' + error.message);
      }
   };

   const handleViewFollowing = async () => {
    if (!currentUser || !currentUser.user_id) return;
    try {
      const res = await fetch(`/api/user/getFollowing?userId=${currentUser.user_id}`);
      const data = await res.json();
      if (data.success) {
        setListModalTitle('关注列表');
        setListModalData(data.following);
        setShowListModal(true);
      } else {
        showToast(data.message || '获取关注列表失败');
      }
    } catch (error) {
      console.error('获取关注列表失败:', error);
      showToast('获取关注列表失败');
    }
  };

  const handleViewFollowers = async () => {
    if (!currentUser || !currentUser.user_id) return;
     try {
      const res = await fetch(`/api/user/getFollowers?userId=${currentUser.user_id}`);
      const data = await res.json();
      if (data.success) {
        setListModalTitle('粉丝列表');
        setListModalData(data.followers);
        setShowListModal(true);
      } else {
        showToast(data.message || '获取粉丝列表失败');
      }
    } catch (error) {
      console.error('获取粉丝列表失败:', error);
      showToast('获取粉丝列表失败');
    }
  };

  const handleViewBlocks = async () => {
    if (!currentUser || !currentUser.user_id) {
      showToast('请先登录');
      return;
    }
    try {
      const res = await fetch(`/api/user/getBlocks?userId=${currentUser.user_id}`); 
      const data = await res.json();
      if (data.success) {
        setListModalTitle('拉黑列表');
        setListModalData(data.blockedList);
        setShowListModal(true);
      } else {
        showToast(data.message || '获取拉黑列表失败');
      }
    } catch (error) {
      console.error('获取拉黑列表失败:', error);
      showToast('获取拉黑列表失败');
    }
  };

   const handleUserClick = (user) => {
     router.push(`/user/${user.user_id}`);
     setShowListModal(false);
   };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  useEffect(() => {
    console.log('recentPosts state changed:', userProfile?.recent_posts || []);
  }, [userProfile?.recent_posts]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

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
        setUserProfile(prev => ({
          ...prev,
          recent_posts: prev.recent_posts.filter(post => post.post_id !== postId)
        }));
        alert('帖子删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  // 当 userProfile 加载或更新时，初始化 newUsername，使用 useEffect 防止无限重渲染
  useEffect(() => {
    if (userProfile?.username) {
      setNewUsername(userProfile.username);
    }
  }, [userProfile?.username]);

  // 处理用户名编辑模式切换
  const handleEditUsernameClick = () => {
    setIsEditingUsername(true);
    setNewUsername(userProfile.username); // 编辑时，输入框显示当前用户名
    setUsernameEditError('');
  };

  // 处理新用户名输入变化
  const handleNewUsernameChange = (e) => {
    setNewUsername(e.target.value);
    setUsernameEditError('');
  };

  // 取消编辑用户名
  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setNewUsername(userProfile.username); // 恢复为当前用户名
    setUsernameEditError('');
  };

  // 保存用户名
  const handleSaveUsername = async () => {
    if (!currentUser || !currentUser.user_id) {
        showToast('请先登录');
        return;
    }
    if (!newUsername.trim()) {
        setUsernameEditError('用户名不能为空');
        return;
    }
    if (newUsername.trim() === userProfile.username) {
         setIsEditingUsername(false); // 用户名未改变，退出编辑模式
         return;
    }

    setActionLoading(true); // 设置操作加载状态
    setUsernameEditError('');

    try {
        const res = await fetch('/api/user/updateUsername', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newUsername: newUsername.trim() }),
        });

        const data = await res.json();

        if (data.success) {
            showToast('用户名更新成功！');
            // 更新页面上的用户名
            setUserProfile(prev => ({ ...prev, username: newUsername.trim() }));
            setIsEditingUsername(false);
        } else {
            // 显示后端返回的错误消息
            setUsernameEditError(data.message || '用户名更新失败');
            showToast('用户名更新失败: ' + (data.message || ''));
        }

    } catch (error) {
        console.error('更新用户名请求失败:', error);
        setUsernameEditError('网络或服务器错误，请稍后重试。');
        showToast('用户名更新失败，请稍后重试');
    } finally {
        setActionLoading(false); // 结束操作加载状态
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> 
          <div className={userModeStyles.loading}>加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!userProfile) {
    return (
       <Layout>
        <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> 
          <div className={userModeStyles.emptyState}> 
            <p>无法加载用户资料或用户不存在。</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head><title>我的个人主页 - {userProfile.username}</title></Head>

      <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> 

        {/* 返回主页链接 */}
        <div className={userModeStyles.backLinkContainer}> {/* 添加一个容器 div */}
          <Link href="/posts/user_mode" className={userModeStyles.backLink}> {/* 指向主页，根据你的实际主页路径调整 */}
            ← 返回主页
          </Link>
        </div>

        <main className={userModeStyles.mainContent}> 

          <div className={userModeStyles.profileContent}> 

            <div className={userModeStyles.profileSection}> 

              <div className={userModeStyles.profileBase}> 
                <div className={userModeStyles.profileAvatar}> 
                  {userProfile.username?.charAt(0)}
                </div>
                {/* 用户名显示和编辑区域 */}
                <div className={userModeStyles.usernameArea}> {/* 添加一个容器 div */}
                   {isEditingUsername ? (
                     <div className={userModeStyles.editUsernameInput}> {/* 编辑状态的容器 */}
                       <input
                         type="text"
                         value={newUsername}
                         onChange={handleNewUsernameChange}
                         disabled={actionLoading}
                         className={userModeStyles.inputField}
                       />
                       {/* 按钮容器 */}
                       <div className={userModeStyles.editActionsContainer}> 
                         <button onClick={handleSaveUsername} disabled={actionLoading} className={userModeStyles.editActionButton}>保存</button>
                         <button onClick={handleCancelEditUsername} disabled={actionLoading} className={userModeStyles.editActionButton}>取消</button>
                       </div>
                       {usernameEditError && <p className={userModeStyles.errorMessage}>{usernameEditError}</p>}
                     </div>
                   ) : (
                     <div className={userModeStyles.displayUsername}> {/* 显示状态的容器 */}
                        <h2 className={utilStyles.headingLg}>{userProfile.username}</h2>
                        {/* 编辑按钮，只有在非编辑状态且非加载状态下显示 */}
                        {!actionLoading && (
                           <button onClick={handleEditUsernameClick} className={userModeStyles.editActionButton}>编辑</button>
                        )}
                     </div>
                   )}

                </div>
              </div>

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

              <div className={userModeStyles.profileActions}> 
                 <button className={userModeStyles.listViewButton} onClick={handleViewFollowing}>查看关注 ({userProfile?.following_count || 0})</button>
                  <button className={userModeStyles.listViewButton} onClick={handleViewFollowers}>查看粉丝 ({userProfile?.follower_count || 0})</button>
                  <button className={userModeStyles.listViewButton} onClick={handleViewBlocks}>查看拉黑列表</button>
              </div>

              <div className={userModeStyles.profileActions}> 
                    <button onClick={() => router.push('/user/settings')} className={userModeStyles.listViewButton}> 
                        可见性设置
                    </button>
                </div>

            </div>

              <div className={userModeStyles.profileRecentPosts}> 
                <h2 className={userModeStyles.profileRecentPostsTitle}>最近发布的帖子</h2> 
                {userProfile.recent_posts && userProfile.recent_posts.length > 0 ? (
                  <div className={userModeStyles.postList}> 
                    {userProfile.recent_posts.map(post => (
                       <div key={post.post_id} className={userModeStyles.postCard}> 
                          <div className={userModeStyles.postHeader}> 
                            <h3 className={userModeStyles.postCardTitle}> 
                               <Link href={{ pathname: '/posts/[id]', query: { id: post.post_id } }}>
                                 {post.title}
                               </Link>
                            </h3>
                            <div className={userModeStyles.postMeta}> 
                              <span>频道: {post.section_name || '未分类'}</span>
                              <span>发布于: {formatDate(post.post_time)}</span>
                              <span>评论: {post.comment_count || 0}</span>
                              <span>点赞: {post.like_count || 0}</span>
                               <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeletePost(post.post_id);
                                    }}
                                    className={userModeStyles.deleteButton} 
                                    title="删除帖子"
                                  >
                                    删除
                                  </button>
                            </div>
                          </div>
                           <div className={userModeStyles.postContent}> 
                             {post.content && post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                           </div>
                       </div>
                    ))}
                  </div>
                ) : ( 
                   <div className={userModeStyles.emptyState}> 
                    <p>暂无发布的帖子。</p>
                   </div>
                )}
              </div>

          </div> 
        </main>
      </div>

      {toast.show && (
        <div className={userModeStyles.toast}> 
          {toast.message}
        </div>
      )}

       {showListModal && (
           <ListModal
               isOpen={showListModal}
               onClose={() => setShowListModal(false)}
               title={listModalTitle}
               data={listModalData}
               onUserClick={handleUserClick}
           />
       )}

    </Layout>
  );
} 