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
  const [bio, setBio] = useState(localStorage.getItem("bio") || ""); // ✅ 自己紹介のState追加
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // プロフィール編集用
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editBio, setEditBio] = useState(""); // ✅ 編集用自己紹介のState追加
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // 画像パス変換ヘルパー
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

  useEffect(() => { if (token) fetchPosts(); }, [token, apiClient]);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get("/api/posts.json");
      if (Array.isArray(response.data)) setPosts(response.data);
    } catch (error) { console.error(error); }
  };

  const deletePost = async (id) => {
    if (!window.confirm("この投稿を削除しますか？")) return;
    try {
      await apiClient.delete(`/api/posts/${id}.json`);
      fetchPosts();
    } catch (error) { alert("削除に失敗しました"); }
  };

  // ✅ プロフィール更新
  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("user[username]", editUsername);
      formData.append("user[account_id]", editAccountId);
      formData.append("user[bio]", editBio); // ✅ FormDataに自己紹介を追加
      if (editAvatarFile) {
        formData.append("user[avatar]", editAvatarFile);
      }

      const res = await apiClient.put("/api/profile.json", formData);
      const u = res.data; 

      const updatedAvatar = u.avatarUrl || u.avatar_url;
      const updatedUsername = u.username;
      const updatedAccountId = u.accountId || u.account_id;
      const updatedBio = u.bio; // ✅ Railsから返ってきたBio

      // State更新
      setUsername(updatedUsername);
      setAccountId(updatedAccountId);
      setAvatarUrl(updatedAvatar);
      setBio(updatedBio);
      
      // LocalStorage同期
      localStorage.setItem("username", updatedUsername);
      localStorage.setItem("accountId", updatedAccountId);
      localStorage.setItem("avatarUrl", updatedAvatar || "");
      localStorage.setItem("bio", updatedBio || ""); // ✅ 保存

      setIsEditingProfile(false);
      setAvatarPreview(null);
      setEditAvatarFile(null);

      fetchPosts();
    } catch (err) {
      alert("更新に失敗しました。");
    }
  };

  const PostItem = ({ post }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");

    const toggleLike = async () => {
      try {
        post.isLikedByMe ? await apiClient.delete(`/api/posts/${post.id}/likes.json`) : await apiClient.post(`/api/posts/${post.id}/likes.json`);
        fetchPosts();
      } catch (err) { console.error(err); }
    };

    const submitComment = async (e) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      try {
        await apiClient.post(`/api/posts/${post.id}/comments.json`, { comment: { content: commentText } });
        setCommentText("");
        fetchPosts();
      } catch (err) { alert("失敗"); }
    };

    return (
      <article className="p-4 flex gap-3 border-b border-gray-800 hover:bg-white/[0.02] group transition-colors">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
          {(post.user?.avatarUrl || post.user?.avatar_url) && (
            <img src={getFullUrl(post.user.avatarUrl || post.user.avatar_url)} className="w-full h-full object-cover" alt="avatar" />
          )}
        </div>
        <div className="min-w-0 flex-grow">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center min-w-0">
              <span className="font-bold truncate">{post.user?.username}</span>
              <span className="text-gray-500 text-sm truncate">@{post.user?.accountId || post.user?.account_id}</span>
            </div>
            {(post.user?.accountId === accountId || post.user?.account_id === accountId) && (
              <button onClick={() => deletePost(post.id)} className="text-gray-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100"><i className="fa-solid fa-trash"></i></button>
            )}
          </div>
          <p className="mt-1 text-gray-100 break-words leading-relaxed">{post.content}</p>
          <div className="flex gap-6 mt-3 text-gray-500">
            <button onClick={toggleLike} className={`flex items-center gap-2 hover:text-pink-500 ${post.isLikedByMe ? "text-pink-500" : ""}`}>
              <i className={`${post.isLikedByMe ? "fa-solid" : "fa-regular"} fa-heart`}></i>
              <span className="text-sm">{post.likesCount || 0}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 hover:text-[#1d9bf0]">
              <i className="fa-regular fa-comment"></i>
              <span className="text-sm">{post.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      </article>
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const endpoint = isSignup ? "/users.json" : "/users/sign_in.json";
          try {
            const res = await axios.post(`${API_BASE_URL}${endpoint}`, { user: { email, password, username, account_id: accountId } });
            const newToken = res.headers['authorization']?.split(' ')[1] || res.data?.token;
            if (newToken) {
              localStorage.setItem("token", newToken); setToken(newToken);
              const u = res.data.user || res.data;
              const av = u.avatarUrl || u.avatar_url;
              const b = u.bio || ""; // ✅ ログイン時にBioを取得
              
              setUsername(u.username); 
              setAccountId(u.accountId || u.account_id); 
              setAvatarUrl(av);
              setBio(b);

              localStorage.setItem("username", u.username);
              localStorage.setItem("accountId", u.accountId || u.account_id);
              localStorage.setItem("avatarUrl", av || "");
              localStorage.setItem("bio", b);
              setView("home"); 
            }
          } catch (error) { alert("認証失敗"); }
        }} className="w-full max-w-sm space-y-4 border border-gray-800 p-10 rounded-3xl bg-[#16181c]/50">
          <h2 className="text-4xl font-black text-center mb-8 italic">SNS</h2>
          {isSignup && (
            <><input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none" placeholder="ユーザーID" value={accountId} onChange={e => setAccountId(e.target.value)} />
            <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none" placeholder="表示名" value={username} onChange={e => setUsername(e.target.value)} /></>
          )}
          <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none" placeholder="メール" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none" placeholder="パスワード" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-white text-black p-3 rounded-full font-bold">ログイン</button>
          <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-[#1d9bf0] text-sm w-full text-center mt-2">{isSignup ? "ログインへ" : "新規登録へ"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="max-w-[1200px] w-full flex">
        <aside className="w-[240px] sticky top-0 h-screen p-4 flex flex-col justify-between border-r border-gray-800">
          <div className="space-y-4 pt-4">
            <button onClick={() => setView("home")} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 flex items-center gap-4 ${view === "home" ? "font-bold" : ""}`}><i className="fa-solid fa-house"></i>ホーム</button>
            <button onClick={() => { setView("profile"); setIsEditingProfile(false); }} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 flex items-center gap-4 ${view === "profile" ? "font-bold" : ""}`}><i className="fa-solid fa-user"></i>プロフィール</button>
          </div>
          <button onClick={() => { localStorage.clear(); setToken(null); }} className="p-3 hover:bg-white/10 rounded-full text-gray-500 mb-4 font-bold">ログアウト</button>
        </aside>

        <main className="flex-grow border-r border-gray-800 max-w-[600px]">
          <div className="p-4 border-b border-gray-800 font-bold text-xl sticky top-0 bg-black/80 backdrop-blur z-20">{view === "home" ? "ホーム" : "マイプロフィール"}</div>

          {view === "home" ? (
            <>
              <div className="p-4 border-b border-gray-800 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {avatarUrl && <img src={getFullUrl(avatarUrl)} className="w-full h-full object-cover" alt="me" />}
                </div>
                <div className="flex-grow">
                  <textarea className="w-full bg-transparent text-xl outline-none resize-none min-h-[100px]" placeholder="いまどうしてる？" value={content} onChange={e => setContent(e.target.value)} />
                  <div className="flex justify-end mt-2 pt-3 border-t border-gray-900">
                    <button disabled={content.length === 0} onClick={async () => {
                      await apiClient.post("/api/posts.json", { post: { content } });
                      setContent(""); fetchPosts();
                    }} className="bg-[#1d9bf0] px-6 py-2 rounded-full font-bold disabled:opacity-50">投稿する</button>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-800">{posts.map(p => <PostItem key={p.id} post={p} />)}</div>
            </>
          ) : (
            <>
              <div className="border-b border-gray-800 pb-4">
                <div className="h-32 bg-[#2f3336]"></div>
                <div className="px-4 flex justify-between items-end relative">
                  <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden border-4 border-black -mt-16 z-10 shadow-lg bg-black">
                    {(avatarPreview || avatarUrl) && (
                      <img src={avatarPreview || getFullUrl(avatarUrl)} className="w-full h-full object-cover" alt="profile" />
                    )}
                  </div>
                  {!isEditingProfile && (
                    <button onClick={() => { 
                      setEditUsername(username); 
                      setEditAccountId(accountId); 
                      setEditBio(bio); // ✅ 編集開始時に現在のBioをセット
                      setIsEditingProfile(true); 
                    }} className="mb-2 border border-gray-600 px-4 py-1.5 rounded-full font-bold">編集</button>
                  )}
                </div>
                
                {isEditingProfile ? (
                  <div className="mt-4 px-4 space-y-4">
                    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="表示名" />
                    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none" value={editAccountId} onChange={e => setEditAccountId(e.target.value)} placeholder="ユーザーID" />
                    
                    {/* ✅ 自己紹介の入力欄追加 */}
                    <textarea 
                      className="w-full bg-black border border-gray-700 p-2 rounded outline-none h-24 resize-none" 
                      value={editBio} 
                      onChange={e => setEditBio(e.target.value)} 
                      placeholder="自己紹介を入力"
                    />

                    <label className="inline-block bg-white text-black px-4 py-2 rounded-full font-bold text-sm cursor-pointer">
                      画像を変更
                      <input type="file" className="hidden" accept="image/*" onChange={e => {
                        const f = e.target.files[0];
                        if (f) { setEditAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                      }} />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={handleUpdateProfile} className="bg-[#1d9bf0] text-white px-4 py-2 rounded-full font-bold flex-1">保存</button>
                      <button onClick={() => { setIsEditingProfile(false); setAvatarPreview(null); }} className="border border-gray-600 px-4 py-2 rounded-full flex-1 text-white">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 px-4">
                    <h2 className="text-2xl font-extrabold">{username}</h2>
                    <p className="text-gray-500 text-lg">@{accountId}</p>
                    {/* ✅ 自己紹介を表示 */}
                    <p className="mt-3 text-gray-200 whitespace-pre-wrap">{bio || "自己紹介がありません"}</p>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-800">
                {posts.filter(p => (p.user?.accountId === accountId || p.user?.account_id === accountId)).map(p => <PostItem key={p.id} post={p} />)}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;