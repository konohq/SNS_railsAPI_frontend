import { useEffect, useState } from "react";
import api from "./client"; 

function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {

    const fetchPosts = async () => {
      try {
        const response = await api.get("http://localhost:3000/api/posts/1/comments");
        setPosts(response.data);
        console.log("届いたデータ:", response.data);
      } catch (error) {
        console.error("通信失敗...", error);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div>
      <h1>ホーム画面</h1>
      {posts.map((post) => (
        <div key={post.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <p>{post.content}</p>
          <small>投稿者ID: {post.user_id}</small>
        </div>
      ))}
    </div>
  );
}

export default Home;