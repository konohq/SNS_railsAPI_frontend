import { useCallback } from "react";
import api from "./client";

export const useFollow = ({ fetchPosts, onApiError }) => {
  const toggleFollow = useCallback(async (targetUserId, isFollowing) => {
    try {
      if (isFollowing) {
        await api.delete(`/api/relationships/${targetUserId}.json`);
      } else {
        await api.post("/api/relationships.json", { followed_id: targetUserId });
      }

      await fetchPosts();
      return true;
    } catch (err) {
      onApiError(err, "フォロー操作に失敗しました。");
      return false;
    }
  }, [fetchPosts, onApiError]);

  return { toggleFollow };
};
