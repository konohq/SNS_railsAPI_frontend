import { useEffect, useState } from "react";
import api from "./client";

function App() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [accountId, setAccountId] = useState("");

  // RailsにJSONであることを教えるためのエンドポイント
  const authEndpoint = isSignup ? "/users.json" : "/users/sign_in.json";

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      const response = await api.get("http://localhost:3000/api/posts.json");
      if (Array.isArray(response.data)) setPosts(response.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const payload = { 
      user: isSignup 
        ? { email, password, password_confirmation: password, username, account_id: accountId }
        : { email, password }
    };
    try {
      const response = await api.post(`http://localhost:3000${authEndpoint}`, payload);
      console.log("全ヘッダー:", response.headers);
      const newToken = response.headers['authorization']; 
      if (newToken) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setEmail(""); setPassword(""); setAccountId(""); setUsername("");
      }
    } catch (error) {
      alert("認証に失敗しました。入力内容を確認してください。");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setPosts([]);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const response = await api.post("http://localhost:3000/api/posts.json", { 
        post: { content } 
      });
      setPosts([response.data, ...posts]);
      setContent("");
    } catch (error) {
      alert("投稿に失敗しました。ログインし直してみてください。");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("この投稿を削除しますか？")) return;
    try {
      await api.delete(`http://localhost:3000/api/posts/${postId}.json`);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      alert("削除に失敗しました。");
    }
  };

  // ログイン・新規登録画面
  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white w-full">
        <div className="w-full max-w-[400px] p-8 border border-gray-800 rounded-2xl">
          <h2 className="text-2xl font-bold text-center mb-8">いま起きていることを見届けよう</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignup && (
              <>
                <input type="text" placeholder="ユーザーID (@id)" className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" value={accountId} onChange={(e) => setAccountId(e.target.value)} required />
                <input type="text" placeholder="表示名" className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </>
            )}
            <input type="email" placeholder="メールアドレス" className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="パスワード" className="w-full p-3 bg-transparent border border-gray-800 rounded outline-none focus:border-[#1d9bf0]" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="w-full bg-white text-black p-3 rounded-full font-bold hover:bg-gray-200 transition">
              {isSignup ? "アカウント作成" : "ログイン"}
            </button>
          </form>
          <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-4 text-[#1d9bf0] text-sm hover:underline">
            {isSignup ? "ログインはこちら" : "アカウントをお持ちでない方はこちら"}
          </button>
        </div>
      </div>
    );
  }

  // メイン画面（中央寄せX風レイアウト）
  return (
    <div className="min-h-screen bg-black text-white font-sans w-full">
      <main className="w-full max-w-[600px] mx-auto border-x border-gray-800 min-h-screen">
        <header className="sticky top-0 bg-black/80 backdrop-blur-md z-10 p-4 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold">ホーム</h1>
          <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-white transition">
            ログアウト
          </button>
        </header>

        <div className="p-4 border-b border-gray-800">
          <form onSubmit={handlePostSubmit}>
            <textarea
              className="w-full text-xl placeholder-gray-600 outline-none resize-none py-2 bg-transparent text-white"
              placeholder="いまどうしてる？"
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end pt-2 border-t border-gray-800 mt-2">
              <button 
                type="submit" 
                disabled={!content.trim() || loading} 
                className={`bg-[#1d9bf0] text-white px-5 py-2 rounded-full font-bold transition ${(!content.trim() || loading) ? 'opacity-50' : 'hover:bg-[#1a8cd8]'}`}
              >
                {loading ? '...' : '投稿する'}
              </button>
            </div>
          </form>
        </div>

        <div className="divide-y divide-gray-800">
          {posts.map((post) => (
            <article key={post.id} className="p-4 hover:bg-white/[0.03] transition flex flex-col gap-1 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[15px]">
                  <span className="font-bold hover:underline text-white">{post.user?.username || "user"}</span>
                  <span className="text-gray-500 text-sm">@{post.user?.account_id || "id"}</span>
                  <span className="text-gray-500 text-sm">· {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <button onClick={() => handleDeletePost(post.id)} className="text-gray-600 hover:text-red-500 transition">
                  🗑️
                </button>
              </div>
              <p className="text-[15px] leading-normal text-gray-100 whitespace-pre-wrap">{post.content}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;