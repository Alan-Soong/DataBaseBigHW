// pages/posts/[id].js
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!router.isReady || !id) {
      console.log('Router not ready or ID missing:', id);
      return;
    }
    console.log('Fetching post for ID:', id);
    // if (!id) return;

    fetchPostAndComments();
  }, [id, router.isReady]);

  const fetchPostAndComments = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // 将当前登录用户的ID作为 userId 传递给后端，用于检查点赞状态
      const currentUserIdParam = currentUser ? `&userId=${currentUser.user_id}` : '';
      const res = await fetch(`/api/post?id=${id}${currentUserIdParam}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        setPost(data.post);
        // 构建评论树
        const commentsMap = {};
        data.comments.forEach(comment => { // 将评论存储在map中方便查找
          commentsMap[comment.comment_id] = { ...comment, replies: [] };
        });

        const rootComments = [];
        Object.values(commentsMap).forEach(comment => {
          if (comment.parent_comment_id === null) { // 顶层评论
            rootComments.push(comment);
          } else {
            const parentComment = commentsMap[comment.parent_comment_id];
            if (parentComment) { // 如果父评论存在
              parentComment.replies.push(comment);
            } else { // 父评论不存在（已删除），将当前评论视为顶层评论或特殊标记
              // 这里可以根据需求处理，例如将孤儿评论作为顶层评论显示，或者添加标记
              // 为了实现占位，我们可以在渲染时检查parent_comment_id是否存在于commentsMap中
               rootComments.push(comment); // 将孤儿评论也作为顶层评论处理，前端渲染时会检查父级
            }
          }
        });
        // 按时间排序顶层评论和回复
         rootComments.sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
         rootComments.forEach(comment => { // 对每个评论的回复也排序
           comment.replies.sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
         });

        setComments(rootComments); // 设置构建好的评论树
        setLikeCount(data.likeCount); // 设置帖子点赞数

      } else {
        console.error('获取帖子详情失败:', data.message);
        setPost(null);
        setComments([]);
        setLikeCount(0);
      }
    } catch (error) {
      console.error('获取帖子详情失败:', error);
      setPost(null);
      setComments([]);
      setLikeCount(0);
    } finally {
      setLoading(false);
    }
  };

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
      body: JSON.stringify({ 
        action: 'like', 
        postId: id,
        userId: loginStatus.userId 
      })
    }).then(r => r.json());
    setLikeCount(result.count);
    setLiked(result.liked);
  };

  // 辅助函数：递归查找并添加回复到评论树
  const addReplyToCommentsTree = (commentsTree, parentCommentId, newReply) => {
    for (let i = 0; i < commentsTree.length; i++) {
      const comment = commentsTree[i];
      if (comment.comment_id === parentCommentId) {
        // 找到父评论，添加回复并按时间排序
        comment.replies.push(newReply);
        comment.replies.sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
        return commentsTree; // 返回更新后的树
      }
      // 如果有回复，递归查找子树
      if (comment.replies && comment.replies.length > 0) {
        const updatedReplies = addReplyToCommentsTree(comment.replies, parentCommentId, newReply);
        if (updatedReplies !== comment.replies) {
           // 如果子树有更新，返回整个树
           return commentsTree;
        }
      }
    }
    return commentsTree; // 没有找到父评论，返回原树 (不应该发生如果parentCommentId有效)
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
      // 对于顶层评论，直接添加到根评论列表并排序
      const updatedComments = [...comments, result.comment];
      updatedComments.sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
      setComments(updatedComments);
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
      body: JSON.stringify({ 
        action: 'like', 
        commentId: commentId,
        userId: loginStatus.userId 
      })
    }).then(r => r.json());
    setComments(comments => comments.map(c =>
      c.comment_id === commentId ? { ...c, like_count: result.count, liked: result.liked } : c
    ));
  };

  // 处理回复提交
  const handleReplySubmit = async (parentCommentId) => {
    if (!replyContent.trim()) return;

    // 检查用户是否登录
    const res = await fetch('/api/checkLogin');
    const loginStatus = await res.json();

    if (!loginStatus.isLoggedIn) {
      alert('请先登录后再发表回复');
      return;
    }

    // 调用后端API发表回复
    const replyRes = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'comment',
        postId: id,
        content: replyContent,
        userId: loginStatus.userId,
        parentCommentId: parentCommentId // 发送父评论ID
      })
    });
    const result = await replyRes.json();

    if (result.success && result.comment) {
      // 将新回复添加到评论树的正确位置
      const updatedCommentsTree = addReplyToCommentsTree([...comments], parentCommentId, result.comment);
      setComments(updatedCommentsTree);
      // 清空回复状态
      setReplyingTo(null);
      setReplyContent('');
    } else {
      console.error('发表回复失败:', result.message);
      alert('发表回复失败: ' + result.message);
    }
  };

  // 辅助函数：递归渲染评论和其回复
  const renderComments = (commentList) => {
    return (
      <div className={utilStyles.commentList}>
        {commentList.map(comment => (
          <div key={comment.comment_id} className={utilStyles.commentItem}>
            {/* 检查父评论是否存在并渲染占位符 */}
            {comment.parent_comment_id !== null && !comments.find(c => c.comment_id === comment.parent_comment_id) && (
                <div className={utilStyles.deletedCommentPlaceholder}>回复一个已删除的评论</div>
             )}
            <p>{comment.content}</p>
            <div className={utilStyles.commentMeta}>
              <span>作者: {comment.username}</span>
              <span>发布于: {formatDate(comment.create_at)}</span>
              <button onClick={() => handleCommentLike(comment.comment_id)} className={`${utilStyles.commentLikeButton} ${comment.liked ? utilStyles.likedButton : ''}`} title={comment.liked ? '已点赞评论' : '点赞评论'}>
                {comment.liked ? '👍' : '👍🏻'} {comment.like_count || 0}
              </button>
              <button onClick={() => setReplyingTo(comment.comment_id)} className={utilStyles.replyButton}>回复</button>
            </div>

            {/* 如果正在回复当前评论，显示回复输入框 */}
            {replyingTo === comment.comment_id && (
                 <div className={utilStyles.replyForm}>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`回复 @${comment.username}: `}
                    />
                    <button onClick={() => handleReplySubmit(comment.comment_id)}>提交回复</button>
                    <button onClick={() => setReplyingTo(null)}>取消</button>
                 </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className={utilStyles.replies}>
                {renderComments(comment.replies)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
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
            className={`${utilStyles.likeButton} ${liked ? utilStyles.likedButton : ''}`}
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

        <section className={utilStyles.sectionLg}>
          <h2 className={utilStyles.headingLg}>评论 ({comments.length})</h2>
          {comments && comments.length > 0 ? (
            renderComments(comments)
          ) : (
            <p>暂无评论。</p>
          )}
        </section>
      </div>
    </Layout>
  );
}
