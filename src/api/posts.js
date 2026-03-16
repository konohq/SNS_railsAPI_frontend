import api from "./client"

export const getPosts = async () => {
  const response = await api.get("/api/posts")
  return response.data
}