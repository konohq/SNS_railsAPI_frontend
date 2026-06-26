import React, { useCallback, useEffect, useState } from "react";
import api, {
  API_BASE_URL,
  getApiErrorMessage,
  isUnauthorizedError
} from "./client";
import { useAuth } from "./auth";
import { usePosts } from "./usePosts";
import AuthForm from "../components/AuthForm";
import PostItem from "../components/PostItem";
import UserListModal from "../components/UserListModal";

const MAX_CHARS = 140;

function App() {
  const { login, logout, token } = useAuth();
  const [view, setView] = useState("home");

  // --- ユーザー情報 ---
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [accountId, setAccountId] = useState(localStorage.getItem("accountId") || "");
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("avatarUrl") || "");
  const [bio, setBio] = useState(localStorage.getItem("bio") || "");

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

  const getFullUrl = useCallback((path) => {
    if (!path || path === "null" || path === "undefined") return null;
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    return `${API_BASE_URL}${path}`;
  }, []);

  const syncCurrentUserFromPost = useCallback((user) => {
    setFollowingCount(user.followingCount);
    setFollowersCount(user.followersCount);
    if (user.bio !== undefined) setBio(user.bio);
  }, []);

  const {
    content,
    createPost,
    deletePost: deletePostApi,
    fetchPosts,
    posts,
    setContent
  } = usePosts({
    accountId,
    onCurrentUserChange: syncCurrentUserFromPost,
    token
  });

  const resetUserState = useCallback(() => {
    setUsername("");
    setAccountId("");
    setAvatarUrl("");
    setBio("");
    setFollowingCount(0);
    setFollowersCount(0);
    setUserList([]);
    setListTitle("");
    setShowListModal(false);
    setIsEditingProfile(false);
    setEditUsername("");
    setEditAccountId("");
    setEditBio("");
    setEditAvatarFile(null);
    setAvatarPreview(null);
    setView("home");
  }, []);

  const alertApiError = useCallback((error, fallbackMessage) => {
    if (isUnauthorizedError(error)) return;

    alert(getApiErrorMessage(error, fallbackMessage));
  }, []);

  const handleAuthSuccess = useCallback(({ token: newToken, user }) => {
    login(newToken);
    setUsername(user.username || "");
    setAccountId(user.account_id || user.accountId || "");
    setAvatarUrl(user.avatar_url || user.avatarUrl || "");
    setBio(user.bio || "");
    localStorage.setItem("username", user.username || "");
    localStorage.setItem("accountId", user.account_id || user.accountId || "");
    localStorage.setItem("avatarUrl", user.avatar_url || user.avatarUrl || "");
    localStorage.setItem("bio", user.bio || "");
    setView("home");
  }, [login]);

  useEffect(() => {
    if (!token) {
      const resetTimer = window.setTimeout(resetUserState, 0);
      return () => window.clearTimeout(resetTimer);
    }
  }, [token, resetUserState]);

  const fetchUserList = async (type) => {
    try {
      const myPost = posts.find(p => (p.user?.account_id === accountId || p.user?.accountId === accountId));
      if (!myPost) { alert("ユーザー情報の取得に失敗しました。"); return; }
      const userId = myPost.user.id;
      const endpoint = type === "following" ? `/api/users/${userId}/following.json` : `/api/users/${userId}/followers.json`;
      const res = await api.get(endpoint);
      setUserList(res.data);
      setListTitle(type === "following" ? "フォロー中" : "フォロワー");
      setShowListModal(true);
    } catch (err) { alertApiError(err, "リストの取得に失敗しました。"); }
  };

  const deletePost = useCallback(async (id) => {
    if (!window.confirm("この投稿を削除しますか？")) return;
    await deletePostApi(id, { fallbackMessage: "削除に失敗しました。" });
  }, [deletePostApi]);

  const closeUserListModal = useCallback(() => {
    setShowListModal(false);
  }, []);

  const toggleFollow = useCallback(async (targetUserId, isFollowing) => {
    try {
      if (isFollowing) {
        await api.delete(`/api/relationships/${targetUserId}.json`);
      } else {
        await api.post("/api/relationships.json", { followed_id: targetUserId });
      }
      fetchPosts();
      if (showListModal) {
        setUserList(prev => prev.map(u => u.id === targetUserId ? { ...u, is_followed_by_me: !isFollowing } : u));
      }
    } catch (err) { alertApiError(err, "フォロー操作に失敗しました。"); }
  }, [alertApiError, fetchPosts, showListModal]);

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("user[username]", editUsername);
      formData.append("user[account_id]", editAccountId);
      formData.append("user[bio]", editBio);
      if (editAvatarFile) { formData.append("user[avatar]", editAvatarFile); }
      const res = await api.put("/api/profile.json", formData);
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
    } catch (err) { alertApiError(err, "更新に失敗しました。"); }
  };

  // --- 未ログイン時 ---
  if (!token) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // --- ログイン後メインUI ---
  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <UserListModal
        accountId={accountId}
        getFullUrl={getFullUrl}
        isOpen={showListModal}
        onClose={closeUserListModal}
        onToggleFollow={toggleFollow}
        title={listTitle}
        users={userList}
      />
      <div className="max-w-[1200px] w-full flex">
        {/* 左サイドバー */}
        <aside className="w-[240px] sticky top-0 h-screen p-4 flex flex-col justify-between border-r border-gray-800">
          <div className="space-y-4 pt-4 text-left">
            <button onClick={() => setView("home")} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 flex items-center gap-4 ${view === "home" ? "font-bold" : ""}`}><i className="fa-solid fa-house"></i>ホーム</button>
            <button onClick={() => { setView("profile"); setIsEditingProfile(false); }} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 flex items-center gap-4 ${view === "profile" ? "font-bold" : ""}`}><i className="fa-solid fa-user"></i>プロフィール</button>
          </div>
          <button onClick={logout} className="p-3 hover:bg-white/10 rounded-full text-gray-500 mb-4 font-bold flex items-center gap-2"><i className="fa-solid fa-right-from-bracket"></i>ログアウト</button>
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
                      await createPost(
                        { content },
                        { fallbackMessage: "投稿に失敗しました。", resetContent: true }
                      );
                    }} className="bg-[#1d9bf0] px-6 py-2 rounded-full font-bold disabled:opacity-50 hover:bg-[#1a8cd8]">投稿する</button>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-800">{posts.map(p => (
                <PostItem
                  key={p.id}
                  accountId={accountId}
                  createPost={createPost}
                  deletePost={deletePost}
                  fetchPosts={fetchPosts}
                  getFullUrl={getFullUrl}
                  onApiError={alertApiError}
                  post={p}
                />
              ))}</div>
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
              <div className="divide-y divide-gray-800">{posts.filter(p => (p.user?.accountId === accountId || p.user?.account_id === accountId)).map(p => (
                <PostItem
                  key={p.id}
                  accountId={accountId}
                  createPost={createPost}
                  deletePost={deletePost}
                  fetchPosts={fetchPosts}
                  getFullUrl={getFullUrl}
                  onApiError={alertApiError}
                  post={p}
                />
              ))}</div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
