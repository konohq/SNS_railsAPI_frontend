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

  // ユーザー情報
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [accountId, setAccountId] = useState(localStorage.getItem("accountId") || "");
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("avatarUrl") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // プロフィール編集用
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // --- ヘルパー関数: 画像パスをフルURLに変換 ---
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    return `${API_BASE_URL}${path}`;
  };

  const apiClient = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      }
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

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("user[username]", editUsername);
      formData.append("user[account_id]", editAccountId);
      if (editAvatarFile) {
        formData.append("user[avatar]", editAvatarFile);
      }

      const res = await apiClient.put("/api/profile.json", formData);
      const u = res.data;
      
      setUsername(u.username);
      setAccountId(u.account_id);
      const newAvatar = u.avatar_url || u.avatarUrl;
      setAvatarUrl(newAvatar);
      
      localStorage.setItem("username", u.username);
      localStorage.setItem("accountId", u.account_id);
      localStorage.setItem("avatarUrl", newAvatar || "");

      setIsEditingProfile(false);
      setAvatarPreview(null);
      setEditAvatarFile(null);
      fetchPosts();
    } catch (err) {
      alert("更新に失敗しました。Rails側の設定（permit）を確認してください。");
    }
  };

  // --- 投稿アイテムコンポーネント ---
  const PostItem = ({ post }) => {
    // 各投稿ごとの状態管理
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");

    // いいね機能
    const toggleLike = async () => {
      try {
        if (post.isLikedByMe) {
          await apiClient.delete(`/api/posts/${post.id}/likes.json`); // いいね解除のルーティングに合わせて変更してください
        } else {
          await apiClient.post(`/api/posts/${post.id}/likes.json`);
        }
        fetchPosts(); // 更新後に再取得
      } catch (err) {
        console.error("いいねの処理に失敗しました", err);
      }
    };

    // コメント送信機能
    const submitComment = async (e) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      try {
        await apiClient.post(`/api/posts/${post.id}/comments.json`, { comment: { content: commentText } });
        setCommentText("");
        fetchPosts(); // 更新後に再取得
      } catch (err) {
        alert("コメントの送信に失敗しました");
      }
    };

    return (
      <article className="p-4 flex gap-3 border-b border-gray-800 hover:bg-white/[0.02] group transition-colors">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
          {(post.user?.avatar_url || post.user?.avatarUrl) && (
            <img 
              src={getFullUrl(post.user.avatar_url || post.user.avatarUrl)} 
              className="w-full h-full object-cover" 
              alt="avatar" 
            />
          )}
        </div>
        <div className="min-w-0 flex-grow">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center min-w-0">
              <span className="font-bold truncate">{post.user?.username}</span>
              <span className="text-gray-500 text-sm truncate">@{post.user?.account_id}</span>
            </div>
            {post.user?.account_id === accountId && (
              <button onClick={() => deletePost(post.id)} className="text-gray-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                <i className="fa-solid fa-trash"></i>
              </button>
            )}
          </div>
          <p className="mt-1 text-gray-100 break-words leading-relaxed">{post.content}</p>
          
          {/* いいね＆コメントボタン */}
          <div className="flex gap-6 mt-3 text-gray-500">
            <button 
              onClick={toggleLike} 
              className={`flex items-center gap-2 transition-colors hover:text-pink-500 ${post.isLikedByMe ? "text-pink-500" : ""}`}
            >
              <i className={`${post.isLikedByMe ? "fa-solid" : "fa-regular"} fa-heart`}></i>
              <span className="text-sm">{post.likesCount || 0}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)} 
              className="flex items-center gap-2 hover:text-[#1d9bf0] transition-colors"
            >
              <i className="fa-regular fa-comment"></i>
              <span className="text-sm">{post.comments?.length || 0}</span>
            </button>
          </div>

          {/* コメントセクション */}
          {showComments && (
            <div className="mt-4 border-t border-gray-800 pt-3">
              {/* コメント一覧 */}
              <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map(c => (
                    <div key={c.id} className="bg-white/[0.02] p-2 rounded flex gap-2">
                      <span className="font-bold text-sm text-gray-300 whitespace-nowrap">{c.user?.username}:</span>
                      <span className="text-sm text-gray-200 break-words">{c.content}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-600 italic">コメントはまだありません</p>
                )}
              </div>
              
              {/* コメント入力フォーム */}
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  type="text"
                  className="flex-grow bg-transparent border border-gray-700 rounded-full px-4 py-1.5 text-sm outline-none focus:border-[#1d9bf0]"
                  placeholder="返信をポスト..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!commentText.trim()} 
                  className="text-[#1d9bf0] font-bold text-sm px-3 disabled:opacity-50 hover:bg-[#1d9bf0]/10 rounded-full transition"
                >
                  返信
                </button>
              </form>
            </div>
          )}
        </div>
      </article>
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const endpoint = isSignup ? "/users.json" : "/users/sign_in.json";
          try {
            const res = await axios.post(`${API_BASE_URL}${endpoint}`, { user: { email, password, username, account_id: accountId } });
            const newToken = res.headers['authorization']?.split(' ')[1] || res.data?.token;
            if (newToken) {
              localStorage.setItem("token", newToken); setToken(newToken);
              const u = res.data.user || res.data;
              setUsername(u.username); setAccountId(u.account_id);
              localStorage.setItem("username", u.username); localStorage.setItem("accountId", u.account_id);
              localStorage.setItem("avatarUrl", u.avatar_url || u.avatarUrl || "");
              
              // ログイン・新規登録成功時にホーム画面へ強制遷移
              setView("home"); 
            }
          } catch (error) { alert("認証に失敗しました。"); }
        }} className="w-full max-w-sm space-y-4 border border-gray-800 p-10 rounded-3xl shadow-2xl bg-[#16181c]/50">
          <h2 className="text-4xl font-black text-center mb-8 tracking-tighter italic">SNS</h2>
          {isSignup && (
            <><input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="ユーザーID (saitou123)" value={accountId} onChange={e => setAccountId(e.target.value)} />
            <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="表示名 (さいとう)" value={username} onChange={e => setUsername(e.target.value)} /></>
          )}
          <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="メールアドレス" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" placeholder="パスワード" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-white text-black p-3 rounded-full font-bold hover:bg-gray-200 transition text-lg mt-4">
            {isSignup ? "アカウント作成" : "ログイン"}
          </button>
          <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-[#1d9bf0] text-sm w-full text-center hover:underline pt-2">
            {isSignup ? "ログインはこちら" : "新規登録はこちら"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center font-sans">
      <div className="max-w-[1200px] w-full flex">
        {/* 左サイドバー */}
        <aside className="w-[240px] sticky top-0 h-screen p-4 flex flex-col justify-between border-r border-gray-800">
          <div className="space-y-4 pt-4">
            <button onClick={() => setView("home")} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 transition flex items-center gap-4 ${view === "home" ? "font-bold" : ""}`}>
              <i className="fa-solid fa-house"></i>ホーム
            </button>
            <button onClick={() => { setView("profile"); setIsEditingProfile(false); }} className={`w-full text-left p-3 rounded-full text-xl hover:bg-white/10 transition flex items-center gap-4 ${view === "profile" ? "font-bold" : ""}`}>
              <i className="fa-solid fa-user"></i>プロフィール
            </button>
          </div>
          <button onClick={() => { localStorage.clear(); setToken(null); }} className="p-3 hover:bg-white/10 rounded-full text-gray-500 text-left mb-4 font-bold transition">ログアウト</button>
        </aside>

        {/* メイン */}
        <main className="flex-grow border-r border-gray-800 max-w-[600px]">
          <div className="p-4 border-b border-gray-800 font-bold text-xl sticky top-0 bg-black/80 backdrop-blur z-20">
            {view === "home" ? "ホーム" : "マイプロフィール"}
          </div>

          {view === "home" ? (
            <>
              <div className="p-4 border-b border-gray-800">
                <textarea className="w-full bg-transparent text-xl outline-none resize-none min-h-[100px]" placeholder="いまどうしてる？" value={content} onChange={e => setContent(e.target.value)} />
                <div className="flex justify-end items-center mt-2 pt-3">
                  <span className={`mr-4 text-sm ${content.length > MAX_CHARS ? "text-red-500 font-bold" : "text-gray-500"}`}>{content.length} / {MAX_CHARS}</span>
                  <button disabled={content.length === 0 || content.length > MAX_CHARS} onClick={async () => {
                    await apiClient.post("/api/posts.json", { post: { content } });
                    setContent(""); fetchPosts();
                  }} className="bg-[#1d9bf0] px-6 py-2 rounded-full font-bold hover:bg-[#1a8cd8] transition disabled:opacity-50">投稿する</button>
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
                    <img 
                      src={avatarPreview || getFullUrl(avatarUrl)} 
                      className="w-full h-full object-cover" 
                      alt="avatar" 
                    />
                  </div>
                  {!isEditingProfile && <button onClick={() => { setEditUsername(username); setEditAccountId(accountId); setIsEditingProfile(true); }} className="mb-2 border border-gray-600 px-4 py-1.5 rounded-full font-bold hover:bg-white/10 transition">編集</button>}
                </div>
                {isEditingProfile ? (
                  <div className="mt-4 px-4 space-y-4">
                    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none focus:border-[#1d9bf0]" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="表示名" />
                    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none focus:border-[#1d9bf0]" value={editAccountId} onChange={e => setEditAccountId(e.target.value)} placeholder="ユーザーID" />
                    <label className="inline-block bg-white text-black px-4 py-2 rounded-full font-bold text-sm cursor-pointer hover:bg-gray-200 transition">
                      画像をアップロード
                      <input type="file" className="hidden" accept="image/*" onChange={e => {
                        const f = e.target.files[0];
                        if (f) { setEditAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                      }} />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={handleUpdateProfile} className="bg-[#1d9bf0] text-white px-4 py-2 rounded-full font-bold flex-1 hover:bg-[#1a8cd8] transition">保存</button>
                      <button onClick={() => { setIsEditingProfile(false); setAvatarPreview(null); }} className="border border-gray-600 px-4 py-2 rounded-full flex-1 hover:bg-white/10 transition text-white">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 px-4">
                    <h2 className="text-2xl font-extrabold">{username}</h2>
                    <p className="text-gray-500 text-lg">@{accountId}</p>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-800">{posts.filter(p => p.user?.account_id === accountId).map(p => <PostItem key={p.id} post={p} />)}</div>
            </>
          )}
        </main>

        <aside className="w-[350px] p-4 sticky top-0 h-screen hidden lg:block">
          <div className="bg-[#16181c] rounded-2xl p-6 border border-gray-800 shadow-sm">
            <h2 className="text-xl font-bold mb-4 tracking-tight">今後の実装予定</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 text-gray-400 italic">
                <i className="fa-regular fa-square mt-1"></i>
                <span>通知機能（いいね・コメント時のプッシュ通知）</span>
              </li>
              <li className="flex gap-3 text-gray-400 italic">
                <i className="fa-regular fa-square mt-1"></i>
                <span>メッセージ機能（ユーザー間のDM）</span>
              </li>
              <li className="flex gap-3 text-gray-400 italic">
                <i className="fa-regular fa-square mt-1"></i>
                <span>トレンド機能（ハッシュタグ集計）</span>
              </li>
              <li className="flex gap-3 text-gray-400 italic">
                <i className="fa-regular fa-square mt-1"></i>
                <span>検索機能（ユーザー名・投稿内容）</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 text-gray-600 text-[11px] px-4 uppercase tracking-widest">
            Developed with React & Ruby on Rails
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;