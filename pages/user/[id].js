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
  const [visibilitySettings, setVisibilitySettings] = useState({});
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [editingField, setEditingField] = useState(null);

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
          
          // 如果查看的是自己的资料，获取可见性设置
          if (data.user.user_id === parseInt(id)) {
            fetchVisibilitySettings(data.user.user_id);
          }
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
      }
    } catch (error) {
      console.error('获取可见性设置失败:', error);
    }
  };

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
        // 更新用户资料以反映关注状态变化
        fetchUserProfile();
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
        setShowVisibilityModal(false);
      } else {
        alert(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新可见性设置失败:', error);
      alert('操作失败，请稍后重试');
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
    if (setting.visibleToFollowersOnly && isFollowing) {
      return true;
    }
    
    return false;
  };

  return (
    <Layout>
      <Head><title>个人主页 - {userProfile?.username}</title></Head>
      <div className={utilStyles.profileContainer}>
        {/* 1. 基础信息区 */}
        <div className={utilStyles.profileBase}>
          <div className={utilStyles.profileAvatar}>
            {userProfile?.username?.charAt(0)}
          </div>
          <div className={utilStyles.profileInfo}>
            <div className={utilStyles.infoBlock}>
              <h1>{userProfile?.username}</h1>
            </div>
            <div className={utilStyles.infoBlock}>等级：{userProfile?.level_name}（{userProfile?.level}）</div>
            <div className={utilStyles.infoBlock}>经验值：{userProfile?.experience}</div>
            <div className={utilStyles.infoBlock}>专业：{userProfile?.major || '未填写'}</div>
          </div>
        </div>

        {/* 2. 统计信息区 */}
        <div className={utilStyles.profileStats}>
          <div className={utilStyles.statBlock}>发帖数：{userProfile?.post_count}</div>
          <div className={utilStyles.statBlock}>评论数：{userProfile?.comment_count}</div>
          <div className={utilStyles.statBlock}>获赞数：{userProfile?.like_count}</div>
          <div className={utilStyles.statBlock}>关注：{userProfile?.following_count}</div>
          <div className={utilStyles.statBlock}>粉丝：{userProfile?.follower_count}</div>
        </div>

        {/* 3. 操作区 */}
        <div className={utilStyles.profileActions}>
          {currentUser && currentUser.user_id !== parseInt(id) && (
            <>
              <button onClick={handleFollowAction} disabled={actionLoading}>
                {isFollowing ? '取消关注' : '关注'}
              </button>
              <button onClick={handleBlockAction} disabled={actionLoading}>
                {isBlocked ? '取消拉黑' : '拉黑'}
              </button>
            </>
          )}
        </div>

        {/* 4. 最近发帖区 */}
        <div className={utilStyles.profileRecentPosts}>
          <h2>最近发布的帖子</h2>
          {userProfile?.recent_posts?.length > 0 ? (
            userProfile.recent_posts.map(post => (
              <div key={post.post_id} className={utilStyles.recentPostItem}>
                <Link href={`/posts/${post.post_id}`}>{post.title}</Link>
                <span>{formatDate(post.post_time)}</span>
                <span>评论：{post.comment_count}</span>
                <span>点赞：{post.like_count}</span>
              </div>
            ))
          ) : (
            <div>暂无发帖</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
