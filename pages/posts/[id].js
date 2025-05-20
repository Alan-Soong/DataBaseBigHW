// pages/posts/[id].js
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import { useEffect, useState } from 'react';

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/post?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data.post);
        setComments(data.comments);
        setLikeCount(data.likeCount);
      });
  }, [id]);

  const handleLike = async () => {
    const res = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', targetType: 'post', targetId: id })
    });
    const result = await res.json();
    setLikeCount(result.count);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    const res = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comment', postId: id, content: newComment })
    });
    const result = await res.json();
    setComments([...comments, result.comment]);
    setNewComment('');
  };

  if (!post) return <Layout><p className={utilStyles.loading}>加载中...</p></Layout>;

  return (
    <Layout>
      <Head><title>{post.title}</title></Head>
      <div className={utilStyles.postCard}>
        <h1 className={utilStyles.postCardTitle}>{post.title}</h1>
        <p className={utilStyles.postMeta}>作者: {post.username} | 发布时间: {post.post_time}</p>
        <p className={utilStyles.postContent}>{post.content}</p>
        <div className={utilStyles.postActions}>
          <button onClick={handleLike}>👍 {likeCount}</button>
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
                  <div className={utilStyles.commentAvatar}>{comment.username.charAt(0)}</div>
                  <span>{comment.username}</span>
                </div>
                <span className={utilStyles.commentDate}>{comment.create_at}</span>
              </div>
              <div className={utilStyles.commentContent}>{comment.content}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
