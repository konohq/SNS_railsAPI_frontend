import { useCallback, useState } from "react";
import api from "./client";
import { useFollow } from "./useFollow";

export const useUserList = ({ currentUserId, fetchPosts, onApiError }) => {
  const [userList, setUserList] = useState([]);
  const [listTitle, setListTitle] = useState("");
  const [showListModal, setShowListModal] = useState(false);
  const { toggleFollow: toggleFollowRequest } = useFollow({ fetchPosts, onApiError });

  const fetchUserList = useCallback(async (type) => {
    if (!currentUserId) {
      alert("ユーザー情報の取得に失敗しました。");
      return;
    }

    try {
      const endpoint = type === "following"
        ? `/api/users/${currentUserId}/following.json`
        : `/api/users/${currentUserId}/followers.json`;
      const res = await api.get(endpoint);
      setUserList(res.data);
      setListTitle(type === "following" ? "フォロー中" : "フォロワー");
      setShowListModal(true);
    } catch (err) {
      onApiError(err, "リストの取得に失敗しました。");
    }
  }, [currentUserId, onApiError]);

  const closeUserListModal = useCallback(() => {
    setShowListModal(false);
  }, []);

  const resetUserList = useCallback(() => {
    setUserList([]);
    setListTitle("");
    setShowListModal(false);
  }, []);

  const toggleFollow = useCallback(async (targetUserId, isFollowing) => {
    const succeeded = await toggleFollowRequest(targetUserId, isFollowing);

    if (succeeded && showListModal) {
      setUserList(prev => prev.map(u => u.id === targetUserId ? { ...u, is_followed_by_me: !isFollowing } : u));
    }
  }, [showListModal, toggleFollowRequest]);

  return {
    closeUserListModal,
    fetchUserList,
    listTitle,
    resetUserList,
    showListModal,
    toggleFollow,
    userList
  };
};
