import { useCallback, useEffect, useState } from "react";
import api, { getApiErrorMessage, isUnauthorizedError } from "./client";

export const usePosts = ({ accountId, onCurrentUserChange, token }) => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleError = useCallback((apiError, fallbackMessage, options = {}) => {
    const { alertUser = false, log = false } = options;

    if (isUnauthorizedError(apiError)) return false;

    setError(apiError);

    if (log) {
      console.error(apiError);
    }

    if (alertUser) {
      alert(getApiErrorMessage(apiError, fallbackMessage));
    }

    return true;
  }, []);

  const syncCurrentUserFromPosts = useCallback((nextPosts) => {
    const myData = nextPosts.find(p => (p.user?.account_id === accountId || p.user?.accountId === accountId));

    if (!myData) return;

    const user = myData.user;
    onCurrentUserChange?.({
      bio: user.bio,
      followersCount: user.followers_count ?? 0,
      followingCount: user.following_count ?? 0
    });
  }, [accountId, onCurrentUserChange]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/api/posts.json");

      if (Array.isArray(response.data)) {
        setPosts(response.data);
        syncCurrentUserFromPosts(response.data);
      }

      return response.data;
    } catch (apiError) {
      handleError(apiError, undefined, { log: true });
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, syncCurrentUserFromPosts]);

  const createPost = useCallback(async (post, options = {}) => {
    const {
      alertUser = true,
      fallbackMessage = "投稿に失敗しました。",
      resetContent = false,
      rethrow = false
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/posts.json", { post });

      if (resetContent) {
        setContent("");
      }

      await fetchPosts();
      return response.data;
    } catch (apiError) {
      handleError(apiError, fallbackMessage, { alertUser });

      if (rethrow) {
        throw apiError;
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPosts, handleError]);

  const deletePost = useCallback(async (id, options = {}) => {
    const { fallbackMessage = "削除に失敗しました。" } = options;

    setLoading(true);
    setError(null);

    try {
      await api.delete(`/api/posts/${id}.json`);
      await fetchPosts();
      return true;
    } catch (apiError) {
      handleError(apiError, fallbackMessage, { alertUser: true });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPosts, handleError]);

  useEffect(() => {
    if (token) {
      fetchPosts();
    } else {
      setPosts([]);
      setContent("");
      setError(null);
      setLoading(false);
    }
  }, [fetchPosts, token]);

  return {
    content,
    createPost,
    deletePost,
    error,
    fetchPosts,
    loading,
    posts,
    setContent,
    setPosts
  };
};
