import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ExitConfirmModal from '../../components/ExitConfirmModal';
import AboutUsContent from '../../components/AboutUsContent';

export default function UserMode() {
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', section_id: '' });
  const [formError, setFormError] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [activeContent, setActiveContent] = useState('posts');

  // 新增搜索相关的状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title'); // 默认为按标题搜索
  const [searchResults, setSearchResults] = useState(null); // null 表示未进行搜索或无结果，数组表示有结果
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // 获取当前登录用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // 优先调用 checkLogin 获取当前登录用户
        const res = await fetch('/api/checkLogin');
        const data = await res.json();

        if (data.isLoggedIn && data.userId) {
          // 获取到当前用户ID后，再调用 userProfile 获取详细资料
          const profileRes = await fetch(`/api/userProfile?userId=${data.userId}`);
          const profileData = await profileRes.json();

          if (profileData.success) {
            setCurrentUser(profileData.user);
            // 可以选择更新 sessionStorage，但主要依赖后端 checkLogin
            sessionStorage.setItem('currentUser', JSON.stringify(profileData.user));
          } else {
             console.error('获取当前用户资料失败:', profileData.message);
             // 资料获取失败，也视为未登录或需要重新登录
             router.push('/'); // 或者跳转到登录页
          }

        } else {
          // 未登录或获取登录状态失败，跳转到首页或登录页
          router.push('/'); // 或者跳转到登录页
        }
      } catch (error) {
        console.error('获取当前用户信息或资料失败:', error);
        // 发生错误，跳转到首页或登录页
        router.push('/'); // 或者跳转到登录页
      } finally {
        setLoading(false);
      }
    };

    // 页面加载时就尝试获取当前用户
    fetchCurrentUser();

  }, [router]); // 依赖 router，确保 router 可用

  // 获取频道列表
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setSectionsLoading(true);
        console.log('正在获取频道列表...');
        const res = await fetch('/api/sections');
        const data = await res.json();
        console.log('频道列表数据:', data);
        
        // 检查返回的数据结构
        if (data.sections) {
          setSections(data.sections);
        } else if (Array.isArray(data)) {
          // 兼容直接返回数组的情况
          setSections(data);
        } else {
          console.error('频道数据格式不正确:', data);
        }
      } catch (error) {
        console.error('获取频道列表失败:', error);
      } finally {
        setSectionsLoading(false);
      }
    };

    if (!loading && currentUser) {
      fetchSections();
    }
  }, [loading, currentUser]);

  // 获取帖子列表
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);
        console.log('正在获取帖子列表...');
        
        // 添加用户ID参数，以便检查点赞状态
        let url = `/api/post?userId=${currentUser.user_id}`;
        
        // 如果选择了特定频道，添加频道过滤
        if (activeSection) {
          url += `&sectionId=${activeSection}`;
        }
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP错误: ${res.status}`); 
        const data = await res.json();
        console.log('帖子列表数据:', data);
        
        if (data.success && data.posts) {
          setPosts(data.posts);
        } else {
          console.error('帖子数据格式不正确:', data);
        }
      } catch (error) {
        console.error('获取帖子列表失败:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    // 只有在没有搜索结果时才自动获取所有或按频道过滤的帖子
    if (!loading && currentUser && searchResults === null) {
      fetchPosts();
    }
  }, [loading, currentUser, activeSection, searchResults]); // 依赖 searchResults

  // 监听滚动事件，显示/隐藏返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  // 处理发布新帖子
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.section_id) {
      setFormError('请填写完整的帖子信息');
      return;
    }
    
    try {
      const res = await fetch('/api/createPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.user_id,
          sectionId: newPost.section_id,
          title: newPost.title,
          content: newPost.content
        })
      });
      
      const data = await res.json();
      if (data.success) {
        // 重置表单
        setNewPost({ title: '', content: '', section_id: '' });
        setShowNewPostForm(false);
        setFormError('');
        
        // 刷新帖子列表
        const postsRes = await fetch(`/api/post?userId=${currentUser.user_id}`);
        const postsData = await postsRes.json();
        if (postsData.success) {
          setPosts(postsData.posts);
        }
        
        // 显示成功提示
        showToast('发布成功！');
      } else {
        setFormError(data.message || '发布失败，请稍后重试');
      }
    } catch (error) {
      console.error('发布帖子失败:', error);
      setFormError('发布失败，请稍后重试');
    }
  };

  // 处理点赞
  const handleLike = async (postId) => {
    if (!currentUser) return;
    
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          userId: currentUser.user_id,
          postId
        })
      });
      
      const data = await res.json();
      if (data.success) {
        // 更新帖子列表中的点赞状态
        setPosts(posts.map(post => {
          if (post.post_id === postId) {
            return {
              ...post,
              liked: !post.liked,
              like_count: post.liked ? post.like_count - 1 : post.like_count + 1
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  };

  // 处理频道筛选
  const handleSectionFilter = (sectionId) => {
    if (activeSection === sectionId) {
      setActiveSection(null); // 取消筛选
    } else {
      setActiveSection(sectionId); // 设置筛选
    }
  };

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 显示提示信息
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  // 处理退出确认
  const handleExit = () => {
    setShowExitConfirm(true);
  };

  // 确认退出
  const confirmExit = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      // 清除会话存储
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('username');
      router.push('/');
    } catch (error) {
      console.error('退出失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // 处理删除帖子
  const handleDeletePost = async (postId) => {
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
        // 从列表中移除被删除的帖子
        setPosts(posts.filter(post => post.post_id !== postId));
        showToast('帖子删除成功');
      } else {
        showToast(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      showToast('删除失败，请稍后重试');
    }
  };

  // 新增处理搜索的函数
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null); // 清空搜索结果如果查询为空
      setSearchError(null);
      return; // 如果搜索关键词为空，则不执行搜索
    }
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const res = await fetch(`/api/searchPosts?query=${encodeURIComponent(searchQuery)}&searchType=${searchType}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.posts);
      } else {
        setSearchError(data.message || '搜索失败');
        setSearchResults([]); // 搜索失败也清空结果
      }
    } catch (e) {
      console.error('搜索失败:', e);
      setSearchError('搜索过程中发生错误');
      setSearchResults([]); // 发生错误也清空结果
    } finally {
      setSearchLoading(false);
    }
  };

  // 清除搜索结果，返回显示所有帖子
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
  };

  return (
    <Layout>
      <Head>
        <title>校园论坛 - 用户模式</title>
      </Head>
      
      <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}>
        <div className={userModeStyles.postSidebar}>
          <h3 className={userModeStyles.sidebarTitle}>导航菜单</h3>
          <ul className={userModeStyles.sidebarMenu}>
            <li>
              <a 
                href="#" 
                className={userModeStyles.navItem}
                onClick={(e) => {
                  e.preventDefault();
                  handleExit();
                }}
              >
                返回首页
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`${userModeStyles.navItem} ${showNewPostForm && activeContent === 'posts' ? userModeStyles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setShowNewPostForm(true);
                  setActiveContent('posts');
                  scrollToTop();
                }}
              >
                发布新帖子
              </a>
            </li>
            <li className={userModeStyles.navItem}>
              <Link href={`/user/me`}>
                我的主页
              </Link>
            </li>
            <li>
              <a 
                href="#" 
                className={`${userModeStyles.navItem} ${activeContent === 'about' ? userModeStyles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveContent('about');
                }}
              >
                关于我们
              </a>
            </li>
          </ul>
          
          <div className={userModeStyles.sidebarSection}>
            <h4>频道列表</h4>
            {sectionsLoading ? (
              <div className={userModeStyles.loading}>加载中...</div>
            ) : sections && sections.length > 0 ? (
              <ul className={userModeStyles.sidebarMenu}>
                <li>
                  <a 
                    href="#" 
                    className={`${userModeStyles.navItem} ${activeSection === null ? userModeStyles.active : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSectionFilter(null);
                    }}
                  >
                    全部频道
                  </a>
                </li>
                {sections.map(section => (
                  <li key={section.section_id}>
                    <a 
                      href="#" 
                      className={`${userModeStyles.navItem} ${activeSection === section.section_id ? userModeStyles.active : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSectionFilter(section.section_id);
                      }}
                    >
                      {section.section_name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={userModeStyles.emptyState}>暂无频道</div>
            )}
          </div>
          
          {currentUser && (
            <div className={userModeStyles.sidebarSection}>
              <h4>当前用户</h4>
              <div className={userModeStyles.userInfo}>
                <div className={userModeStyles.avatar}>
                  {currentUser.username?.charAt(0) || '?'}
                </div>
                <span className={userModeStyles.userName}>{currentUser.username}</span>
                <div className={userModeStyles.userLevel}>
                  等级: {currentUser.level || 1}
                </div>
                <div className={userModeStyles.userExp}>
                  经验值: {currentUser.experience || 0}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <main className={userModeStyles.mainContent}>
          {activeContent === 'posts' ? (
            <>
              <div className={userModeStyles.postCard} style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 className={userModeStyles.heading} style={{ margin: 0 }}>
                  校园论坛
                  {activeSection !== null && sections.find(s => s.section_id === activeSection) &&
                    ` - ${sections.find(s => s.section_id === activeSection).section_name}`
                  }
                </h1>
              </div>

              <div className={userModeStyles.postCard} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button onClick={() => setShowNewPostForm(!showNewPostForm)} className={userModeStyles.button}>
                  {showNewPostForm ? '取消发帖' : '我要发帖'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginLeft: 'auto' }}>
                  <span>频道:</span>
                  <button 
                    className={`${userModeStyles.button} ${activeSection === null ? userModeStyles.active : ''}`} 
                    onClick={() => handleSectionFilter(null)} 
                  >
                    全部
                  </button>
                  {sections.map(section => (
                    <button 
                      key={section.section_id} 
                      className={`${userModeStyles.button} ${activeSection === section.section_id ? userModeStyles.active : ''}`} 
                      onClick={() => handleSectionFilter(section.section_id)}
                    >
                      {section.section_name}
                    </button>
                  ))}
                </div>
              </div>

              {showNewPostForm && (
                <div className={userModeStyles.newPostForm} style={{ marginBottom: '20px' }}>
                  <h2>发布新帖子</h2>
                  <form onSubmit={handleSubmitPost}>
                    <div className={userModeStyles.formGroup}>
                      <label htmlFor="section_id">选择频道</label>
                      <select 
                        id="section_id" 
                        name="section_id" 
                        value={newPost.section_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">-- 请选择频道 --</option>
                        {sections && sections.map(section => (
                          <option key={section.section_id} value={section.section_id}>
                            {section.section_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={userModeStyles.formGroup}>
                      <label htmlFor="title">标题</label>
                      <input 
                        type="text" 
                        id="title" 
                        name="title" 
                        value={newPost.title}
                        onChange={handleInputChange}
                        placeholder="请输入帖子标题"
                        required
                      />
                    </div>
                    
                    <div className={userModeStyles.formGroup}>
                      <label htmlFor="content">内容</label>
                      <textarea 
                        id="content" 
                        name="content" 
                        value={newPost.content}
                        onChange={handleInputChange}
                        placeholder="请输入帖子内容"
                        rows="6"
                        required
                      ></textarea>
                    </div>
                    
                    {formError && <div className={userModeStyles.error}>{formError}</div>}
                    
                    <div className={userModeStyles.formActions}>
                      <button 
                        type="button" 
                        className={userModeStyles.cancelButton}
                        onClick={() => {
                          setShowNewPostForm(false);
                          setFormError('');
                        }}
                      >
                        取消
                      </button>
                      <button type="submit" className={userModeStyles.submitButton}>
                        发布帖子
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className={userModeStyles.postCard} style={{ marginBottom: '20px', padding: '15px' }}>
                <h2 className={userModeStyles.postCardTitle} style={{ marginTop: '0' }}>搜索帖子</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="输入搜索关键词..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={userModeStyles.formInput}
                    style={{ flexGrow: 1, minWidth: '250px' }}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  />
                  <select 
                    value={searchType} 
                    onChange={(e) => setSearchType(e.target.value)} 
                    className={userModeStyles.formInput}
                  >
                    <option value="title">按标题</option>
                    <option value="content">按内容</option>
                  </select>
                  <button onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()} className={userModeStyles.button}>搜索</button>
                  {searchResults !== null && (
                    <button onClick={clearSearch} className={`${userModeStyles.button} ${userModeStyles.secondaryButton}`}>清除搜索</button>
                  )}
                </div>
                {searchLoading && <p>搜索中...</p>}
                {searchError && <p className={userModeStyles.error}>搜索失败: {searchError}</p>}
              </div>

              <div className={userModeStyles.postList}>
                {postsLoading ? (
                  <div className={userModeStyles.loading}>加载帖子中...</div>
                ) : searchResults !== null ? (
                  searchResults.length > 0 ? (
                    searchResults.map(post => (
                      <div key={post.post_id} className={userModeStyles.postCard}>
                        <h2 className={userModeStyles.postCardTitle}>
                          <Link href={`/posts/${post.post_id}`}>
                            {post.title}
                          </Link>
                        </h2>
                        <div className={userModeStyles.postMeta}>
                          <span>作者: {post.username}</span>
                          <span>发布时间: {formatDate(post.post_time)}</span>
                          <span>评论数: {post.comment_count}</span>
                          <span>点赞数: {post.like_count}</span>
                        </div>
                        <div className={userModeStyles.postContent}>
                          {post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}
                        </div>
                        <div className={userModeStyles.postActions}>
                          <button 
                            onClick={() => handleLike(post.post_id)}
                            className={`${userModeStyles.likeButton} ${post.liked ? userModeStyles.active : ''}`}
                          >
                            {post.like_count}
                          </button>
                          <Link href={`/posts/${post.post_id}#comments`} className={userModeStyles.commentButton}>
                            评论 {post.comment_count}
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>没有找到符合条件的帖子。</p>
                  )
                ) : (
                  posts.length > 0 ? (
                    posts.map(post => (
                      <div key={post.post_id} className={userModeStyles.postCard}>
                        <h2 className={userModeStyles.postCardTitle}>
                          <Link href={`/posts/${post.post_id}`}>
                            {post.title}
                          </Link>
                        </h2>
                        <div className={userModeStyles.postMeta}>
                          <span>作者: {post.username}</span>
                          <span>发布时间: {formatDate(post.post_time)}</span>
                          <span>评论数: {post.comment_count}</span>
                          <span>点赞数: {post.like_count}</span>
                        </div>
                        <div className={userModeStyles.postContent}>
                          {post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}
                        </div>
                        <div className={userModeStyles.postActions}>
                          <button 
                            onClick={() => handleLike(post.post_id)}
                            className={`${userModeStyles.likeButton} ${post.liked ? userModeStyles.active : ''}`}
                          >
                            {post.like_count}
                          </button>
                          <Link href={`/posts/${post.post_id}#comments`} className={userModeStyles.commentButton}>
                            评论 {post.comment_count}
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={userModeStyles.emptyState}>
                      <p>暂无帖子</p>
                      <button 
                        className={userModeStyles.createButton}
                        onClick={() => {
                          setShowNewPostForm(true);
                          scrollToTop();
                        }}
                      >
                        发布第一个帖子
                      </button>
                    </div>
                  )
                )}
              </div>
            </>
          ) : activeContent === 'about' ? (
            <AboutUsContent />
          ) : null}
        </main>
      </div>
      
      {showBackToTop && (
        <button 
          className={`${userModeStyles.backToTop} ${showBackToTop ? userModeStyles.visible : ''}`}
          onClick={scrollToTop}
          aria-label="返回顶部"
        >
          ↑
        </button>
      )}
      
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={confirmExit}
      />
      
      {toast.show && (
        <div className={userModeStyles.toast}>
          {toast.message}
        </div>
      )}
    </Layout>
  );
}
