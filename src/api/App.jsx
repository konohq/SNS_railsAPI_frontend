import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:3000";
const MAX_CHARS = 140;

function App() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isSignup, setIsSignup] = useState(false);
  const [view, setView] = useState("home");

  // --- ユーザー情報 ---
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [accountId, setAccountId] = useState(localStorage.getItem("accountId") || "");
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("avatarUrl") || "");
  const [bio, setBio] = useState(localStorage.getItem("bio") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [followingCount, setFollowingCount] = useState(Number(localStorage.getItem("followingCount")) || 0);
  const [followersCount, setFollowersCount] = useState(Number(localStorage.getItem("followersCount")) || 0);

  const [userList, setUserList] = useState([]);
  const [listTitle, setListTitle] = useState("");
  const [showListModal, setShowListModal] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const getFullUrl = (path) => {
    if (!path || path === "null" || path === "undefined") return null;
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    return `${API_BASE_URL}${path}`;
  };

  const apiClient = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: token ? `Bearer ${token}` : "" }
    });
  }, [token]);

  useEffect(() => {
    if (token) fetchPosts();
  }, [token, apiClient]);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get("/api/posts.json");
      if (Array.isArray(response.data)) {
        setPosts(response.data);
        const myData = response.data.find(p => (p.user?.account_id === accountId || p.user?.accountId === accountId));
        if (myData) {
          const u = myData.user;
          setFollowingCount(u.following_count ?? 0);
          setFollowersCount(u.followers_count ?? 0);
          if (u.bio !== undefined) setBio(u.bio);
        }
      }
    } catch (error) { console.error(error); }
  };

  const fetchUserList = async (type) => {
    try {
      const myPost = posts.find(p => (p.user?.account_id === accountId || p.user?.accountId === accountId));
      if (!myPost) { alert("ユーザー情報の取得に失敗しました。"); return; }
      const userId = myPost.user.id;
      const endpoint = type === "following" ? `/api/users/${userId}/following.json` : `/api/users/${userId}/followers.json`;
      const res = await apiClient.get(endpoint);
      setUserList(res.data);
      setListTitle(type === "following" ? "フォロー中" : "フォロワー");
      setShowListModal(true);
    } catch (err) { alert("リストの取得に失敗しました。"); }
  };

  const deletePost = async (id) => {
    if (!window.confirm("この投稿を削除しますか？")) return;
    try {
      await apiClient.delete(`/api/posts/${id}.json`);
      fetchPosts();
    } catch (error) { alert("削除に失敗しました"); }
  };

  const toggleFollow = async (targetUserId, isFollowing) => {
    try {
      if (isFollowing) {
        await apiClient.delete(`/api/relationships/${targetUserId}.json`);
      } else {
        await apiClient.post("/api/relationships.json", { followed_id: targetUserId });
      }
      fetchPosts();
      if (showListModal) {
        setUserList(prev => prev.map(u => u.id === targetUserId ? { ...u, is_followed_by_me: !isFollowing } : u));
      }
    } catch (err) { alert("フォロー操作に失敗しました。"); }
  };

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("user[username]", editUsername);
      formData.append("user[account_id]", editAccountId);
      formData.append("user[bio]", editBio);
      if (editAvatarFile) { formData.append("user[avatar]", editAvatarFile); }
      const res = await apiClient.put("/api/profile.json", formData);
      const u = res.data;
      setUsername(u.username || "");
      setAccountId(u.account_id || u.accountId || "");
      setAvatarUrl(u.avatar_url || u.avatarUrl || "");
      setBio(u.bio || "");
      localStorage.setItem("username", u.username || "");
      localStorage.setItem("accountId", u.account_id || u.accountId || "");
      localStorage.setItem("avatarUrl", u.avatar_url || u.avatarUrl || "");
      localStorage.setItem("bio", u.bio || "");
      setIsEditingProfile(false);
      setAvatarPreview(null);
      setEditAvatarFile(null);
      fetchPosts();
    } catch (err) { alert("更新に失敗しました。"); }
  };

  // --- モーダル ---
  const UserListModal = () => (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowListModal(false)}>
      <div className="bg-black border border-gray-800 w-full max-w-md rounded-2xl max-h-[70vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black">
          <h3 className="font-bold text-xl">{listTitle}</h3>
          <button onClick={() => setShowListModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="overflow-y-auto flex-grow divide-y divide-gray-900">
          {userList.length === 0 ? <p className="p-10 text-center text-gray-500">まだ誰もいません</p> :
            userList.map(user => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    {(user.avatarUrl || user.avatar_url) && <img src={getFullUrl(user.avatarUrl || user.avatar_url)} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div>
                    <div className="font-bold">{user.username}</div>
                    <div className="text-gray-500 text-sm">@{user.account_id || user.accountId}</div>
                  </div>
                </div>
                {(user.account_id !== accountId && user.accountId !== accountId) && (
                  <button onClick={() => toggleFollow(user.id, user.is_followed_by_me)} className={`px-4 py-1 rounded-full text-xs font-bold border transition ${user.is_followed_by_me ? "border-gray-600 text-white" : "bg-white text-black"}`}>
                    {user.is_followed_by_me ? "フォロー中" : "フォロー"}
                  </button>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );

  const PostItem = ({ post }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentContent, setCommentContent] = useState("");

    const isReposted = post.isRepostedByMe || post.is_reposted_by_me;
    const isLiked = post.isLikedByMe || post.is_liked_by_me;

    const handleRepost = async () => {
      if (isReposted) return;
      try {
        await apiClient.post("/api/posts.json", { post: { content: "", repost_id: post.id } });
        fetchPosts();
      } catch (err) { 
        if (err.response?.status === 422) {
          alert("既にリポスト済みです");
        } else {
          alert("リポストに失敗しました"); 
        }
      }
    };

    const toggleLike = async () => {
      try {
        if (isLiked) {
          await apiClient.delete(`/api/posts/${post.id}/like.json`);
        } else {
          await apiClient.post(`/api/posts/${post.id}/like.json`);
        }
        fetchPosts();
      } catch (err) { console.error("Like error:", err); }
    };

    const submitComment = async () => {
      if (!commentContent) return;
      try {
        await apiClient.post(`/api/posts/${post.id}/comments.json`, { comment: { content: commentContent } });
        setCommentContent("");
        fetchPosts();
      } catch (err) { alert("リプライの送信に失敗しました"); }
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

  // --- 未ログイン時 ---
  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const endpoint = isSignup ? "/users.json" : "/users/sign_in.json";
          try {
            const payload = isSignup ? { user: { email, password, username, account_id: accountId } } : { user: { email, password } };
            const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
            const newToken = res.headers['authorization']?.split(' ')[1] || res.data?.token;
            if (newToken) {
              localStorage.setItem("token", newToken); setToken(newToken);
              const u = res.data.user || res.data;
              setUsername(u.username || ""); setAccountId(u.account_id || u.accountId || ""); setAvatarUrl(u.avatar_url || u.avatarUrl || ""); setBio(u.bio || "");
              localStorage.setItem("username", u.username || ""); localStorage.setItem("accountId", u.account_id || u.accountId || ""); localStorage.setItem("avatarUrl", u.avatar_url || u.avatarUrl || ""); localStorage.setItem("bio", u.bio || "");
              setView("home");
            }
          } catch (error) { alert("認証に失敗しました。"); }
        }} className="w-full max-w-sm space-y-4 border border-gray-800 p-10 rounded-3xl bg-[#16181c]/50">
          <h2 className="text-4xl font-black text-center mb-8 italic text-white">SNS</h2>
          {isSignup && (
            <>
              <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="ユーザーID" value={accountId} onChange={e => setAccountId(e.target.value)} />
              <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="表示名" value={username} onChange={e => setUsername(e.target.value)} />
            </>
          )}
          <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="メール" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="パスワード" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-white text-black p-3 rounded-full font-bold hover:bg-gray-200 transition">{isSignup ? "新規登録" : "ログイン"}</button>
          <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-[#1d9bf0] text-sm w-full text-center mt-2">{isSignup ? "アカウントをお持ちの方" : "初めての方"}</button>
        </form>
      </div>
    );
  }

  // --- ログイン後メインUI ---
  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      {showListModal && <UserListModal />}
      <div className="max-w-[1200px] w-full flex">
        {/* 左サイドバー */}
        <aside className="w-[240px] sticky top-0 h-screen p-4 flex flex-col justify-between border-r border-gray-800">
          <div className="space-y-4 pt-4 text-left">
            <button onClick={() => setView("home")} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 flex items-center gap-4 ${view === "home" ? "font-bold" : ""}`}><i className="fa-solid fa-house"></i>ホーム</button>
            <button onClick={() => { setView("profile"); setIsEditingProfile(false); }} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 flex items-center gap-4 ${view === "profile" ? "font-bold" : ""}`}><i className="fa-solid fa-user"></i>プロフィール</button>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-3 hover:bg-white/10 rounded-full text-gray-500 mb-4 font-bold flex items-center gap-2"><i className="fa-solid fa-right-from-bracket"></i>ログアウト</button>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-grow border-r border-gray-800 max-w-[600px]">
          <div className="p-4 border-b border-gray-800 font-bold text-xl sticky top-0 bg-black/80 backdrop-blur z-20 text-left">
            {view === "home" ? "ホーム" : "マイプロフィール"}
          </div>

          {view === "home" ? (
            <>
              {/* 投稿フォーム */}
              <div className="p-4 border-b border-gray-800 flex gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {avatarUrl && <img src={getFullUrl(avatarUrl)} className="w-full h-full object-cover" alt="me" />}
                </div>
                <div className="flex-grow">
                  <textarea className="w-full bg-transparent text-xl outline-none resize-none min-h-[100px]" placeholder="いまどうしてる？" value={content} onChange={e => setContent(e.target.value)} />
                  <div className="flex justify-end mt-2 pt-3 border-t border-gray-900">
                    <button disabled={content.length === 0} onClick={async () => {
                      await apiClient.post("/api/posts.json", { post: { content } });
                      setContent(""); fetchPosts();
                    }} className="bg-[#1d9bf0] px-6 py-2 rounded-full font-bold disabled:opacity-50 hover:bg-[#1a8cd8]">投稿する</button>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-800">{posts.map(p => <PostItem key={p.id} post={p} />)}</div>
            </>
          ) : (
            <>
              {/* プロフィール詳細 */}
              <div className="border-b border-gray-800 pb-4 text-left">
                <div className="h-32 bg-[#2f3336]"></div>
                <div className="px-4 flex justify-between items-end relative">
                  <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden border-4 border-black -mt-16 z-10 shadow-lg bg-black">
                    {(avatarPreview || avatarUrl) && <img src={avatarPreview || getFullUrl(avatarUrl)} className="w-full h-full object-cover" alt="profile" />}
                  </div>
                  {!isEditingProfile && <button onClick={() => { setEditUsername(username); setEditAccountId(accountId); setEditBio(bio); setIsEditingProfile(true); }} className="mb-2 border border-gray-600 px-4 py-1.5 rounded-full font-bold hover:bg-white/10 transition text-white">編集</button>}
                </div>
                {isEditingProfile ? (
                  <div className="mt-4 px-4 space-y-4">
                    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none focus:border-[#1d9bf0]" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="表示名" />
                    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none focus:border-[#1d9bf0]" value={editAccountId} onChange={e => setEditAccountId(e.target.value)} placeholder="ユーザーID" />
                    <textarea className="w-full bg-black border border-gray-700 p-2 rounded outline-none h-24 resize-none focus:border-[#1d9bf0]" value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="自己紹介" />
                    <label className="inline-block bg-white text-black px-4 py-2 rounded-full font-bold text-sm cursor-pointer hover:bg-gray-200">
                      画像を変更
                      <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setEditAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={handleUpdateProfile} className="bg-[#1d9bf0] text-white px-4 py-2 rounded-full font-bold flex-1">保存</button>
                      <button onClick={() => { setIsEditingProfile(false); setAvatarPreview(null); }} className="border border-gray-600 px-4 py-2 rounded-full flex-1 text-white hover:bg-white/5">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 px-4">
                    <h2 className="text-2xl font-extrabold text-white">{username}</h2>
                    <p className="text-gray-500 text-lg">@{accountId}</p>
                    <div className="flex gap-5 mt-3 text-sm">
                      <div onClick={() => fetchUserList("following")} className="flex gap-1 hover:underline cursor-pointer"><span className="font-bold text-white">{followingCount}</span><span className="text-gray-500">フォロー中</span></div>
                      <div onClick={() => fetchUserList("followers")} className="flex gap-1 hover:underline cursor-pointer"><span className="font-bold text-white">{followersCount}</span><span className="text-gray-500">フォロワー</span></div>
                    </div>
                    <p className="mt-3 text-gray-200 whitespace-pre-wrap">{bio || "自己紹介がありません"}</p>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-800">{posts.filter(p => (p.user?.accountId === accountId || p.user?.account_id === accountId)).map(p => <PostItem key={p.id} post={p} />)}</div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;