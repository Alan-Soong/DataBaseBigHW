import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
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
  const [visibilitySettings, setVisibilitySettings] = useState({});
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [viewerId, setViewerId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });

  // 获取当前登录用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/checkLogin');
        const data = await res.json();

        if (data.isLoggedIn && data.userId) {
          // 同时获取详细用户资料，包含 level 和 is_admin
          const profileRes = await fetch(`/api/userProfile?userId=${data.userId}`);
          const profileData = await profileRes.json();

          if (profileData.success) {
             setCurrentUser(profileData.user); // 设置包含 level 和 is_admin 的完整用户对象
          } else {
             console.error('获取当前用户资料失败:', profileData.message);
             setCurrentUser(null);
          }

        } else {
          setCurrentUser(null); // 未登录
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, []); // 仅在组件挂载时运行一次

  // 获取用户资料
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // 将当前登录用户的ID作为 viewerId 传递给后端
        const viewerIdParam = currentUser ? `&viewerId=${currentUser.user_id}` : '';
        const res = await fetch(`/api/userProfile?userId=${id}${viewerIdParam}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
          setRecentPosts(data.recent_posts || []);
          console.log('User Profile:', data.user);
          // 根据后端返回的数据更新关注和拉黑状态
          if (data.user) {
             setIsFollowing(data.user.isFollowing || false);
             setIsBlocked(data.user.isBlocked || false);
          }
           // 如果是自己的主页，获取可见性设置
           if (currentUser && currentUser.user_id === parseInt(id)) {
               fetchVisibilitySettings(currentUser.user_id);
           }

        } else {
          console.error('获取用户资料失败:', data.message);
          showToast('获取用户资料失败: ' + data.message);
          setUserProfile(null);
          setRecentPosts([]);
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        showToast('获取用户资料失败: ' + error.message);
        setUserProfile(null);
        setRecentPosts([]);
      } finally {
        setLoading(false);
      }
    };

    // 当id或当前用户变化时重新获取用户资料
    if (id) {
      fetchUserProfile();
    }
  }, [id, currentUser]);

  // 获取可见性设置
  const fetchVisibilitySettings = async (userId) => {
    try {
      const res = await fetch(`/api/profileVisibility?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        // 将设置转换为更易于使用的格式
        const settings = {};
        data.settings.forEach(setting => {
          settings[setting.field_name] = {
            visibleToAdminOnly: setting.visible_to_admin_only === 1,
            visibleToFollowersOnly: setting.visible_to_followers_only === 1,
            visibleToAll: setting.visible_to_all === 1
          };
        });
        setVisibilitySettings(settings);
      } else {
        console.error('获取可见性设置失败:', data.message);
      }
    } catch (error) {
      console.error('获取可见性设置失败:', error);
    }
  };

  // 处理关注/取消关注
  const handleFollow = async () => {
    if (!currentUser || !userProfile) return;
    setActionLoading(true);
    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.user_id, // 当前用户是操作者
          targetUserId: userProfile.user_id, // 目标用户
          action: action
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(!isFollowing);
        // 更新粉丝数/关注数显示
        if (userProfile.user_id === currentUser.user_id) { // 如果是自己的主页，更新关注数
             setUserProfile(prev => ({ ...prev, following_count: data.newCount }));
        } else { // 如果是别人的主页，更新对方的粉丝数
            setUserProfile(prev => ({ ...prev, follower_count: data.newCount }));
        }

        showToast(action === 'follow' ? '关注成功' : '取消关注成功');
      } else {
        showToast(data.message || '操作失败');
      }
    } catch (error) {
      console.error('关注/取消关注操作失败:', error);
      showToast('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理拉黑/取消拉黑
  const handleBlock = async () => {
    if (!currentUser || !userProfile) return;
     setActionLoading(true);
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const res = await fetch('/api/user/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.user_id, // 当前用户是操作者
          targetUserId: userProfile.user_id, // 目标用户
          action: action
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsBlocked(!isBlocked);
        // 拉黑成功后，如果之前是关注状态，前端同步更新为非关注状态
        if (action === 'block' && isFollowing) {
             setIsFollowing(false);
             // 并且更新自己的关注数（如果需要）
             if (userProfile.user_id === currentUser.user_id) { // 如果是自己的主页，更新关注数
                 setUserProfile(prev => ({ ...prev, following_count: Math.max(0, (prev.following_count || 0) - 1) }));
             }
        }
        showToast(action === 'block' ? '拉黑成功' : '取消拉黑成功');
      } else {
        showToast(data.message || '操作失败');
      }
    } catch (error) {
      console.error('拉黑/取消拉黑操作失败:', error);
      showToast('操作失败，请稍后重试');
    } finally {
       setActionLoading(false);
    }
  };

  // 打开可见性设置模态框
  const openVisibilityModal = (fieldName) => {
    setEditingField(fieldName);
    setShowVisibilityModal(true);
  };

  // 更新可见性设置
  const updateVisibilitySetting = async (setting) => {
    if (!currentUser || !editingField) return;

    try {
      const res = await fetch('/api/profileVisibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.user_id,
          fieldName: editingField,
          ...setting
        })
      });

      const data = await res.json();
      if (data.success) {
        // 更新本地状态
        setVisibilitySettings(prev => ({
          ...prev,
          [editingField]: setting
        }));
        showToast('设置更新成功！');
        setShowVisibilityModal(false);
      } else {
        showToast(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新可见性设置失败:', error);
      showToast('操作失败，请稍后重试');
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

  // 判断字段是否应该显示
  const shouldShowField = (fieldName) => {
    // 如果是自己的资料，显示所有字段
    if (currentUser && currentUser.user_id === parseInt(id)) {
      return true;
    }

    // 如果没有设置，默认显示
    if (!visibilitySettings[fieldName]) {
      return true;
    }

    const setting = visibilitySettings[fieldName];

    // 如果设置为对所有人可见
    if (setting.visibleToAll) {
      return true;
    }

    // 如果设置为仅对管理员可见，且当前用户是管理员
    if (setting.visibleToAdminOnly && currentUser && currentUser.is_admin) {
      return true;
    }

    // 如果设置为仅对关注者可见，且当前用户已关注
    // 注意：这里的 isFollowing 状态反映的是viewerId对userProfile.user_id的关注状态
    if (setting.visibleToFollowersOnly && isFollowing) {
      return true;
    }

    return false;
  };

  // 处理删除帖子
  const handleDeletePost = async (postId) => {
    if (!currentUser) {
      showToast('请先登录');
      return;
    }

    if (!confirm('确定要删除该帖子吗？此操作不可撤销，将同时删除该帖子的所有评论。')) {
      return;
    }

    try {
      // 调用用户删除帖子的API
      const res = await fetch('/api/user/deletePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId,
          userId: currentUser.user_id // 使用 currentUser.user_id 作为当前操作用户ID
        })
      });

      const data = await res.json();
      if (data.success) {
        // 从用户资料中的帖子列表中移除被删除的帖子
        // setRecentPosts(prev => prev.filter(post => post.post_id !== postId)); // 这个state可能不再需要，如果直接从userProfile取的话
         setUserProfile(prev => ({ // 直接更新userProfile的状态
          ...prev,
          recent_posts: prev.recent_posts.filter(post => post.post_id !== postId),
          post_count: Math.max(0, (prev.post_count || 0) - 1) // 同时减少发帖数
        }));
        showToast('帖子删除成功');
      } else {
        showToast(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      showToast('删除失败，请稍后重试');
    }
  };

  // 检查是否是当前登录用户自己的主页
  const isOwnProfile = currentUser && userProfile && currentUser.user_id === userProfile.user_id;

  // 获取当前登录用户的ID (用于判断是否显示关注/拉黑按钮)
  useEffect(() => {
    const fetchViewer = async () => {
      try {
        const res = await fetch('/api/auth/checkLogin');
        const data = await res.json();
        if (data.isLoggedIn && data.userId) {
          setViewerId(data.userId);
        } else {
          setViewerId(null);
        }
      } catch (error) {
        console.error('获取查看者信息失败:', error);
        setViewerId(null);
      }
    };

    fetchViewer();
  }, []); // 只在组件加载时运行

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  if (loading) {
    return (
      <Layout>
        <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> {/* 应用容器和变量类 */}
          <div className={userModeStyles.loading}>加载中...</div> {/* 应用加载样式 */}
        </div>
      </Layout>
    );
  }

  if (!userProfile) {
    return (
       <Layout>
        <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> {/* 应用容器和变量类 */}
          <div className={userModeStyles.emptyState}> {/* 应用空状态样式 */}
            <p>无法加载用户资料或用户不存在。</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{userProfile.username} 的个人主页</title>
      </Head>

      {/* 应用 userModeStyles.container 和 .variableContainer 作为主容器 */}
      <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> 

        {/* 主要内容区域 */}
        <main className={userModeStyles.mainContent}> {/* 应用 userModeStyles.mainContent */} 

          {/* 个人主页主要内容布局容器 */} 
          <div className={userModeStyles.profileContent}> {/* 应用 userModeStyles.profileContent */}

            {/* 用户信息、统计和操作区（左侧或顶部堆叠）*/} 
            <div className={userModeStyles.profileSection}> {/* 应用 userModeStyles.profileSection */}

              {/* 用户基础信息 */} 
              {shouldShowField('profileBase') && (
                 <div className={userModeStyles.profileBase}> {/* 应用 userModeStyles.profileBase */}
                   <div className={userModeStyles.profileAvatar}> {/* 应用 userModeStyles.profileAvatar */}
                     {userProfile.username?.charAt(0)}
                   </div>
                   <div className={userModeStyles.profileInfo}> {/* 应用 userModeStyles.profileInfo */}
                     <h1 className={userModeStyles.userName}> {/* 应用 userModeStyles.userName */}
                       {userProfile.username}
                     </h1>
                     {/* 其他基础信息 */} 
                     {shouldShowField('level') && (
                        <div className={userModeStyles.infoBlock}> {/* 应用 userModeStyles.infoBlock */}
                         等级：{userProfile.level_name}（{userProfile.level}）
                       </div>
                     )}
                      {shouldShowField('experience') && (
                       <div className={userModeStyles.infoBlock}> {/* 应用 userModeStyles.infoBlock */}
                         经验值：{userProfile.experience}
                       </div>
                      )}
                     {shouldShowField('major') && (
                        <div className={userModeStyles.infoBlock}> {/* 应用 userModeStyles.infoBlock */}
                         专业：{userProfile.major || '未填写'}
                       </div>
                     )}
                      {shouldShowField('studentId') && (
                        <div className={userModeStyles.infoBlock}> {/* 应用 userModeStyles.infoBlock */}
                          学号: {userProfile.student_id}
                       </div>
                      )}
                       {shouldShowField('registrationDate') && (
                        <div className={userModeStyles.infoBlock}> {/* 应用 userModeStyles.infoBlock */}
                          注册时间: {formatDate(userProfile.registration_date)}
                       </div>
                      )}

                   </div>
                 </div>
              )}

              {/* 用户统计信息 */} 
              {shouldShowField('stats') && (
                 <div className={userModeStyles.profileStats}> {/* 应用 userModeStyles.profileStats */}
                   <div className={userModeStyles.statBlock}> {/* 应用 userModeStyles.statBlock */}
                     发帖数：{userProfile.post_count}
                   </div>
                   <div className={userModeStyles.statBlock}> {/* 应用 userModeStyles.statBlock */}
                     评论数：{userProfile.comment_count}
                   </div>
                   <div className={userModeStyles.statBlock}> {/* 应用 userModeStyles.statBlock */}
                     获赞数：{userProfile.like_count}
                   </div>
                   <div className={userModeStyles.statBlock}> {/* 应用 userModeStyles.statBlock */}
                     关注：{userProfile.following_count}
                   </div>
                   <div className={userModeStyles.statBlock}> {/* 应用 userModeStyles.statBlock */}
                     粉丝：{userProfile.follower_count}
                   </div>
                 </div>
              )}

              {/* 关注和拉黑按钮 */} 
              {viewerId && viewerId !== userProfile.user_id && (
                <div className={userModeStyles.profileActions}> {/* 应用 userModeStyles.profileActions */}
                  <button onClick={handleFollow} disabled={actionLoading || !currentUser} className={`${userModeStyles.followButton} ${isFollowing ? userModeStyles.following : ''}`}> {/* 应用关注按钮样式 */}
                    {actionLoading ? '处理中...' : (isFollowing ? '已关注' : '关注')}
                  </button>
                  <button onClick={handleBlock} disabled={actionLoading || !currentUser} className={`${userModeStyles.blockButton} ${isBlocked ? userModeStyles.blocked : ''}`}> {/* 应用拉黑按钮样式 */}
                    {actionLoading ? '处理中...' : (isBlocked ? '已拉黑' : '拉黑')}
                  </button>
                </div>
              )}

               {/* 可见性设置按钮 (仅在自己的主页显示) */} 
              {isOwnProfile && (
                  <div className={userModeStyles.profileActions}> {/* 可以重用profileActions样式或定义新的 */} 
                      <button onClick={() => router.push('/user/settings')} className={userModeStyles.submitButton}> {/* 使用一个通用按钮样式或定义新的 */} 
                          可见性设置
                      </button>
                  </div>
              )}

            </div>

            {/* 最近发帖区（右侧或底部堆叠） */} 
            <div className={userModeStyles.profileRecentPosts}> {/* 应用 userModeStyles.profileRecentPosts */}
              <h2 className={userModeStyles.profileRecentPostsTitle}>最近发布的帖子</h2> {/* 应用 userModeStyles.profileRecentPostsTitle */}
              {recentPosts && recentPosts.length > 0 ? (
                <div className={userModeStyles.postList}> {/* 应用 userModeStyles.postList */} 
                  {recentPosts.map(post => (
                     <div key={post.post_id} className={userModeStyles.postCard}> {/* 应用 userModeStyles.postCard */}
                        <div className={userModeStyles.postHeader}> {/* 应用 userModeStyles.postHeader */}
                          <h3 className={userModeStyles.postCardTitle}> {/* 应用 userModeStyles.postCardTitle */}
                             <Link href={{ pathname: '/posts/[id]', query: { id: post.post_id } }}>
                               {post.title}
                             </Link>
                          </h3>
                          <div className={userModeStyles.postMeta}> {/* 应用 userModeStyles.postMeta */}
                            <span>频道: {post.section_name || '未分类'}</span>
                            <span>发布于: {formatDate(post.post_time)}</span>
                            <span>评论: {post.comment_count || 0}</span>
                            <span>点赞: {post.like_count || 0}</span>
                             {/* 删除按钮 */} 
                             {isOwnProfile && ( // 仅在查看自己的主页时显示删除按钮
                                <button
                                  onClick={(e) => {
                                    e.preventDefault(); // 阻止Link的默认跳转
                                    handleDeletePost(post.post_id);
                                  }}
                                  className={userModeStyles.deleteButton} /* 应用 userModeStyles.deleteButton */
                                  title="删除帖子"
                                >
                                  删除
                                </button>
                              )}
                          </div>
                        </div>
                         <div className={userModeStyles.postContent}> {/* 应用 userModeStyles.postContent */}
                           {post.content && post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                         </div>
                     </div>
                  ))}
                </div>
              ) : ( 
                 <div className={userModeStyles.emptyState}> {/* 应用 userModeStyles.emptyState */}
                  <p>暂无发布的帖子。</p>
                 </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* 提示信息 */} 
      {toast.show && (
        <div className={userModeStyles.toast}> {/* 应用 userModeStyles.toast */}
          {toast.message}
        </div>
      )}
       {/* 可见性设置模态框 (您可以根据需要创建并在这里引入) */}
       {/*
       {showVisibilityModal && (
           <VisibilitySettingsModal
               isOpen={showVisibilityModal}
               onClose={() => setShowVisibilityModal(false)}
               settings={visibilitySettings}
               onSave={updateVisibilitySetting}
               editingField={editingField}
           />
       )}
        */}
    </Layout>
  );
}
