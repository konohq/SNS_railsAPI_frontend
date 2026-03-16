import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json"
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")

  config.headers["Accept"] = "application/json";
  config.headers["Content-Type"] = "application/json";


if (token) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return config;
})

export default api