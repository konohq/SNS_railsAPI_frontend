import { useState } from "react";
import api from "./client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/users/sign_in", {
        user: { email, password }
      });

      const token = response.headers.authorization;
      if (token) {
        localStorage.setItem("token", token);
        window.location.href = "/";
      }
    } catch (error) {
      alert("ログイン失敗！メアドかパスが違います。");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
        <h2 className="text-3xl font-bold text-center mb-8">Twitterにログイン</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="メールアドレス"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="パスワード"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-black text-white p-3 rounded-full font-bold hover:bg-gray-800 transition">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;