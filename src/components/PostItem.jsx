import { memo, useState } from "react";
import api, { getApiErrorMessage, isUnauthorizedError } from "../api/client";

const PostItem = ({
  accountId,
  createPost,
  deletePost,
  fetchPosts,
  getFullUrl,
  onApiError,
  post
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  const isReposted = post.isRepostedByMe || post.is_reposted_by_me;
  const isLiked = post.isLikedByMe || post.is_liked_by_me;

  const handleRepost = async () => {
    if (isReposted) return;

    try {
      await createPost(
        { content: "", repost_id: post.id },
        { alertUser: false, rethrow: true }
      );
    } catch (err) {
      if (isUnauthorizedError(err)) {
        return;
      }

      if (err.status === 422) {
        alert(getApiErrorMessage(err, "既にリポスト済みです"));
      } else {
        alert(getApiErrorMessage(err, "リポストに失敗しました。"));
      }
    }
  };

  const toggleLike = async () => {
    try {
      if (isLiked) {
        await api.delete(`/api/posts/${post.id}/like.json`);
      } else {
        await api.post(`/api/posts/${post.id}/like.json`);
      }

      fetchPosts();
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        console.error("Like error:", getApiErrorMessage(err));
      }
    }
  };

  const submitComment = async () => {
    if (!commentContent) return;

    try {
      await api.post(`/api/posts/${post.id}/comments.json`, { comment: { content: commentContent } });
      setCommentContent("");
      fetchPosts();
    } catch (err) {
      onApiError(err, "リプライの送信に失敗しました。");
    }
  };

  return (
    <div className="border-b border-gray-800">
      <article className="p-4 flex gap-3 hover:bg-white/[0.02] group transition-colors text-left">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
          {(post.user?.avatarUrl || post.user?.avatar_url) && <img src={getFullUrl(post.user.avatarUrl || post.user.avatar_url)} className="w-full h-full object-cover" alt="avatar" />}
        </div>
        <div className="min-w-0 flex-grow">
          {/* --- リポストラベル --- */}
          {post.repost && !post.content && (
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-1">
              <i className="fa-solid fa-retweet"></i>
              <span>{post.user?.username}さんがリポストしました</span>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center min-w-0">
              <span className="font-bold truncate">{post.user?.username}</span>
              <span className="text-gray-500 text-sm truncate">@{post.user?.accountId || post.user?.account_id}</span>
            </div>
            {(post.user?.accountId === accountId || post.user?.account_id === accountId) && (
              <button onClick={() => deletePost(post.id)} className="text-gray-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100"><i className="fa-solid fa-trash"></i></button>
            )}
          </div>

          {/* 本文 */}
          {post.content && <p className="mt-1 text-gray-100 break-words leading-relaxed">{post.content}</p>}

          {/* --- リポスト元カード --- */}
          {post.repost && (
            <div className="mt-2 border border-gray-800 rounded-2xl p-3 hover:bg-white/[0.03] transition">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden">
                  {(post.repost.user?.avatarUrl || post.repost.user?.avatar_url) && <img src={getFullUrl(post.repost.user.avatarUrl || post.repost.user.avatar_url)} className="w-full h-full object-cover" alt="" />}
                </div>
                <span className="font-bold text-sm">{post.repost.user?.username}</span>
                <span className="text-gray-500 text-xs">@{post.repost.user?.accountId || post.repost.user?.account_id}</span>
              </div>
              <p className="text-sm text-gray-300">{post.repost.content}</p>
            </div>
          )}

          <div className="flex gap-6 mt-3 text-gray-500">
            {/* いいね */}
            <button onClick={toggleLike} className={`flex items-center gap-2 hover:text-pink-500 ${isLiked ? "text-pink-500" : ""}`}>
              <i className={`${isLiked ? "fa-solid" : "fa-regular"} fa-heart`}></i>
              <span className="text-sm">{post.likesCount || 0}</span>
            </button>

            {/* リポスト */}
            <button
              onClick={handleRepost}
              disabled={isReposted}
              className={`flex items-center gap-2 transition ${isReposted ? "text-green-500 cursor-default" : "hover:text-green-500"}`}
            >
              <i className="fa-solid fa-retweet"></i>
              <span className="text-sm">{isReposted ? "リポスト済み" : ""}</span>
            </button>

            {/* コメント表示切り替え */}
            <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 hover:text-[#1d9bf0] ${showComments ? "text-[#1d9bf0]" : ""}`}>
              <i className="fa-regular fa-comment"></i>
              <span className="text-sm">{post.commentsCount || post.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      </article>

      {showComments && (
        <div className="bg-white/[0.01] pb-2 text-left">
          <div className="px-14 py-2 border-b border-gray-900 flex gap-2">
            <input className="flex-grow bg-transparent border-b border-gray-800 outline-none text-sm p-1 focus:border-[#1d9bf0]" placeholder="返信をツイート" value={commentContent} onChange={e => setCommentContent(e.target.value)} />
            <button onClick={submitComment} className="bg-[#1d9bf0] text-white px-3 py-1 rounded-full text-xs font-bold">返信</button>
          </div>
          <div className="divide-y divide-gray-900">
            {(post.comments || []).map(c => (
              <div key={c.id} className="px-14 py-3 flex gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                  {(c.user?.avatar_url || c.user?.avatarUrl) && <img src={getFullUrl(c.user.avatar_url || c.user.avatarUrl)} className="w-full h-full object-cover" alt="" />}
                </div>
                <div>
                  <div className="flex gap-2 items-center text-xs">
                    <span className="font-bold text-gray-200">{c.user?.username}</span>
                    <span className="text-gray-500">@{c.user?.account_id || c.user?.accountId}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(PostItem);
