import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import { useRouter } from 'next/router';
import Link from 'next/link';
import userModeStyles from '../../styles/user_mode.module.css';

export default function AdminMode() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [actionLoading, setActionLoading] = useState(false);
  const [hiddenUserColumns, setHiddenUserColumns] = useState({});

  // 获取当前登录用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { username } = router.query;
        if (!username || typeof username !== 'string') { // 加强参数验证
          router.push('/');
          return;
        }

        const res = await fetch(`/api/auth/session?username=${encodeURIComponent(username)}`,{credentials: 'include'});
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/'); // 跳转回首页
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          
          // 检查是否为管理员
          const adminRes = await fetch(`/api/checkAdmin?userId=${data.user.user_id}`);
          const adminData = await adminRes.json();
          
          if (!adminData.isAdmin) {
            alert('您没有管理员权限');
            router.push({
              pathname: '/posts/user_mode',
              query: { username }
            });
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady && router.query.username) {
      fetchCurrentUser();
    }
  }, [router.isReady, router.query]);

  // 获取所有用户
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/admin/users?userId=${currentUser.user_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);

          // 检查哪些列所有用户都为空
          const usersData = data.users;
          const newHiddenColumns = {};

          // 检查注册时间 (create_at)
          const allUsersHaveEmptyCreateAt = usersData.length > 0 && usersData.every(user => !user.create_at);
          if (allUsersHaveEmptyCreateAt) {
            newHiddenColumns['create_at'] = true;
          }

          // 您可以在这里添加其他需要检查的字段，例如：专业 (major), 学号 (student_id) 等
          // const allUsersHaveEmptyMajor = usersData.length > 0 && usersData.every(user => !user.major);
          // if (allUsersHaveEmptyMajor) {
          //   newHiddenColumns['major'] = true;
          // }
          // const allUsersHaveEmptyStudentId = usersData.length > 0 && usersData.every(user => !user.student_id);
          // if (allUsersHaveEmptyStudentId) {
          //   newHiddenColumns['student_id'] = true;
          // }

          setHiddenUserColumns(newHiddenColumns);

        } else {
          console.error('获取失败:', data.message);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };

    if (!loading && currentUser) {
      fetchUsers();
    }
  }, [loading, currentUser]);

  // 获取所有帖子
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/admin/posts');
        const data = await res.json();
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('获取帖子列表失败:', error);
      }
    };

    if (!loading && currentUser && activeTab === 'posts') {
      fetchPosts();
    }
  }, [loading, currentUser, activeTab]);

  // 获取所有评论
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch('/api/admin/comments');
        const data = await res.json();
        if (data.success) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error('获取评论列表失败:', error);
      }
    };

    if (!loading && currentUser && activeTab === 'comments') {
      fetchComments();
    }
  }, [loading, currentUser, activeTab]);

  // 新增：获取所有频道
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        const data = await res.json();
        if (data.success) {
          setSections(data.sections);
        } else {
          console.error('获取频道列表失败:', data.message);
        }
      } catch (error) {
        console.error('获取频道列表失败:', error);
      }
    };

    if (!loading && currentUser && activeTab === 'sections') {
      fetchSections();
    }
  }, [loading, currentUser, activeTab]);

  // 处理删除用户
  const handleDeleteUser = async (userId) => {
    if (!confirm('确定要删除该用户吗？此操作不可撤销，将同时删除该用户的所有帖子和评论。')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(user => user.user_id !== userId));
        alert('用户删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理删除帖子
  const handleDeletePost = async (postId) => {
    if (!confirm('确定要删除该帖子吗？此操作不可撤销，将同时删除该帖子的所有评论。')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/deletePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter(post => post.post_id !== postId));
        alert('帖子删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理删除评论
  const handleDeleteComment = async (commentId) => {
    if (!confirm('确定要删除该评论吗？此操作不可撤销。')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/deleteComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });
      
      const data = await res.json();
      if (data.success) {
        setComments(comments.filter(comment => comment.comment_id !== commentId));
        alert('评论删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理设置管理员权限
  const handleSetAdmin = async (userId, isAdmin) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/setAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin })
      });
      
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(user => 
          user.user_id === userId ? { ...user, is_admin: isAdmin } : user
        ));
        alert(`用户${isAdmin ? '设为管理员' : '取消管理员权限'}成功`);
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('设置管理员权限失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 新增：处理删除频道
  const handleDeleteSection = async (sectionId) => {
    if (!confirm('确定要删除该频道吗？此操作不可撤销，将同时删除该频道下的所有帖子、评论和点赞。')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/deleteSection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId })
      });
      
      const data = await res.json();
      if (data.success) {
        setSections(sections.filter(section => section.section_id !== sectionId));
        alert('频道删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除频道失败:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 新增：处理添加频道
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      alert('频道名称不能为空');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/addSection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sectionName: newSectionName,
          description: newSectionDescription
        })
      });
      
      const data = await res.json();
      if (data.success) {
        // 重新获取频道列表以更新界面
        const fetchRes = await fetch('/api/sections');
        const fetchData = await fetchRes.json();
        if(fetchData.success) {
          setSections(fetchData.sections);
        }
        setNewSectionName(''); // 清空输入框
        setNewSectionDescription(''); // 清空描述输入框
        alert('频道添加成功');
      } else {
        alert(data.message || '添加失败');
      }
    } catch (error) {
      console.error('添加频道失败:', error);
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

  if (loading) {
    return <Layout><div className={userModeStyles.container}>加载中...</div></Layout>;
  }

  // 如果不是管理员或者没有 currentUser，显示没有权限
  if (!currentUser) {
    return <Layout><div className={userModeStyles.container}>没有访问权限</div></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>管理员模式</title>
      </Head>
      <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}>
        <div className={userModeStyles.mainContent}>
          <div className={userModeStyles.postCard}>
            <h1 className={userModeStyles.postCardTitle}>管理员控制台</h1>
            <div className={userModeStyles.postActions}>
              <button 
                className={`${userModeStyles.button} ${activeTab === 'users' ? userModeStyles.active : ''}`}
                onClick={() => setActiveTab('users')}
              >
                用户管理
              </button>
              <button 
                className={`${userModeStyles.button} ${activeTab === 'posts' ? userModeStyles.active : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                帖子管理
              </button>
              <button 
                className={`${userModeStyles.button} ${activeTab === 'comments' ? userModeStyles.active : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                评论管理
              </button>
              <button 
                className={`${userModeStyles.button} ${activeTab === 'sections' ? userModeStyles.active : ''}`}
                onClick={() => setActiveTab('sections')}
              >
                频道管理
              </button>
            </div>
        </div>
          
              {activeTab === 'users' && (
            <div className={userModeStyles.postCard}>
              <h2 className={userModeStyles.postCardTitle}>用户列表</h2>
              {actionLoading && <p>操作进行中...</p>}
              <table className={utilStyles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>用户名</th>
                    {!hiddenUserColumns['create_at'] && <th>注册时间</th>}
                    <th>是否管理员</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                      <td colSpan={5 - Object.keys(hiddenUserColumns).length} style={{ textAlign: 'center' }}>暂无用户数据</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.user_id}>
                              <td>{user.user_id}</td>
                        <td><Link href={`/user/${user.user_id}`} className={userModeStyles.userLink}>{user.username}</Link></td>
                        {!hiddenUserColumns['create_at'] && <td>{formatDate(user.create_at)}</td>}
                              <td>{user.is_admin ? '是' : '否'}</td>
                        <td>
                                <button 
                                  onClick={() => handleSetAdmin(user.user_id, !user.is_admin)}
                                  disabled={actionLoading}
                            className={`${userModeStyles.button} ${userModeStyles.smallButton} ${userModeStyles.secondaryButton}`}
                            style={{ marginRight: '5px' }} 
                                >
                                  {user.is_admin ? '取消管理员' : '设为管理员'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  disabled={actionLoading}
                            className={`${userModeStyles.button} ${userModeStyles.dangerButton} ${userModeStyles.smallButton}`} 
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>
              )}
              
              {activeTab === 'posts' && (
            <div className={userModeStyles.postCard}>
              <h2 className={userModeStyles.postCardTitle}>帖子列表</h2>
              {actionLoading && <p>操作进行中...</p>}
              <table className={utilStyles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>标题</th>
                          <th>作者</th>
                          <th>发布时间</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.length === 0 ? (
                          <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>暂无帖子数据</td>
                          </tr>
                        ) : (
                          posts.map(post => (
                            <tr key={post.post_id}>
                              <td>{post.post_id}</td>
                        <td><Link href={`/posts/${post.post_id}`} className={userModeStyles.userLink}>{post.title}</Link></td>
                              <td>{post.username}</td>
                              <td>{formatDate(post.post_time)}</td>
                        <td>
                                <button 
                                  onClick={() => handleDeletePost(post.post_id)}
                                  disabled={actionLoading}
                            className={`${userModeStyles.button} ${userModeStyles.dangerButton} ${userModeStyles.smallButton}`} 
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>
              )}
              
              {activeTab === 'comments' && (
            <div className={userModeStyles.postCard}>
              <h2 className={userModeStyles.postCardTitle}>评论列表</h2>
              {actionLoading && <p>操作进行中...</p>}
              <table className={utilStyles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>内容</th>
                          <th>作者</th>
                          <th>帖子ID</th>
                          <th>发布时间</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comments.length === 0 ? (
                          <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>暂无评论数据</td>
                          </tr>
                        ) : (
                          comments.map(comment => (
                            <tr key={comment.comment_id}>
                              <td>{comment.comment_id}</td>
                        <td>{comment.content}</td>
                              <td>{comment.username}</td>
                        <td><Link href={`/posts/${comment.post_id}`} className={userModeStyles.userLink}>{comment.post_id}</Link></td>
                              <td>{formatDate(comment.create_at)}</td>
                        <td>
                                <button 
                                  onClick={() => handleDeleteComment(comment.comment_id)}
                                  disabled={actionLoading}
                            className={`${userModeStyles.button} ${userModeStyles.dangerButton} ${userModeStyles.smallButton}`} 
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>
              )}
              
              {activeTab === 'sections' && (
            <div className={userModeStyles.postCard}>
              <h2 className={userModeStyles.postCardTitle}>频道管理</h2>
              {actionLoading && <p>操作进行中...</p>}
              <div className={userModeStyles.adminSection}>
                <h2>添加新频道</h2>
                <form onSubmit={handleAddSection} className={userModeStyles.form}>
                  <div className={userModeStyles.formGroup}>
                    <label htmlFor="newSectionName">频道名称:</label>
                    <input
                      type="text"
                      id="newSectionName"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className={userModeStyles.formInput}
                    />
                  </div>
                  <div className={userModeStyles.formGroup}>
                    <label htmlFor="newSectionDescription">频道描述:</label>
                    <textarea
                      id="newSectionDescription"
                      value={newSectionDescription}
                      onChange={(e) => setNewSectionDescription(e.target.value)}
                      className={userModeStyles.formInput}
                      rows="3"
                    />
                  </div>
                  <button type="submit" disabled={actionLoading} className={userModeStyles.button}>添加频道</button>
                  </form>
              </div>
              <div className={userModeStyles.adminSection}>
                <h2>现有频道</h2>
                {actionLoading && <p>操作进行中...</p>}
                <table className={utilStyles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                      <th>频道名称 (帖子数)</th>
                      <th>描述</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.length === 0 ? (
                          <tr>
                        <td colSpan="4" style={{ textAlign: 'center' }}>暂无频道数据</td>
                          </tr>
                        ) : (
                          sections.map(section => (
                            <tr key={section.section_id}>
                              <td>{section.section_id}</td>
                          <td>{section.section_name} ({section.post_count || 0})</td>
                          <td>{section.description || '无'}</td>
                          <td>
                                <button 
                                  onClick={() => handleDeleteSection(section.section_id)}
                                  disabled={actionLoading}
                              className={`${userModeStyles.button} ${userModeStyles.dangerButton} ${userModeStyles.smallButton}`}
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
        </div>
      </div>
    </Layout>
  );
}
