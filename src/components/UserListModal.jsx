import { memo } from "react";

const UserListModal = ({
  accountId,
  getFullUrl,
  isOpen,
  onClose,
  onToggleFollow,
  title,
  users
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-black border border-gray-800 w-full max-w-md rounded-2xl max-h-[70vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black">
          <h3 className="font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="overflow-y-auto flex-grow divide-y divide-gray-900">
          {users.length === 0 ? <p className="p-10 text-center text-gray-500">まだ誰もいません</p> :
            users.map(user => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    {(user.avatarUrl || user.avatar_url) && <img src={getFullUrl(user.avatarUrl || user.avatar_url)} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div>
                    <div className="font-bold">{user.username}</div>
                    <div className="text-gray-500 text-sm">@{user.account_id || user.accountId}</div>
                  </div>
                </div>
                {(user.account_id !== accountId && user.accountId !== accountId) && (
                  <button onClick={() => onToggleFollow(user.id, user.is_followed_by_me)} className={`px-4 py-1 rounded-full text-xs font-bold border transition ${user.is_followed_by_me ? "border-gray-600 text-white" : "bg-white text-black"}`}>
                    {user.is_followed_by_me ? "フォロー中" : "フォロー"}
                  </button>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default memo(UserListModal);
