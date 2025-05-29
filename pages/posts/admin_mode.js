import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/admin.module.css';

export default function AdminMode() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [actionLoading, setActionLoading] = useState(false);

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
            router.push('/login'); // 跳转到登录页
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
        body: JSON.stringify({ sectionName: newSectionName })
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

  return (
    <Layout>
      <Head>
        <title>管理员后台</title>
      </Head>
      
      <div className={utilStyles.adminContainer}>
        <div className={utilStyles.adminSidebar}>
          <h3 className={utilStyles.sidebarTitle}>管理菜单</h3>
          <div className={styles.adminMenu}>
            <button onClick={() => setActiveTab('users')} className={styles.menuButton}>用户管理</button>
            <button onClick={() => setActiveTab('posts')} className={styles.menuButton}>帖子管理</button>
            <button onClick={() => setActiveTab('comments')} className={styles.menuButton}>评论管理</button>
            <button onClick={() => setActiveTab('sections')} className={styles.menuButton}>频道管理</button>
          </div>
          
          {currentUser && (
            <div className={utilStyles.sidebarSection}>
              <h4>当前管理员</h4>
              <div className={utilStyles.userInfo}>
                <div className={utilStyles.avatar}>
                  {currentUser.username?.charAt(0) || '?'}
                </div>
                <span>{currentUser.username}</span>
              </div>
            </div>
          )}
        </div>
        
        <main className={utilStyles.adminMain}>
          <h1 className={utilStyles.adminTitle}>管理员后台</h1>
          
          {loading ? (
            <div className={utilStyles.loading}>加载中...</div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className={utilStyles.adminSection}>
                  <h2 className={utilStyles.sectionTitle}>用户管理</h2>
                  <div className={utilStyles.tableContainer}>
                    <table className={utilStyles.adminTable}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>用户名</th>
                          <th>专业</th>
                          <th>等级</th>
                          <th>经验值</th>
                          <th>管理员</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="7" className={utilStyles.emptyRow}>暂无用户数据</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.user_id}>
                              <td>{user.user_id}</td>
                              <td>{user.username}</td>
                              <td>{user.major || '-'}</td>
                              <td>{user.level}</td>
                              <td>{user.experience}</td>
                              <td>{user.is_admin ? '是' : '否'}</td>
                              <td className={utilStyles.actionCell}>
                                <button 
                                  onClick={() => handleSetAdmin(user.user_id, !user.is_admin)}
                                  className={utilStyles.actionButton}
                                  disabled={actionLoading}
                                >
                                  {user.is_admin ? '取消管理员' : '设为管理员'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  className={`${utilStyles.actionButton} ${utilStyles.deleteButton}`}
                                  disabled={actionLoading}
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
              
              {activeTab === 'posts' && (
                <div className={utilStyles.adminSection}>
                  <h2 className={utilStyles.sectionTitle}>帖子管理</h2>
                  <div className={utilStyles.tableContainer}>
                    <table className={utilStyles.adminTable}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>标题</th>
                          <th>作者</th>
                          <th>发布时间</th>
                          <th>评论数</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.length === 0 ? (
                          <tr>
                            <td colSpan="6" className={utilStyles.emptyRow}>暂无帖子数据</td>
                          </tr>
                        ) : (
                          posts.map(post => (
                            <tr key={post.post_id}>
                              <td>{post.post_id}</td>
                              <td className={utilStyles.titleCell}>{post.title}</td>
                              <td>{post.username}</td>
                              <td>{formatDate(post.post_time)}</td>
                              <td>{post.comment_count}</td>
                              <td className={utilStyles.actionCell}>
                                <Link href={`/posts/${post.post_id}`} className={utilStyles.actionButton}>
                                  查看
                                </Link>
                                <button 
                                  onClick={() => handleDeletePost(post.post_id)}
                                  className={`${utilStyles.actionButton} ${utilStyles.deleteButton}`}
                                  disabled={actionLoading}
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
              
              {activeTab === 'comments' && (
                <div className={utilStyles.adminSection}>
                  <h2 className={utilStyles.sectionTitle}>评论管理</h2>
                  <div className={utilStyles.tableContainer}>
                    <table className={utilStyles.adminTable}>
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
                            <td colSpan="6" className={utilStyles.emptyRow}>暂无评论数据</td>
                          </tr>
                        ) : (
                          comments.map(comment => (
                            <tr key={comment.comment_id}>
                              <td>{comment.comment_id}</td>
                              <td className={utilStyles.contentCell}>{comment.content}</td>
                              <td>{comment.username}</td>
                              <td>{comment.post_id}</td>
                              <td>{formatDate(comment.create_at)}</td>
                              <td className={utilStyles.actionCell}>
                                <Link href={`/posts/${comment.post_id}`} className={utilStyles.actionButton}>
                                  查看帖子
                                </Link>
                                <button 
                                  onClick={() => handleDeleteComment(comment.comment_id)}
                                  className={`${utilStyles.actionButton} ${utilStyles.deleteButton}`}
                                  disabled={actionLoading}
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
              
              {activeTab === 'sections' && (
                <div className={utilStyles.adminSection}>
                  <h2 className={utilStyles.sectionTitle}>频道管理</h2>
                  
                  <form onSubmit={handleAddSection} className={utilStyles.addForm}>
                    <input
                      type="text"
                      placeholder="新频道名称"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className={utilStyles.addInput}
                      disabled={actionLoading}
                    />
                    <button type="submit" className={utilStyles.addButton} disabled={actionLoading}>
                      添加频道
                    </button>
                  </form>

                  <div className={utilStyles.tableContainer}>
                    <table className={utilStyles.adminTable}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>频道名称</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.length === 0 ? (
                          <tr>
                            <td colSpan="3" className={utilStyles.emptyRow}>暂无频道数据</td>
                          </tr>
                        ) : (
                          sections.map(section => (
                            <tr key={section.section_id}>
                              <td>{section.section_id}</td>
                              <td>{section.section_name}</td>
                              <td className={utilStyles.actionCell}>
                                <button 
                                  onClick={() => handleDeleteSection(section.section_id)}
                                  className={`${utilStyles.actionButton} ${utilStyles.deleteButton}`}
                                  disabled={actionLoading}
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
            </>
          )}
        </main>
      </div>
    </Layout>
  );
}
