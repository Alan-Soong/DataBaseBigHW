// pages/posts/user_mode.js
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import { useRouter } from 'next/router';

export default function UserMode() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [likeCounts, setLikeCounts] = useState({ post: {}, comment: {} });
  const [expandedPost, setExpandedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 从URL查询参数获取用户名
        const { username } = router.query;
        if (!username) {
          console.error('URL中缺少用户名参数');
          return;
        }

        const res = await fetch(`/api/auth/session?username=${encodeURIComponent(username)}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchUser();
    }
  }, [router.isReady, router.query]);

  // 获取帖子、评论和点赞数据
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/post');
        const data = await res.json();
        setPosts(data.posts || []);
        setCommentsByPost(data.commentsByPost || {});
        setLikeCounts(data.likeCounts || { post: {}, comment: {} });
      } catch (error) {
        console.error('获取帖子失败:', error);
      }
    };

    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        const data = await res.json();
        setSections(data.sections || []);
      } catch (error) {
        console.error('获取频道失败:', error);
      }
    };

    if (!loading && currentUser) {
      fetchPosts();
      fetchSections();
    }
  }, [loading, currentUser]);

  // 处理点赞
  const handleLike = async (targetType, targetId) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          userId: currentUser.user_id,
          targetType,
          targetId
        })
      });

      const result = await res.json();
      
      setLikeCounts(prev => ({
        ...prev,
        [targetType]: {
          ...prev[targetType],
          [targetId]: result.count
        }
      }));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 处理评论提交
  const handleCommentSubmit = async (postId) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    
    if (!newComment.trim()) return;

    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          userId: currentUser.user_id,
          postId,
          content: newComment
        })
      });

      const result = await res.json();
      
      // 更新评论列表
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), 
          { ...result.comment, username: currentUser.username }
        ]
      }));

      // 更新帖子的评论计数
      setPosts(prev => prev.map(p =>
        p.post_id === postId ? { ...p, comment_count: result.count } : p
      ));

      setNewComment('');
    } catch (error) {
      console.error('提交评论失败:', error);
    }
  };

  // 处理发帖
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    
    if (!newPostTitle.trim() || !newPostContent.trim() || !selectedSection) {
      alert('请填写标题、内容并选择频道');
      return;
    }

    try {
      const res = await fetch('/api/createPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.user_id,
          title: newPostTitle,
          content: newPostContent,
          sectionId: selectedSection
        })
      });

      const result = await res.json();
      
      if (result.success) {
        // 重置表单
        setNewPostTitle('');
        setNewPostContent('');
        setSelectedSection('');
        setShowNewPostForm(false);
        
        // 刷新帖子列表
        const postsRes = await fetch('/api/post');
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      } else {
        alert('发帖失败: ' + result.message);
      }
    } catch (error) {
      console.error('发帖失败:', error);
      alert('发帖失败，请稍后重试');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Layout>
      <Head>
        <title>校园BBS - 用户模式</title>
      </Head>
      <div className={utilStyles.postContainer}>
        <aside className={utilStyles.postSidebar}>
          <h3 className={utilStyles.sidebarTitle}>导航</h3>
          <ul className={utilStyles.sidebarMenu}>
            <li><Link href="/">返回首页</Link></li>
            <li><a href="#" onClick={(e) => {e.preventDefault(); setShowNewPostForm(!showNewPostForm);}}>
              {showNewPostForm ? '取消发帖' : '发布新帖子'}
            </a></li>
            <li><Link href="/posts/aboutUs">关于我们</Link></li>
            {currentUser && (
              <li>
                <Link href={`/user/${currentUser.user_id}`}>个人中心</Link>
              </li>
            )}
          </ul>
          
          <div className={utilStyles.sidebarSection}>
            <h4>当前用户</h4>
            {currentUser ? (
              <div className={utilStyles.userInfo}>
                <div className={utilStyles.avatar}>
                  {currentUser.username?.charAt(0) || '?'}
                </div>
                <span>{currentUser.username}</span>
                <div className={utilStyles.userLevel}>
                  等级: {currentUser.level || 1}
                </div>
                <div className={utilStyles.userExp}>
                  经验值: {currentUser.experience || 0}
                </div>
              </div>
            ) : (
              <div className={utilStyles.loginPrompt}>
                <p>未登录用户</p>
                <button 
                  onClick={() => router.push('/')}
                  className={utilStyles.loginButton}
                >
                  立即登录
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className={utilStyles.postMain}>
          {showNewPostForm && (
            <div className={utilStyles.newPostForm}>
              <h2>发布新帖子</h2>
              <form onSubmit={handlePostSubmit}>
                <div className={utilStyles.formGroup}>
                  <label>标题</label>
                  <input 
                    type="text" 
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="请输入帖子标题"
                    required
                  />
                </div>
                
                <div className={utilStyles.formGroup}>
                  <label>选择频道</label>
                  <select 
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    required
                  >
                    <option value="">请选择频道</option>
                    {sections.map(section => (
                      <option key={section.section_id} value={section.section_id}>
                        {section.section_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={utilStyles.formGroup}>
                  <label>内容</label>
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="请输入帖子内容"
                    rows={6}
                    required
                  />
                </div>
                
                <div className={utilStyles.formActions}>
                  <button type="submit" className={utilStyles.submitButton}>发布帖子</button>
                  <button 
                    type="button" 
                    className={utilStyles.cancelButton}
                    onClick={() => setShowNewPostForm(false)}
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <h1 className={utilStyles.postTitle}>校园BBS帖子列表</h1>
          {loading ? (
            <div className={utilStyles.loading}>加载中...</div>
          ) : (
            <div className={utilStyles.postList}>
              {posts.length === 0 ? (
                <div className={utilStyles.emptyState}>
                  <p>暂无帖子</p>
                  <button 
                    onClick={() => setShowNewPostForm(true)}
                    className={utilStyles.createButton}
                  >
                    发布第一篇帖子
                  </button>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.post_id} className={utilStyles.postCard}>
                    <div className={utilStyles.postHeader}>
                      <h2 className={utilStyles.postCardTitle}>{post.title}</h2>
                      <div className={utilStyles.postMeta}>
                        <span>作者: {post.username || '未知用户'}</span>
                        <span>发布于: {formatDate(post.post_time)}</span>
                      </div>
                    </div>
                    <div className={utilStyles.postContent}><p>{post.content}</p></div>
                    <div className={utilStyles.postActions}>
                      <button 
                        onClick={() => handleLike('post', post.post_id)}
                        className={utilStyles.likeButton}
                      >
                        👍 {likeCounts.post[post.post_id] || 0}
                      </button>
                      <button 
                        onClick={() => setExpandedPost(expandedPost === post.post_id ? null : post.post_id)}
                        className={utilStyles.commentButton}
                      >
                        💬 {post.comment_count || 0} {expandedPost === post.post_id ? '收起' : '展开'}
                      </button>
                    </div>
                    {expandedPost === post.post_id && (
                      <div className={utilStyles.commentsSection}>
                        <h3>评论 ({post.comment_count || 0})</h3>
                        <div className={utilStyles.commentForm}>
                          <textarea
                            placeholder="写下你的评论..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <button 
                            onClick={() => handleCommentSubmit(post.post_id)}
                            className={utilStyles.submitCommentButton}
                          >
                            发表评论
                          </button>
                        </div>
                        <div className={utilStyles.commentsList}>
                          {(commentsByPost[post.post_id] || []).length === 0 ? (
                            <div className={utilStyles.emptyComments}>暂无评论，快来发表第一条评论吧！</div>
                          ) : (
                            (commentsByPost[post.post_id] || []).map(comment => (
                              <div key={comment.comment_id} className={utilStyles.commentItem}>
                                <div className={utilStyles.commentHeader}>
                                  <div className={utilStyles.commentAuthor}>
                                    <div className={utilStyles.commentAvatar}>
                                      {comment.username?.charAt(0) || '?'}
                                    </div>
                                    <span>{comment.username}</span>
                                  </div>
                                  <span className={utilStyles.commentDate}>
                                    {formatDate(comment.create_at)}
                                  </span>
                                </div>
                                <div className={utilStyles.commentContent}>{comment.content}</div>
                                <div className={utilStyles.commentActions}>
                                  <button 
                                    onClick={() => handleLike('comment', comment.comment_id)}
                                    className={utilStyles.likeButton}
                                  >
                                    👍 {likeCounts.comment?.[comment.comment_id] || 0}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
