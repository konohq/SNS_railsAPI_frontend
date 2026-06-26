import { useState } from "react";
import api, { extractAuthToken, getApiErrorMessage } from "../api/client";

const AuthForm = ({ onAuthSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [accountId, setAccountId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isSignup ? "/users.json" : "/users/sign_in.json";

    try {
      const payload = isSignup ? { user: { email, password, username, account_id: accountId } } : { user: { email, password } };
      const res = await api.post(endpoint, payload);
      const newToken = extractAuthToken(res.headers.authorization) || res.data?.token;

      if (newToken) {
        onAuthSuccess({
          token: newToken,
          user: res.data.user || res.data
        });
      }
    } catch (error) {
      alert(getApiErrorMessage(error, "認証に失敗しました。"));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 border border-gray-800 p-10 rounded-3xl bg-[#16181c]/50">
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
};

export default AuthForm;
