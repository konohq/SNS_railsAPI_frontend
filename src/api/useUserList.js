import { useCallback, useState } from "react";
import api from "./client";
import { useFollow } from "./useFollow";

export const useUserList = ({ accountId, fetchPosts, onApiError, posts }) => {
  const [userList, setUserList] = useState([]);
  const [listTitle, setListTitle] = useState("");
  const [showListModal, setShowListModal] = useState(false);
  const { toggleFollow: toggleFollowRequest } = useFollow({ fetchPosts, onApiError });

  const fetchUserList = useCallback(async (type) => {
    try {
      const myPost = posts.find(p => (p.user?.account_id === accountId || p.user?.accountId === accountId));
      if (!myPost) { alert("ユーザー情報の取得に失敗しました。"); return; }
      const userId = myPost.user.id;
      const endpoint = type === "following" ? `/api/users/${userId}/following.json` : `/api/users/${userId}/followers.json`;
      const res = await api.get(endpoint);
      setUserList(res.data);
      setListTitle(type === "following" ? "フォロー中" : "フォロワー");
      setShowListModal(true);
    } catch (err) {
      onApiError(err, "リストの取得に失敗しました。");
    }
  }, [accountId, onApiError, posts]);

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
