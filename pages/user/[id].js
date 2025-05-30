import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
import Link from 'next/link';
import Head from 'next/head';
import ListModal from '../../components/ListModal';
import VisibilitySettingsModal from '../../components/VisibilitySettingsModal';

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
  const [viewerId, setViewerId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });

  // 列表模态框相关状态
  const [showListModal, setShowListModal] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalData, setListModalData] = useState([]);

  // 可见性字段定义，根据需要添加更多字段 (从 settings.js 迁移过来)
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
    { name: 'blocked_list', label: '拉黑列表' }, // 拉黑列表通常只有自己可见，但仍可提供设置选项
  ];

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
        const viewerIdParam = currentUser ? `&viewerId=${currentUser.user_id}` : '';
        const res = await fetch(`/api/userProfile?userId=${id}${viewerIdParam}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
          console.log('User Profile:', data.user);

          if (data.user) {
             setIsFollowing(data.user.isFollowing || false);
             setIsBlocked(data.user.isBlocked || false);
          }

          // 如果是自己的主页，获取可见性设置
          if (currentUser && currentUser.user_id === parseInt(id)) {
               fetchVisibilitySettings(currentUser.user_id); // Call the function to fetch settings
           }

        } else {
          console.error('获取用户资料失败:', data.message);
          showToast('获取用户资料失败: ' + data.message);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        showToast('获取用户资料失败: ' + error.message);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id, currentUser]);

  // 获取可见性设置 (从 settings.js 迁移过来)
  const fetchVisibilitySettings = async (userId) => {
    try {
      const res = await fetch(`/api/profileVisibility?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        const settings = {};
        // Initialize all fields' settings, default to visible to all if not returned
        visibilityFields.forEach(field => {
            const userSetting = data.settings.find(s => s.field_name === field.name);
            settings[field.name] = userSetting ? {
                visibleToAdminOnly: userSetting.visible_to_admin_only === 1,
                visibleToFollowersOnly: userSetting.visible_to_followers_only === 1,
                visibleToAll: userSetting.visible_to_all === 1
            } : { // Default to visible to all if no setting found
                 visibleToAdminOnly: false,
                 visibleToFollowersOnly: false,
                 visibleToAll: true
            };
        });
        setVisibilitySettings(settings);
      } else {
        console.error('获取可见性设置失败:', data.message);
        // Optionally show toast or set default settings on failure
      }
    } catch (error) {
      console.error('获取可见性设置失败:', error);
      // Optionally show toast or set default settings on failure
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

    // 如果没有获取到可见性设置，或者该字段没有设置，默认显示
    if (!visibilitySettings || !visibilitySettings[fieldName]) {
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
        const res = await fetch('/api/checkLogin');
        const data = await res.json();
        if (data.isLoggedIn && data.userId) {
          setViewerId(data.userId);
           // Also fetch the full user object to get is_admin if needed for visibility
           const profileRes = await fetch(`/api/userProfile?userId=${data.userId}`);
           const profileData = await profileRes.json();
           if (profileData.success) {
               setCurrentUser(profileData.user); // Set the full user object
           }
        } else {
          setViewerId(null);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('获取查看者信息失败:', error);
        setViewerId(null);
        setCurrentUser(null);
      }
    };

    fetchViewer();
  }, []); // Run only on component mount

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  useEffect(() => {
    console.log('userProfile.recent_posts changed:', userProfile?.recent_posts || []);
  }, [userProfile?.recent_posts]);

  // 处理查看关注列表
  const handleViewFollowing = async () => {
    if (!userProfile || !userProfile.user_id) return;
    try {
      const res = await fetch(`/api/user/getFollowing?userId=${userProfile.user_id}`);
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

  // 处理查看粉丝列表
  const handleViewFollowers = async () => {
    if (!userProfile || !userProfile.user_id) return;
    try {
      const res = await fetch(`/api/user/getFollowers?userId=${userProfile.user_id}`);
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

  // 处理查看拉黑列表
  const handleViewBlocks = async () => {
    if (!currentUser || !isOwnProfile) {
      showToast('无权查看拉黑列表');
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

  // 处理用户点击
  const handleUserClick = (user) => {
    router.push(`/user/${user.user_id}`);
    setShowListModal(false);
  };

  // 处理保存可见性设置 (从 settings.js 迁移过来)
  const handleSaveVisibilitySettings = async (settingsToSave) => {
    if (!currentUser) return false; // Return false on failure

    let success = true; // Track if all saves were successful

    for (const fieldName of Object.keys(settingsToSave)) {
      const setting = settingsToSave[fieldName];
      const settingData = {
        userId: currentUser.user_id,
        fieldName: fieldName,
        visibleToAdminOnly: setting.visibleToAdminOnly ? 1 : 0,
        visibleToFollowersOnly: setting.visibleToFollowersOnly ? 1 : 0,
        visibleToAll: setting.visibleToAll ? 1 : 0,
      };

      try {
        const res = await fetch('/api/profileVisibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingData),
        });

        const data = await res.json();
        if (!data.success) {
          console.error(`Failed to save setting for ${fieldName}:`, data.message);
           // Use fieldName to find corresponding label for better error message
          const field = visibilityFields.find(f => f.name === fieldName);
          showToast(`保存 ${field ? field.label : fieldName} 失败: ${data.message}`);
          success = false; // Mark as failed
        }
      } catch (error) {
        console.error(`Error saving setting for ${fieldName}:`, error);
         // Use fieldName to find corresponding label for better error message
        const field = visibilityFields.find(f => f.name === fieldName);
        showToast(`保存 ${field ? field.label : fieldName} 失败，请稍后重试`);
        success = false; // Mark as failed
      }
    }

    if (success) {
      showToast('设置保存成功！');
      // Update local state with newly saved settings if needed, or re-fetch
      // For simplicity, we can just re-fetch settings after successful save
      fetchVisibilitySettings(currentUser.user_id);
      return true; // Indicate success
    } else {
        return false; // Indicate failure
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> {/* Applied container and variable classes */}
          <div className={userModeStyles.loading}>加载中...</div> {/* Applied loading style */}
        </div>
      </Layout>
    );
  }

  if (!userProfile) {
    return (
       <Layout>
        <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> {/* Applied container and variable classes */}
          <div className={userModeStyles.emptyState}> {/* Applied empty state style */}
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

      {/* Applied userModeStyles.container and .variableContainer as main container */}
      <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> 

        {/* Main content area */}
        <main className={userModeStyles.mainContent}> {/* Applied userModeStyles.mainContent */} 

          {/* Profile main content layout container */} 
          <div className={userModeStyles.profileContent}> {/* Applied userModeStyles.profileContent */}

            {/* User info, stats, and actions area (left or stacked on top) */} 
            <div className={userModeStyles.profileSection}> {/* Applied userModeStyles.profileSection */}

              {/* User base info */} 
              {shouldShowField('profileBase') && (
                 <div className={userModeStyles.profileBase}> {/* Applied userModeStyles.profileBase */}
                   <div className={userModeStyles.profileAvatar}> {/* Applied userModeStyles.profileAvatar */}
                     {userProfile.username?.charAt(0)}
                   </div>
                   <div className={userModeStyles.profileInfo}> {/* Applied userModeStyles.profileInfo */}
                     <h1 className={userModeStyles.userName}> {/* Applied userModeStyles.userName */}
                       {userProfile.username}
                     </h1>
                     {/* Other base info */} 
                     {shouldShowField('level') && (
                        <div className={userModeStyles.infoBlock}> {/* Applied userModeStyles.infoBlock */}
                         等级：{userProfile.level_name}（{userProfile.level}）
                       </div>
                     )}
                      {shouldShowField('experience') && (
                       <div className={userModeStyles.infoBlock}> {/* Applied userModeStyles.infoBlock */}
                         经验值：{userProfile.experience}
                       </div>
                      )}
                     {shouldShowField('major') && (
                        <div className={userModeStyles.infoBlock}> {/* Applied userModeStyles.infoBlock */}
                         专业：{userProfile.major || '未填写'}
                       </div>
                     )}
                      {shouldShowField('studentId') && (
                        <div className={userModeStyles.infoBlock}> {/* Applied userModeStyles.infoBlock */}
                          学号: {userProfile.student_id}
                       </div>
                      )}
                       {shouldShowField('registrationDate') && (
                        <div className={userModeStyles.infoBlock}> {/* Applied userModeStyles.infoBlock */}
                          注册时间: {formatDate(userProfile.registration_date)}
                       </div>
                      )}

                   </div>
                 </div>
              )}

              {/* User stats info */} 
              {shouldShowField('stats') && (
                 <div className={userModeStyles.profileStats}> {/* Applied userModeStyles.profileStats */}
                   <div className={userModeStyles.statBlock}> {/* Applied userModeStyles.statBlock */}
                     发帖数：{userProfile.post_count}
                   </div>
                   <div className={userModeStyles.statBlock}> {/* Applied userModeStyles.statBlock */}
                     评论数：{userProfile.comment_count}
                   </div>
                   <div className={userModeStyles.statBlock}> {/* Applied userModeStyles.statBlock */}
                     获赞数：{userProfile.like_count}
                   </div>
                   {/* Display follow and follower counts directly in stats area, not as buttons */} 
                   {shouldShowField('following_count') && (
                      <div className={userModeStyles.statBlock}> {/* Applied userModeStyles.statBlock */}
                        关注：{userProfile.following_count}
                      </div>
                   )}
                   {shouldShowField('follower_count') && (
                      <div className={userModeStyles.statBlock}> {/* Applied userModeStyles.statBlock */}
                        粉丝：{userProfile.follower_count}
                      </div>
                   )}
                 </div>
              )}

              {/* 新增的列表按钮容器 - 移到统计信息下方并应用新样式 */}
              <div className={userModeStyles.profileActions}> {/* Can reuse or add a new style class */}
                 {/* 查看关注列表按钮 */}
                 {/* Apply new listViewButton style */}
                 {shouldShowField('following_list') && (
                    <button className={userModeStyles.listViewButton} onClick={handleViewFollowing}>查看关注 ({userProfile?.following_count || 0})</button>
                 )}
                 {/* 查看粉丝列表按钮 */}
                 {/* Apply new listViewButton style */}
                  {shouldShowField('followers_list') && (
                    <button className={userModeStyles.listViewButton} onClick={handleViewFollowers}>查看粉丝 ({userProfile?.follower_count || 0})</button>
                  )}
                 {/* 查看拉黑列表按钮 (仅对自己可见) */}
                 {isOwnProfile && shouldShowField('blocked_list') && (
                    <button className={userModeStyles.listViewButton} onClick={handleViewBlocks}>查看拉黑列表</button>
                 )}
              </div>

              {/* Follow and Block buttons */} 
              {viewerId && viewerId !== userProfile.user_id && (
                <div className={userModeStyles.profileActions}> {/* Applied userModeStyles.profileActions */}
                  <button onClick={handleFollow} disabled={actionLoading || !currentUser} className={`${userModeStyles.followButton} ${isFollowing ? userModeStyles.following : ''}`}> {/* Apply follow button style */}
                    {actionLoading ? '处理中...' : (isFollowing ? '已关注' : '关注')}
                  </button>
                  <button onClick={handleBlock} disabled={actionLoading || !currentUser} className={`${userModeStyles.blockButton} ${isBlocked ? userModeStyles.blocked : ''}`}> {/* Apply block button style */}
                    {actionLoading ? '处理中...' : (isBlocked ? '已拉黑' : '拉黑')}
                  </button>
                </div>
              )}

               {/* 可见性设置按钮 (仅在自己的主页显示) - Modified to open modal */}
              {isOwnProfile && (
                  <div className={userModeStyles.profileActions}> {/* Can reuse profileActions style or define new */}
                      <button onClick={() => setShowVisibilityModal(true)} className={userModeStyles.listViewButton}> {/* Use listViewButton style */}
                          可见性设置
                      </button>
                  </div>
              )}

            </div>

            {/* Recent posts area (right or stacked at bottom) */} 
            {shouldShowField('recent_posts') && (
              <div className={userModeStyles.profileRecentPosts}> {/* Applied userModeStyles.profileRecentPosts */}
                <h2 className={userModeStyles.profileRecentPostsTitle}>最近发布的帖子</h2> {/* Applied userModeStyles.profileRecentPostsTitle */}
                {userProfile.recent_posts && userProfile.recent_posts.length > 0 ? (
                  <div className={userModeStyles.postList}> {/* Applied userModeStyles.postList */}
                    {userProfile.recent_posts.map(post => (
                       <div key={post.post_id} className={userModeStyles.postCard}> {/* Applied userModeStyles.postCard */}
                          <div className={userModeStyles.postHeader}> {/* Applied userModeStyles.postHeader */}
                            <h3 className={userModeStyles.postCardTitle}> {/* Applied userModeStyles.postCardTitle */}
                               <Link href={{ pathname: '/posts/[id]', query: { id: post.post_id } }}>
                                 {post.title}
                               </Link>
                            </h3>
                            <div className={userModeStyles.postMeta}> {/* Applied userModeStyles.postMeta */}
                              <span>频道: {post.section_name || '未分类'}</span>
                              <span>发布于: {formatDate(post.post_time)}</span>
                              <span>评论: {post.comment_count || 0}</span>
                              <span>点赞: {post.like_count || 0}</span>
                               {/* Delete button */}
                               {isOwnProfile && ( // Only show delete button when viewing own profile
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault(); // Prevent default Link behavior
                                      handleDeletePost(post.post_id);
                                    }}
                                    className={userModeStyles.deleteButton} /* Applied userModeStyles.deleteButton */
                                    title="删除帖子"
                                  >
                                    删除
                                  </button>
                                )}
                            </div>
                          </div>
                           <div className={userModeStyles.postContent}> {/* Applied userModeStyles.postContent */}
                             {post.content && post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                           </div>
                       </div>
                    ))}
                  </div>
                ) : ( /* Else part for recent_posts list */
                   <div className={userModeStyles.emptyState}> {/* Applied userModeStyles.emptyState */} 
                    <p>暂无发布的帖子。</p>
                   </div>
                )} {/* Closing ternary for recent_posts list */}
              </div>
            )} {/* Closing conditional rendering for recent_posts area */}

          </div> {/* Closing div for profileContent */}
        </main> {/* Closing main tag */}
      </div> {/* Closing div for container */}

      {/* Toast Notification */}
      {toast.show && (
        <div className={userModeStyles.toast}> {/* Applied userModeStyles.toast */}
          {toast.message}
        </div>
      )}

       {/* List modal for followers, following, blocked */}
       {showListModal && (
           <ListModal
               isOpen={showListModal}
               onClose={() => setShowListModal(false)}
               title={listModalTitle}
               data={listModalData}
               onUserClick={handleUserClick}
           />
       )}

       {/* Visibility Settings Modal */}
       {showVisibilityModal && currentUser && userProfile && isOwnProfile && (
           <VisibilitySettingsModal
               isOpen={showVisibilityModal}
               onClose={() => setShowVisibilityModal(false)}
               settings={visibilitySettings}
               onSave={handleSaveVisibilitySettings}
               visibilityFields={visibilityFields}
           />
       )}

    </Layout> // Closing Layout tag
  );
}
