// pages/user_mode.js
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';

export default function UserMode() {
  const [posts, setPosts] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [likeCounts, setLikeCounts] = useState({ post: {}, comment: {} });
  const [expandedPost, setExpandedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUser = { user_id: 1, username: '当前用户' };

  useEffect(() => {
    fetch('/api/post')
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || []);
        setCommentsByPost(data.commentsByPost || {});
        setLikeCounts(data.likeCounts || { post: {}, comment: {} });
        setLoading(false);
      })
      .catch(err => {
        console.error('加载失败:', err);
        setLoading(false);
      });
  }, []);

  const handleLike = async (targetType, targetId) => {
    try {
      await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          userId: currentUser.user_id,
          targetType,
          targetId
        })
      });

      const res = await fetch(`/api/post?targetType=${targetType}&targetId=${targetId}`);
      const data = await res.json();

      if (targetType === 'post') {
        setLikeCounts(prev => ({ ...prev, post: { ...prev.post, [targetId]: data.count } }));
      } else {
        setLikeCounts(prev => ({ ...prev, comment: { ...prev.comment, [targetId]: data.count } }));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleCommentSubmit = async (postId) => {
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
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), result.comment]
      }));

      setPosts(prev => prev.map(p =>
        p.post_id === postId ? { ...p, comment_count: result.count } : p
      ));

      setNewComment('');
    } catch (error) {
      console.error('提交评论失败:', error);
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
        <title>博客文章列表</title>
      </Head>
      <div className={utilStyles.postContainer}>
        <aside className={utilStyles.postSidebar}>
          <h3 className={utilStyles.sidebarTitle}>导航</h3>
          <ul className={utilStyles.sidebarMenu}>
            <li><Link href="/">返回首页</Link></li>
            <li><Link href="/posts/other-post">热门文章</Link></li>
            <li><Link href="/posts/aboutUs">关于我们</Link></li>
            <li><Link href="/posts/create">发布新文章</Link></li>
          </ul>
          <div className={utilStyles.sidebarSection}>
            <h4>当前用户</h4>
            <div className={utilStyles.userInfo}>
              <div className={utilStyles.avatar}>{currentUser.username.charAt(0)}</div>
              <span>{currentUser.username}</span>
            </div>
          </div>
        </aside>

        <main className={utilStyles.postMain}>
          <h1 className={utilStyles.postTitle}>博客文章列表</h1>
          {loading ? (
            <div className={utilStyles.loading}>加载中...</div>
          ) : (
            <div className={utilStyles.postList}>
              {posts.length === 0 ? (
                <div className={utilStyles.emptyState}><p>暂无文章</p></div>
              ) : (
                posts.map(post => (
                  <div key={post.post_id} className={utilStyles.postCard}>
                    <div className={utilStyles.postHeader}>
                      <h2 className={utilStyles.postCardTitle}>{post.title}</h2>
                      <div className={utilStyles.postMeta}>
                        <span>作者: {post.username}</span>
                        <span>发布于: {formatDate(post.post_time)}</span>
                      </div>
                    </div>
                    <div className={utilStyles.postContent}><p>{post.content}</p></div>
                    <div className={utilStyles.postActions}>
                      <button onClick={() => handleLike('post', post.post_id)}>
                        👍 {likeCounts.post[post.post_id] || 0}
                      </button>
                      <button onClick={() => setExpandedPost(expandedPost === post.post_id ? null : post.post_id)}>
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
                          <button onClick={() => handleCommentSubmit(post.post_id)}>发表评论</button>
                        </div>
                        <div className={utilStyles.commentsList}>
                          {(commentsByPost[post.post_id] || []).map(comment => (
                            <div key={comment.comment_id} className={utilStyles.commentItem}>
                              <div className={utilStyles.commentHeader}>
                                <div className={utilStyles.commentAuthor}>
                                  <div className={utilStyles.commentAvatar}>{comment.username.charAt(0)}</div>
                                  <span>{comment.username}</span>
                                </div>
                                <span className={utilStyles.commentDate}>{formatDate(comment.create_at)}</span>
                              </div>
                              <div className={utilStyles.commentContent}>{comment.content}</div>
                              <div className={utilStyles.commentActions}>
                                <button onClick={() => handleLike('comment', comment.comment_id)}>
                                  👍 {likeCounts.comment?.[comment.comment_id] || 0}
                                </button>
                              </div>
                            </div>
                          ))}
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