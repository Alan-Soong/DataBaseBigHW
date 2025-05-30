import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import settingsStyles from '../../styles/settings.module.css'; // We will create this CSS module

export default function UserSettings() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [visibilitySettings, setVisibilitySettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  // 可见性字段定义，根据需要添加更多字段
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

  // 获取当前登录用户
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/checkLogin');
        const data = await res.json();

        if (data.isLoggedIn && data.userId) {
          setCurrentUser({ user_id: data.userId }); // 只需user_id来获取设置
          fetchVisibilitySettings(data.userId);
        } else {
          // 未登录，跳转到登录页
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  // 获取可见性设置
  const fetchVisibilitySettings = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profileVisibility?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        // 将设置转换为更易于使用的格式
        const settings = {};
        // 初始化所有字段的设置，如果后端没有返回某个字段的设置，则默认为对所有人可见
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
        showToast('获取设置失败: ' + data.message);
        // 如果获取失败，也要初始化默认设置
         const defaultSettings = {};
          visibilityFields.forEach(field => {
              defaultSettings[field.name] = {
                   visibleToAdminOnly: false,
                   visibleToFollowersOnly: false,
                   visibleToAll: true
              };
          });
         setVisibilitySettings(defaultSettings);
      }
    } catch (error) {
      console.error('获取可见性设置失败:', error);
       showToast('获取设置失败，请稍后重试');
       // 如果获取失败，也要初始化默认设置
       const defaultSettings = {};
        visibilityFields.forEach(field => {
            defaultSettings[field.name] = {
                 visibleToAdminOnly: false,
                 visibleToFollowersOnly: false,
                 visibleToAll: true
            };
        });
       setVisibilitySettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  // 处理设置更改
  const handleSettingChange = (fieldName, option) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [fieldName]: {
        visibleToAdminOnly: option === 'admin',
        visibleToFollowersOnly: option === 'followers',
        visibleToAll: option === 'all',
      },
    }));
  };

  // 保存设置
  const handleSaveSettings = async () => {
    if (!currentUser) return;
    setSaving(true);
    let success = true; // Track if all saves were successful

    // Iterate through each setting and send a separate POST request
    for (const fieldName of Object.keys(visibilitySettings)) {
      const setting = visibilitySettings[fieldName];
      const settingToSave = {
        userId: currentUser.user_id,
        fieldName: fieldName,
        visibleToAdminOnly: setting.visibleToAdminOnly ? 1 : 0,
        visibleToFollowersOnly: setting.visibleToFollowersOnly ? 1 : 0,
        visibleToAll: setting.visibleToAll ? 1 : 0,
      };

      console.log('Sending setting for:', fieldName, settingToSave); // 添加日志

      try {
        const res = await fetch('/api/profileVisibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingToSave), // Send one setting at a time
        });

        const data = await res.json();
        if (!data.success) {
          console.error(`Failed to save setting for ${fieldName}:`, data.message);
          // 使用 fieldName 查找对应的 label 来显示更友好的错误信息
          const field = visibilityFields.find(f => f.name === fieldName);
          showToast(`保存 ${field ? field.label : fieldName} 失败: ${data.message}`); // Show toast for specific failure
          success = false; // Mark as failed
          // Optionally break if any save fails
          // break;
        }
      } catch (error) {
        console.error(`Error saving setting for ${fieldName}:`, error);
         // 使用 fieldName 查找对应的 label 来显示更友好的错误信息
        const field = visibilityFields.find(f => f.name === fieldName);
        showToast(`保存 ${field ? field.label : fieldName} 失败，请稍后重试`); // Show toast for specific error
        success = false; // Mark as failed
        // Optionally break if any error occurs
        // break;
      }
    }

    if (success) {
      showToast('所有设置保存成功！');
    }

    setSaving(false);
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  if (loading) {
    return (
      <Layout>
        <div className={utilStyles.container}>
          <p>加载中...</p>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
      return (
          <Layout>
              <div className={utilStyles.container}>
                  <p>请登录后查看设置。</p>
              </div>
          </Layout>
      );
  }

  return (
    <Layout>
      <Head><title>个人主页可见性设置</title></Head>
      <div className={settingsStyles.container}> {/* Use settingsStyles for container */}
        <h1>个人主页可见性设置</h1>

        <div className={settingsStyles.settingsList}> {/* Container for settings items */}
          {visibilityFields.map(field => (
            <div key={field.name} className={settingsStyles.settingItem}> {/* Individual setting item */}
              <label className={settingsStyles.settingLabel}>{field.label}:</label>
              <div className={settingsStyles.settingOptions}> {/* Options container */}
                <label>
                  <input
                    type="radio"
                    value="all"
                    checked={visibilitySettings[field.name]?.visibleToAll}
                    onChange={() => handleSettingChange(field.name, 'all')}
                    disabled={saving}
                  />
                  对所有人可见
                </label>
                {/* 拉黑列表通常不对关注者可见，可以根据业务逻辑决定是否显示此选项 */}
                {field.name !== 'blocked_list' && (
                   <label>
                     <input
                       type="radio"
                       value="followers"
                       checked={visibilitySettings[field.name]?.visibleToFollowersOnly}
                       onChange={() => handleSettingChange(field.name, 'followers')}
                       disabled={saving}
                     />
                     仅对关注者可见
                   </label>
                )}
                {/* 管理员选项，如果需要的话 */}
                 <label>
                   <input
                     type="radio"
                     value="admin"
                     checked={visibilitySettings[field.name]?.visibleToAdminOnly}
                     onChange={() => handleSettingChange(field.name, 'admin')}
                     disabled={saving}
                   />
                   仅对管理员可见
                 </label>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSaveSettings} disabled={loading || saving} className={settingsStyles.saveButton}> {/* Save button */}
          {saving ? '保存中...' : '保存设置'}
        </button>

        {/* Toast Notification */}
        {toast.show && (
            <div className={settingsStyles.toast}> { /* Use settingsStyles for toast */}
                {toast.message}
            </div>
        )}

      </div>
    </Layout>
  );
} 