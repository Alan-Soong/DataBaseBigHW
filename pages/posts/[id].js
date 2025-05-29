// pages/posts/[id].js
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import { useEffect, useState } from 'react';

// 添加时间格式化函数
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) {
      console.log('Router not ready or ID missing:', id);
      return;
    }
    console.log('Fetching post for ID:', id);
    // if (!id) return;

    fetch(`/api/post?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('API response:', data);
        setPost(data.post);
        setComments(data.comments);
        setLikeCount(data.likeCount);
        setLiked(!!data.post.liked);
      }).catch(error => {
          console.error('Fetch error:', error);
        });
    }, [id, router.isReady]);

  const handleLike = async () => {
    // 检查登录
    const res = await fetch('/api/checkLogin');
    const loginStatus = await res.json();
    if (!loginStatus.isLoggedIn) {
      alert('请先登录后再点赞');
      return;
    }
    const result = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', targetType: 'post', targetId: id, userId: loginStatus.userId })
    }).then(r => r.json());
    setLikeCount(result.count);
    setLiked(result.liked);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    
    // 检查用户是否登录
    const res = await fetch('/api/checkLogin');
    const loginStatus = await res.json();
    
    if (!loginStatus.isLoggedIn) {
      alert('请先登录后再发表评论');
      return;
    }

    const commentRes = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'comment', 
        postId: id, 
        content: newComment,
        userId: loginStatus.userId
      })
    });
    const result = await commentRes.json();
    if (result.success && result.comment) {
      setComments([...comments, result.comment]);
      setNewComment('');
    } else {
      console.error('发表评论失败:', result.message);
      alert('发表评论失败: ' + result.message);
    }
  };

  // 点赞评论
  const handleCommentLike = async (commentId) => {
    const res = await fetch('/api/checkLogin');
    const loginStatus = await res.json();
    if (!loginStatus.isLoggedIn) {
      alert('请先登录后再点赞评论');
      return;
    }
    const result = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', targetType: 'comment', targetId: commentId, userId: loginStatus.userId })
    }).then(r => r.json());
    setComments(comments => comments.map(c =>
      c.comment_id === commentId ? { ...c, like_count: result.count, liked: result.liked } : c
    ));
  };

  if (!post) return <Layout><p className={utilStyles.loading}>加载中...</p></Layout>;

  return (
    <Layout>
      <Head><title>{post.title}</title></Head>
      <div className={utilStyles.postCard}>
        <h1 className={utilStyles.postCardTitle}>{post.title}</h1>
        <p className={utilStyles.postMeta}>作者: {post.username} | 发布时间: {formatDate(post.post_time)}</p>
        <p className={utilStyles.postContent}>{post.content}</p>
        <div className={utilStyles.postActions}>
          <button 
            onClick={handleLike} 
            className={liked ? utilStyles.likedButton : ''}
            title={liked ? '已点赞' : '点赞'}
          >
            {liked ? '👍' : '👍🏻'} {likeCount}
          </button>
        </div>
      </div>

      <div className={utilStyles.commentsSection}>
        <h2>评论</h2>
        <div className={utilStyles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="输入评论..."
          />
          <button onClick={handleComment}>发表评论</button>
        </div>

        <div className={utilStyles.commentsList}>
          {comments.map(comment => (
            <div key={comment.comment_id} className={utilStyles.commentItem}>
              <div className={utilStyles.commentHeader}>
                <div className={utilStyles.commentAuthor}>
                  <div className={utilStyles.commentAvatar}>
                    {(comment.username || '匿名用户').charAt(0)}
                  </div>
                  <span>{comment.username || '匿名用户'}</span>
                </div>
                <span className={utilStyles.commentDate}>{formatDate(comment.create_at)}</span>
                <button
                  onClick={() => handleCommentLike(comment.comment_id)}
                  className={comment.liked ? utilStyles.likedButton : ''}
                  title={comment.liked ? '已点赞' : '点赞'}
                  style={{ marginLeft: 12 }}
                >
                  {comment.liked ? '👍' : '👍🏻'} {comment.like_count || 0}
                </button>
              </div>
              <div className={utilStyles.commentContent}>{comment.content}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
