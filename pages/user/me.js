import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
import Link from 'next/link';
import Head from 'next/head';
import ListModal from '../../components/ListModal';
import VisibilitySettingsModal from '../../components/VisibilitySettingsModal';

export default function MyProfile() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [visibilitySettings, setVisibilitySettings] = useState({});
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
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
             await fetchVisibilitySettings(data.userId);
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

  const fetchVisibilitySettings = async (userId) => {
    try {
      const res = await fetch(`/api/profileVisibility?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        const settings = {};
        visibilityFields.forEach(field => {
            const userSetting = data.settings.find(s => s.field_name === field.name);
            settings[field.name] = userSetting ? {
                visibleToAdminOnly: userSetting.visible_to_admin_only === 1,
                visibleToFollowersOnly: userSetting.visible_to_followers_only === 1,
                visibleToAll: userSetting.visible_to_all === 1
            } : {
                 visibleToAdminOnly: false,
                 visibleToFollowersOnly: false,
                 visibleToAll: true
            };
        });
        setVisibilitySettings(settings);
      } else {
        console.error('获取可见性设置失败:', data.message);
        showToast('获取可见性设置失败: ' + data.message);
      }
    } catch (error) {
      console.error('获取可见性设置失败:', error);
      showToast('获取可见性设置失败，请稍后重试');
    }
  };

   const handleSaveVisibilitySettings = async (settingsToSave) => {
    if (!currentUser) return false;

    let success = true;

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
          const field = visibilityFields.find(f => f.name === fieldName);
          showToast(`保存 ${field ? field.label : fieldName} 失败: ${data.message}`);
          success = false;
        }
      } catch (error) {
        console.error(`Error saving setting for ${fieldName}:`, error);
        const field = visibilityFields.find(f => f.name === fieldName);
        showToast(`保存 ${field ? field.label : fieldName} 失败，请稍后重试`);
        success = false;
      }
    }

    if (success) {
      showToast('设置保存成功！');
      fetchVisibilitySettings(currentUser.user_id);
      return true;
    } else {
        return false;
    }
  };

  const shouldShowField = (fieldName) => {
    return true; 
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

        <main className={userModeStyles.mainContent}> 

          <div className={userModeStyles.profileContent}> 

            <div className={userModeStyles.profileSection}> 

              <div className={userModeStyles.profileBase}> 
                <div className={userModeStyles.profileAvatar}> 
                  {userProfile.username?.charAt(0)}
                </div>
                <div className={userModeStyles.profileInfo}> 
                  <h1 className={userModeStyles.userName}> 
                    {userProfile.username}
                  </h1>
                   <div className={userModeStyles.infoBlock}> 
                     等级：{userProfile.level_name}（{userProfile.level}）
                   </div>
                    <div className={userModeStyles.infoBlock}> 
                     经验值：{userProfile.experience}
                   </div>
                   <div className={userModeStyles.infoBlock}> 
                     专业：{userProfile.major || '未填写'}
                   </div>
                    <div className={userModeStyles.infoBlock}> 
                     学号: {userProfile.student_id}
                   </div>
                    <div className={userModeStyles.infoBlock}> 
                     注册时间: {formatDate(userProfile.registration_date)}
                   </div>
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
                    <button onClick={() => setShowVisibilityModal(true)} className={userModeStyles.listViewButton}> 
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

       {showVisibilityModal && currentUser && (
           <VisibilitySettingsModal
               isOpen={showVisibilityModal}
               onClose={() => setShowVisibilityModal(false)}
               settings={visibilitySettings}
               onSave={handleSaveVisibilitySettings}
               visibilityFields={visibilityFields}
           />
       )}

    </Layout>
  );
} 