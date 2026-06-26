import { memo } from "react";

const ProfileEditForm = ({
  avatarInputId,
  bio,
  onAvatarChange,
  onCancel,
  onSave,
  onSetAccountId,
  onSetBio,
  onSetUsername,
  username,
  accountId
}) => (
  <div className="mt-4 px-4 space-y-4">
    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none focus:border-[#1d9bf0]" value={username} onChange={e => onSetUsername(e.target.value)} placeholder="表示名" />
    <input className="w-full bg-black border border-gray-700 p-2 rounded outline-none focus:border-[#1d9bf0]" value={accountId} onChange={e => onSetAccountId(e.target.value)} placeholder="ユーザーID" />
    <textarea className="w-full bg-black border border-gray-700 p-2 rounded outline-none h-24 resize-none focus:border-[#1d9bf0]" value={bio} onChange={e => onSetBio(e.target.value)} placeholder="自己紹介" />
    <label htmlFor={avatarInputId} className="inline-block bg-white text-black px-4 py-2 rounded-full font-bold text-sm cursor-pointer hover:bg-gray-200">
      画像を変更
      <input id={avatarInputId} type="file" className="hidden" accept="image/*" onChange={onAvatarChange} />
    </label>
    <div className="flex gap-2">
      <button onClick={onSave} className="bg-[#1d9bf0] text-white px-4 py-2 rounded-full font-bold flex-1">保存</button>
      <button onClick={onCancel} className="border border-gray-600 px-4 py-2 rounded-full flex-1 text-white hover:bg-white/5">キャンセル</button>
    </div>
  </div>
);

export default memo(ProfileEditForm);
