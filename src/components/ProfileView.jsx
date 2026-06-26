import { memo, useCallback, useId, useState } from "react";
import api from "../api/client";
import ProfileEditForm from "./ProfileEditForm";

const ProfileView = ({
  accountId,
  avatarUrl,
  bio,
  fetchPosts,
  followersCount,
  followingCount,
  getFullUrl,
  onApiError,
  onProfileUpdated,
  onShowUserList,
  username
}) => {
  const avatarInputId = useId();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const startEditing = useCallback(() => {
    setEditUsername(username);
    setEditAccountId(accountId);
    setEditBio(bio);
    setIsEditingProfile(true);
  }, [accountId, bio, username]);

  const cancelEditing = useCallback(() => {
    setIsEditingProfile(false);
    setAvatarPreview(null);
    setEditAvatarFile(null);
  }, []);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];

    if (file) {
      setEditAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("user[username]", editUsername);
      formData.append("user[account_id]", editAccountId);
      formData.append("user[bio]", editBio);
      if (editAvatarFile) { formData.append("user[avatar]", editAvatarFile); }
      const res = await api.put("/api/profile.json", formData);

      onProfileUpdated(res.data);
      setIsEditingProfile(false);
      setAvatarPreview(null);
      setEditAvatarFile(null);
      fetchPosts();
    } catch (err) {
      onApiError(err, "更新に失敗しました。");
    }
  };

  return (
    <div className="border-b border-gray-800 pb-4 text-left">
      <div className="h-32 bg-[#2f3336]"></div>
      <div className="px-4 flex justify-between items-end relative">
        <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden border-4 border-black -mt-16 z-10 shadow-lg bg-black">
          {(avatarPreview || avatarUrl) && <img src={avatarPreview || getFullUrl(avatarUrl)} className="w-full h-full object-cover" alt="profile" />}
        </div>
        {!isEditingProfile && <button onClick={startEditing} className="mb-2 border border-gray-600 px-4 py-1.5 rounded-full font-bold hover:bg-white/10 transition text-white">編集</button>}
      </div>
      {isEditingProfile ? (
        <ProfileEditForm
          accountId={editAccountId}
          avatarInputId={avatarInputId}
          bio={editBio}
          onAvatarChange={handleAvatarChange}
          onCancel={cancelEditing}
          onSave={handleUpdateProfile}
          onSetAccountId={setEditAccountId}
          onSetBio={setEditBio}
          onSetUsername={setEditUsername}
          username={editUsername}
        />
      ) : (
        <div className="mt-4 px-4">
          <h2 className="text-2xl font-extrabold text-white">{username}</h2>
          <p className="text-gray-500 text-lg">@{accountId}</p>
          <div className="flex gap-5 mt-3 text-sm">
            <div onClick={() => onShowUserList("following")} className="flex gap-1 hover:underline cursor-pointer"><span className="font-bold text-white">{followingCount}</span><span className="text-gray-500">フォロー中</span></div>
            <div onClick={() => onShowUserList("followers")} className="flex gap-1 hover:underline cursor-pointer"><span className="font-bold text-white">{followersCount}</span><span className="text-gray-500">フォロワー</span></div>
          </div>
          <p className="mt-3 text-gray-200 whitespace-pre-wrap">{bio || "自己紹介がありません"}</p>
        </div>
      )}
    </div>
  );
};

export default memo(ProfileView);
