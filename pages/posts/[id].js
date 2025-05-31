// pages/posts/[id].js
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
import userModeStyles from '../../styles/user_mode.module.css';
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
  const [allCommentsFlat, setAllCommentsFlat] = useState([]); // 新增：存储所有评论的扁平列表

  // 新增获取当前用户的逻辑
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/checkLogin');
      const data = await res.json();
      if (data.isLoggedIn && data.userId) {
        // 获取到当前用户ID后，再调用 userProfile 获取详细资料
        const profileRes = await fetch(`/api/userProfile?userId=${data.userId}`);
        const profileData = await profileRes.json();
        if (profileData.success) {
          setCurrentUser(profileData.user);
        } else {
           console.error('获取当前用户资料失败:', profileData.message);
           // 资料获取失败，可以根据需要处理，例如不设置 currentUser
        }
      } else {
        // 未登录或获取登录状态失败，设置 currentUser 为 null
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('获取当前用户信息或资料失败:', error);
      setCurrentUser(null);
    }
  };

  // 获取当前登录用户信息 (组件挂载时执行一次)
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!router.isReady || !id) {
      console.log('Router not ready or ID missing:', id);
      return;
    }
    console.log('Fetching post for ID:', id);

    // 只有当 router 就绪、ID 存在且 currentUser 加载完成后才获取帖子和评论
    if (currentUser) {
      fetchPostAndComments();
    }
  }, [id, router.isReady, currentUser]); // 添加 currentUser 依赖

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
        setAllCommentsFlat(data.comments); // 保存扁平列表
        // 构建评论树
        const commentsMap = {};
        data.comments.forEach(comment => { // 将评论存储在map中方便查找
          commentsMap[comment.comment_id] = { ...comment, replies: [] };
        });

        const rootComments = [];
        data.comments.forEach(comment => { // 遍历所有评论，构建树结构
          if (comment.parent_comment_id === null) { // 顶层评论
            rootComments.push(commentsMap[comment.comment_id]);
          } else { // 回复
            const parentComment = commentsMap[comment.parent_comment_id];
            if (parentComment) { // 如果父评论存在
              parentComment.replies.push(commentsMap[comment.comment_id]);
            } else { // 父评论不存在（已删除），将当前评论标记为孤儿或特殊处理
               // 为了实现占位，我们可以在渲染时检查parent_comment_id是否存在于allCommentsFlat中
               // 或者直接将孤儿评论作为顶层评论处理，前端渲染时会检查父级
               // 这里我们选择在渲染时检查父级是否存在于原始扁平列表中
               rootComments.push(commentsMap[comment.comment_id]); // 将孤儿评论也作为顶层评论处理
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
        setLiked(data.post.liked); // 根据后端数据设置帖子的点赞状态

      } else {
        console.error('获取帖子详情失败:', data.message);
        setPost(null);
        setComments([]);
        setLikeCount(0);
        setAllCommentsFlat([]);
      }
    } catch (error) {
      console.error('获取帖子详情失败:', error);
      setPost(null);
      setComments([]);
      setLikeCount(0);
      setAllCommentsFlat([]);
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
    console.log('帖子点赞API返回:', result);
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
        // 如果子树有更新，返回整个树的副本以触发React更新
        if (updatedReplies !== comment.replies) {
           return [...commentsTree];
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
    console.log('评论发表API返回:', result);
    if (result.success && result.comment) {
      // 对于顶层评论，直接添加到根评论列表并排序
      const updatedComments = [...comments, result.comment];
      updatedComments.sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
      setComments(updatedComments);
      setAllCommentsFlat(prev => [...prev, result.comment]); // 更新扁平列表
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
    console.log(`评论 ${commentId} 点赞API返回:`, result);
    // 更新评论树和扁平列表的点赞状态
    setComments(comments => comments.map(c =>
      c.comment_id === commentId ? { ...c, like_count: result.count, liked: result.liked } : 
      { ...c, replies: c.replies.map(r => r.comment_id === commentId ? { ...r, like_count: result.count, liked: result.liked } : r) } // 递归更新回复的点赞状态
    ));
    setAllCommentsFlat(prev => prev.map(c => c.comment_id === commentId ? { ...c, like_count: result.count, liked: result.liked } : c)); // 更新扁平列表

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
    console.log(`回复 ${parentCommentId} 提交API返回:`, result);

    if (result.success && result.comment) {
      // 将新回复添加到评论树的正确位置
      const updatedCommentsTree = addReplyToCommentsTree([...comments], parentCommentId, result.comment);
      setComments(updatedCommentsTree);
      setAllCommentsFlat(prev => [...prev, result.comment]); // 更新扁平列表
      // 清空回复状态
      setReplyingTo(null);
      setReplyContent('');
    } else {
      console.error('发表回复失败:', result.message);
      alert('发表回复失败: ' + result.message);
    }
  };

  // 辅助函数：递归渲染评论和其回复，传入层级
  const renderComments = (commentList, level = 0) => {
    return (
      <div className={level === 0 ? userModeStyles.commentList : userModeStyles.repliesList}> 
        {commentList.map(comment => {
          // 检查父评论是否存在于所有评论的扁平列表中
          const parentExists = comment.parent_comment_id === null || allCommentsFlat.some(c => c.comment_id === comment.parent_comment_id);
          
          // 查找父评论以便获取用户名
          const parentComment = comment.parent_comment_id ? allCommentsFlat.find(c => c.comment_id === comment.parent_comment_id) : null;

          return (
            <div key={comment.comment_id} className={`${userModeStyles.commentItem} ${level > 0 ? userModeStyles.replyItem : ''} ${level > 1 ? userModeStyles.nestedReplyItem : ''}`}> {/* 应用不同层级的样式 */}
              {/* 仅当父评论不存在且当前评论有父评论ID时显示占位符 */}
              {comment.parent_comment_id !== null && !parentExists && (
                <div className={utilStyles.deletedCommentPlaceholder}>回复一个已删除的评论</div>
             )}
              <h4>{comment.username}</h4>
              <p className={userModeStyles.commentContent}>
                {/* 如果是二级或更深回复，显示回复对象 */}
                {level > 0 && parentComment && 
                 <span className={userModeStyles.replyTo}>回复 {parentComment.username}: </span>
                }
                {comment.content}
              </p>
              <div className={userModeStyles.commentMeta}>
              <span>发布于: {formatDate(comment.create_at)}</span>
                <button 
                  onClick={() => handleCommentLike(comment.comment_id)} 
                  className={`${userModeStyles.likeButton} ${comment.liked ? userModeStyles.active : ''}`} /* 根据 comment.liked 状态添加 active 类 */
                  key={`comment-like-${comment.comment_id}-${comment.liked}-${comment.like_count}`} // 添加 key 属性
                >
                  {/* 根据点赞状态判断显示文本 */}
                  {comment.liked ? '取消赞' : '赞'} ({comment.like_count || 0})
                </button>
                {/* 点击回复按钮时切换 replyingTo 状态 */}
                <button onClick={() => setReplyingTo(replyingTo === comment.comment_id ? null : comment.comment_id)} className={userModeStyles.replyButton}>
                  {replyingTo === comment.comment_id ? '取消回复' : '回复'}
              </button>
            </div>

              {/* 回复输入框 */}
            {replyingTo === comment.comment_id && (
                   <div className={userModeStyles.replyInputArea}>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                         placeholder={`回复 ${comment.username}...`}
                         className={userModeStyles.commentInput}
                    />
                      <button onClick={() => handleReplySubmit(comment.comment_id)} className={userModeStyles.commentButton}> 
                         提交回复
                      </button>
                 </div>
            )}

              {/* 递归渲染回复，层级加1 */}
            {comment.replies && comment.replies.length > 0 && (
                <div className={userModeStyles.repliesList}> 
                  {renderComments(comment.replies, level + 1)}
              </div>
            )}
          </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <Layout><p className={utilStyles.loading}>加载中...</p></Layout>;
  }

  if (!post) {
    return <Layout><p className={utilStyles.loading}>加载中...</p></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>{post?.title ? `${post.title} - 帖子详情` : '帖子详情'}</title>
      </Head>

      {/* 使用userModeStyles.container和.variableContainer作为主容器 */}
      <div className={`${userModeStyles.container} ${userModeStyles.variableContainer}`}> 
        <main className={userModeStyles.mainContent}> {/* 应用userModeStyles.mainContent */}

          {/* 帖子主体 */}
          <div className={userModeStyles.postCard}> {/* Apply userModeStyles for post card appearance */}
            <div className={userModeStyles.postHeader}> {/* Apply userModeStyles for post header */}
              <h1 className={userModeStyles.postTitle}> {/* Apply userModeStyles for post title */}
                {post.title}
              </h1>
              <div className={userModeStyles.postMeta}> {/* Apply userModeStyles for post meta */}
                <span>作者: {post.username}</span>
                <span>频道: {post.section_name || '未分类'}</span>
              </div>
              <div className={userModeStyles.postMeta}> {/* Separate div for time and comments to match image */}
                 <span>发布于: {formatDate(post.post_time)}</span>
                 <span>评论: {comments.length}</span>
              </div>
            </div>
            <div className={userModeStyles.postContent}> {/* Apply userModeStyles for post content */}
              {post.content}
            </div>
             <div className={userModeStyles.postActions}> {/* Apply userModeStyles for post actions */}
               {/* 点赞按钮 */}
          <button 
            onClick={handleLike} 
                 className={`${userModeStyles.likeButton} ${liked ? userModeStyles.active : ''}`} /* 根据 liked 状态添加 active 类 */
                 key={`post-like-${liked}-${likeCount}`} // 添加 key 属性
          >
                  {liked ? '取消赞' : '赞'} ({likeCount})
          </button>
               {/* 查看评论按钮 */}
               {/* 图片中的"查看评论"看起来像一个文字链接，我们使用一个样式类似的按钮 */}
               <button className={userModeStyles.replyButton}>查看评论 ({comments.length})</button>
               {/* 删除帖子按钮，仅作者可见 */}
               {currentUser && currentUser.user_id === post?.user_id && (
                 <button className={userModeStyles.deleteButton}>删除帖子</button>
               )}
        </div>
      </div>

          {/* 评论区 */}
          <div className={userModeStyles.commentSection}> {/* Apply userModeStyles for comment section */}
            <div className={userModeStyles.commentInputArea}> {/* Apply userModeStyles for comment input area */}
          <textarea
                value={newComment} // Corrected: Use newComment for the main comment input
                onChange={(e) => setNewComment(e.target.value)} // Corrected: Use setNewComment
                placeholder="发表你的评论..."
                className={userModeStyles.commentInput}
          />
              <button onClick={handleComment} className={userModeStyles.commentButton}> {/* Corrected: Call handleComment for top-level comments */}
                发表评论
              </button>
        </div>

            <h3 className={userModeStyles.commentsTitle}>评论 ({comments.length})</h3>
            {loading ? (
              <p className={utilStyles.loading}>加载评论中...</p>
            ) : comments.length > 0 ? (
            renderComments(comments)
          ) : (
              <div className={userModeStyles.emptyState}>
            <p>暂无评论。</p>
              </div>
          )}

          </div>

        </main>
      </div>

      {/* 可能的Toast或其他全局组件 */}
    </Layout>
  );
}
