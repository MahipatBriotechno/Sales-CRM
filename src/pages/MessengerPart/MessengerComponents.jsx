import React from "react";
import {
  Phone,
  Video,
  Info,
  Check,
  CheckCheck,
  Send,
  Paperclip,
  Smile,
  ImageIcon,
  File,
  X,
  Search,
  MessageCircle,
  Mail,
  Camera,
  Mic,
  User as UserIcon,
  MoreVertical,
  Copy,
  Forward,
  Trash2,
  Edit3,
  Star,
  Pin,
  Bell,
  BellOff,
  Volume2,
  Clock,
  Download,
  Reply,
  ArrowLeft,
  FileText,
  Video as VideoIcon,
  MapPin,
  MessageSquare,
  Square,
  Plus,
  Users,
  User,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

const handleDownload = async (url, fileName) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback to basic open if fetch fails
    window.open(url, '_blank');
  }
};

// Contacts List Component
export function ContactsList({ contacts, selectedChat, onChatSelect }) {
  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white font-primary">
        <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mb-4 transition-all duration-300">
          <Search className="text-[#FF7B1D]" size={28} />
        </div>
        <p className="text-sm font-bold text-gray-800">No contacts found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-[180px] font-medium">
          Start a new conversation to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="py-3 px-3 space-y-1">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onChatSelect(contact)}
            className={`p-3 rounded-xl cursor-pointer transition-all duration-300 relative group border ${selectedChat?.id === contact.id
              ? "bg-orange-50/20 border-[#FF7B1D] shadow-sm"
              : "hover:bg-gray-50 bg-white border-transparent"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm transition-all duration-300 group-hover:shadow-md ${contact.status === "online"
                    ? "bg-gradient-to-tr from-[#FF7B1D] to-[#E66A0D]"
                    : "bg-gray-300"
                    }`}
                >
                  {contact.avatar}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${contact.status === "online"
                    ? "bg-green-500"
                    : "bg-gray-400"
                    }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`text-sm font-semibold truncate ${selectedChat?.id === contact.id ? "text-black" : "text-gray-800"
                    }`}>
                    {contact.name}
                  </h3>
                  <span className={`text-[12px] font-semibold whitespace-nowrap ${selectedChat?.id === contact.id ? "text-[#FF7B1D]" : "text-[#FF7B1D]"}`}>
                    {contact.time}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedChat?.id === contact.id ? "text-[#FF7B1D]" : "text-gray-400"}`}>
                      {contact.role}
                    </span>
                    <p className={`text-xs truncate font-medium ${selectedChat?.id === contact.id ? "text-black" : "text-gray-500"}`}>
                      {contact.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  {contact.unread > 0 && (
                    <div className="bg-[#FF7B1D] text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-sm">
                      {contact.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chat Header Component
export function ChatHeader({
  selectedChat,
  showChatInfo,
  onToggleChatInfo,
  notifications,
  setNotifications,
  chatSearchQuery,
  setChatSearchQuery,
  pinnedMessage,
}) {
  return (
    <>
      <div className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b-2 border-orange-50/80 shadow-sm font-primary">
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer group" onClick={onToggleChatInfo}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF7B1D] to-[#E66A0D] flex items-center justify-center text-base font-bold text-white shadow-sm transition-all duration-300 group-hover:shadow-md">
              {selectedChat.avatar}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${selectedChat.status === "online"
                ? "bg-green-500"
                : "bg-gray-400"
                }`}
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              {selectedChat.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${selectedChat.status === "online" ? "text-green-600" : "text-gray-400"
                }`}>
                {selectedChat.status === "online" ? "Online" : selectedChat.status}
              </span>
              <span className="text-gray-200">|</span>
              <span className="text-[10px] font-bold text-[#FF7B1D] uppercase tracking-wider">{selectedChat.role}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Internal Search */}
          <div className="relative hidden md:block group">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FF7B1D] opacity-60 group-focus-within:opacity-100 transition-opacity"
              size={13}
            />
            <input
              type="text"
              placeholder="Search chat..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-xs bg-orange-50/30 border-2 border-orange-100/50 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF7B1D] w-48 transition-all font-semibold text-black placeholder:text-[#FF7B1D]/40"
            />
            {chatSearchQuery && (
              <button
                onClick={() => setChatSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-gray-100 mx-2"></div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setNotifications(!notifications)}
              className={`p-2.5 rounded-lg transition-all border ${notifications
                ? "text-[#FF7B1D] border-orange-100 bg-orange-50 hover:bg-[#FF7B1D] hover:text-white"
                : "text-white bg-[#FF7B1D] border-[#FF7B1D] shadow-sm"
                }`}
              title={notifications ? "Mute" : "Unmute"}
            >
              {notifications ? <Bell size={18} /> : <BellOff size={18} />}
            </button>

            <button
              onClick={onToggleChatInfo}
              className={`p-2.5 rounded-lg transition-all border ${showChatInfo
                ? "bg-[#FF7B1D] text-white shadow-md shadow-[#FF7B1D]/20 border-[#FF7B1D]"
                : "text-[#FF7B1D] border-orange-100 bg-orange-50 hover:bg-[#FF7B1D] hover:text-white font-bold"
                }`}
            >
              <Info size={18} />
            </button>
          </div>
        </div>
      </div>

      {pinnedMessage && (
        <div className="bg-orange-50 border-b border-orange-100 px-6 py-2 flex items-center gap-3 animate-slideDown">
          <div className="p-1.5 bg-[#FF7B1D] rounded-md text-white">
            <Pin size={10} fill="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">
              Pinned
            </p>
            <p className="text-xs text-orange-800 truncate font-medium">
              {pinnedMessage.text}
            </p>
          </div>
          <button className="text-[10px] font-bold text-orange-600 hover:text-orange-900 uppercase tracking-wider px-2 py-1">
            Jump
          </button>
        </div>
      )}
    </>
  );
}

// Chat Messages Component
export function ChatMessages({
  messages,
  typingIndicator,
  selectedChatId,
  messagesEndRef,
  showMessageMenu,
  setShowMessageMenu,
  showReactionPicker,
  setShowReactionPicker,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onStar,
  onPin,
  onForward,
  starredMessages,
  currentUserId,
  currentUserType,
  selectedChatType,
}) {
  const reactions = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  return (
    <div className="px-6 py-6 bg-[#fcfcfc] min-h-full custom-scrollbar">
      <div className="space-y-6">
        {messages.map((msg, idx) => {
          const isMe = !!((Number(msg.sender_id) === Number(currentUserId) && msg.sender_type === currentUserType) || msg.sender === "me");
          const showTime = !!(idx === 0 || (messages[idx - 1] && messages[idx - 1].time !== msg.time));

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start animate-fadeIn"}`}>
              {showTime && (
                <div className="w-full flex justify-center my-6">
                  <span className="px-4 py-1.5 bg-orange-50 border border-orange-100 text-[10px] font-bold text-[#FF7B1D] uppercase tracking-wider rounded-full shadow-sm">
                    {msg.time || 'Just now'}
                  </span>
                </div>
              )}

              <div className={`flex max-w-[85%] md:max-w-[75%] gap-2 group/msg ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {!isMe && (
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[10px] font-bold text-[#FF7B1D] shadow-sm uppercase group-hover:shadow transition-all duration-300">
                      {msg.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || "?"}
                    </div>
                  </div>
                )}

                <div className="relative group/bubble flex flex-col">
                  {/* Sender Name for Team/Group Chats - Only show for the first message in a group */}
                  {!isMe && selectedChatType === 'team' && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id) && (
                    <span className="text-[10px] font-bold text-[#FF7B1D] mb-1 ml-1 uppercase tracking-wider break-words">
                      {msg.sender_name || 'Unknown'}
                    </span>
                  )}
                  {/* Reply Preview */}
                  {msg.replyTo && (
                    <div className={`mb-1 px-3 py-2 rounded-xl text-xs flex border transition-all ${isMe
                      ? "bg-orange-50/20 border-orange-200 text-white italic self-end"
                      : "bg-orange-50/50 border-orange-100 text-black font-medium"
                      }`}>
                      <div className="flex items-start gap-2">
                        <Reply size={12} className="text-[#FF7B1D] mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2 italic break-words">{msg.replyTo.text}</p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl relative transition-all duration-300 border ${isMe
                      ? "bg-gradient-to-br from-[#FF7B1D] to-[#E66A0D] text-white border-[#FF7B1D] rounded-tr-none shadow-md shadow-[#FF7B1D]/20 ml-auto"
                      : "bg-white border-orange-100 text-black rounded-tl-none shadow-sm shadow-orange-500/5 group-hover/msg:border-orange-200"
                      }`}
                  >
                    {/* Forwarded */}
                    {!!msg.is_forwarded && (
                      <div className={`flex items-center gap-1 mb-1 opacity-70 ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                        <Forward size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-wider italic">Forwarded</span>
                      </div>
                    )}

                    {/* Files Wrapper */}
                    {(msg.file_url || (msg.attachments && msg.attachments.length > 0)) && (
                      <div className="mb-2 space-y-2">
                        {msg.attachments?.map((file, fIdx) => {
                          const isImg = file.message_type === 'image' || file.file_url?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
                          const fUrl = file.file_url?.startsWith('http') ? file.file_url : `${API_BASE_URL.replace(/\/api\/?$/, '')}/${file.file_url}`;

                          if (isImg) {
                            return (
                              <div key={fIdx} className="rounded-xl overflow-hidden cursor-pointer shadow-sm">
                                <img src={fUrl} alt="" className="w-full max-h-60 object-cover" onClick={() => window.open(fUrl, '_blank')} />
                              </div>
                            );
                          }
                          return (
                            <div key={fIdx} className={`flex items-center gap-3 p-2.5 rounded-xl border ${isMe ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'}`}>
                              <FileText size={20} className={isMe ? 'text-white' : 'text-[#FF7B1D]'} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate uppercase">{file.file_name || 'File'}</p>
                                <p className="text-[9px] opacity-70">{file.file_size || '0 KB'}</p>
                              </div>
                              <button onClick={() => window.open(fUrl, '_blank')} className="p-1.5 hover:bg-black/5 rounded-lg">
                                <Download size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className={`text-[14px] leading-relaxed font-medium break-words whitespace-pre-wrap ${/^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/.test(msg.text?.trim()) && msg.text.trim().length <= 4 ? "text-3xl py-1" : ""}`}>
                      {msg.text}
                    </p>

                    <div className={`flex items-center justify-end gap-1.5 mt-1 opacity-60`}>
                      {!!msg.is_edited && <span className="text-[8px] font-bold uppercase italic">Edited</span>}
                      {isMe && (
                        <div className="flex items-center">
                          {msg.is_read ? (
                            <CheckCheck size={12} className="text-white" />
                          ) : msg.is_delivered ? (
                            <CheckCheck size={12} className="text-white/70" />
                          ) : (
                            <Check size={12} className="text-white/50" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-3 flex gap-1 ${isMe ? "right-0" : "left-0"}`}>
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <div key={emoji} className="bg-white border border-gray-100 px-1.5 py-0.5 rounded-full shadow-sm text-[10px] font-bold flex items-center gap-0.5 scale-90">
                            {emoji} <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Pill */}
                  <div className={`flex items-center gap-2 mt-1 px-2 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isMe ? "justify-end" : "justify-start"}`}>
                    <button onClick={() => onReaction(msg.id, "👍")} className="text-gray-400 hover:text-[#FF7B1D]" title="React"><Smile size={14} /></button>
                    <button onClick={() => onReply(msg)} className="text-gray-400 hover:text-[#FF7B1D]" title="Reply"><Reply size={14} /></button>
                    <button onClick={() => onStar(msg.id)} className={`${starredMessages.has(msg.id) ? "text-yellow-400" : "text-gray-400"} hover:text-yellow-500`} title="Star"><Star size={14} fill={starredMessages.has(msg.id) ? "currentColor" : "none"} /></button>
                    <div className="relative message-menu-container">
                      <button onClick={() => setShowMessageMenu(showMessageMenu === msg.id ? null : msg.id)} className="text-gray-400 hover:text-[#FF7B1D]" title="More"><MoreVertical size={14} /></button>

                      {showMessageMenu === msg.id && (
                        <div className={`absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-[160px] z-50 animate-scaleUp`}>
                          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-50 mb-1">
                            {reactions.map(emoji => (
                              <button key={emoji} onClick={() => { onReaction(msg.id, emoji); setShowMessageMenu(null); }} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
                            ))}
                          </div>
                          <button onClick={() => { onReply(msg); setShowMessageMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"><Reply size={14} className="text-gray-400" /> Reply</button>
                          <button onClick={() => { onForward(msg); setShowMessageMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"><Forward size={14} className="text-gray-400" /> Forward</button>
                          <button onClick={() => { onCopy(msg.text); setShowMessageMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"><Copy size={14} className="text-gray-400" /> Copy</button>
                          {isMe && (
                            <>
                              <button onClick={() => { onEdit(msg); setShowMessageMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"><Edit3 size={14} className="text-gray-400" /> Edit</button>
                              <button onClick={() => { onPin(msg.id); setShowMessageMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"><Pin size={14} className="text-gray-400" /> Pin</button>
                              <button onClick={() => { onDelete(msg.id); setShowMessageMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors border-t border-gray-50 mt-1"><Trash2 size={14} /> Delete</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {typingIndicator === selectedChatId && (
          <div className="flex items-end gap-2 animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">TY</div>
            <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
              <span className="w-1 h-1 bg-[#FF7B1D] rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-[#FF7B1D] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1 h-1 bg-[#FF7B1D] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// Chat Info Sidebar Component
export function ChatInfoSidebar({ selectedChat, messages, starredMessages }) {
  const sharedMedia = messages.filter((msg) => (msg.attachments && msg.attachments.length > 0) || msg.file_url).slice(0, 6);
  const starred = messages.filter((msg) => starredMessages.has(msg.id));
  const isTeam = selectedChat?.type === 'team';

  return (
    <div className="w-80 border-l-2 border-orange-50/80 bg-white h-full flex flex-col overflow-hidden animate-slideLeft shadow-sm">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {/* Profile Section */}
          <div className="text-center mb-8 font-primary">
            <div className="relative inline-block mb-4 group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#FF7B1D] to-[#E66A0D] flex items-center justify-center text-3xl font-black text-white mx-auto shadow-lg transition-all duration-300 group-hover:shadow-md">
                {selectedChat.avatar}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${selectedChat.status === "online"
                  ? "bg-green-500"
                  : "bg-gray-400"
                  }`}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mx-auto mt-1.5"></div>
              </div>
            </div>
            <h3 className="text-[18px] font-black text-black leading-tight">
              {selectedChat.name}
            </h3>
            <p className="text-xs text-[#FF7B1D] font-bold uppercase tracking-widest mt-1">
              {selectedChat.role}
            </p>
          </div>

          {/* Core Info Cards */}
          <div className="space-y-4">
            {/* Quick Details Section */}
            {!isTeam ? (
              <div className="bg-orange-50/30 rounded-3xl p-5 border-2 border-orange-50/50 hover:border-orange-100 transition-all group">
                <h4 className="text-[10px] font-bold text-[#FF7B1D] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <User size={12} /> Quick Details
                </h4>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: "Email", value: selectedChat.email },
                    { icon: Phone, label: "Phone", value: selectedChat.phone },
                    { icon: Clock, label: "Timezone", value: "GMT+5:30" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl bg-white border border-orange-50 flex items-center justify-center flex-shrink-0 text-[#FF7B1D] shadow-sm transition-all group-hover:scale-105">
                        <item.icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">{item.label}</p>
                        <p className="text-xs font-semibold text-black truncate break-all leading-tight">{item.value || 'Not provided'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-orange-50/30 rounded-3xl p-5 border-2 border-orange-50/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold text-[#FF7B1D] uppercase tracking-[0.15em] flex items-center gap-2">
                    <Users size={12} /> Group Members
                  </h4>
                  <span className="text-[10px] font-bold bg-[#FF7B1D] text-white px-2 py-0.5 rounded-full shadow-sm">
                    {selectedChat.members?.length || 0}
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3">
                  {selectedChat.members?.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-white/60 rounded-xl hover:bg-white transition-all shadow-none hover:shadow-sm border border-transparent hover:border-orange-50">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600 uppercase shadow-sm">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-black truncate">{member.name}</p>
                        <p className={`text-[8px] font-bold uppercase tracking-wider ${member.role === 'Admin' ? 'text-[#FF7B1D]' : 'text-gray-400'}`}>
                          {member.role === 'Admin' ? 'Team Admin' : 'Member'}
                        </p>
                      </div>
                      {member.status === 'online' && (
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Gallery */}
            <div className="bg-white rounded-3xl p-5 border-2 border-orange-50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={14} className="text-[#FF7B1D]" /> Media & Links
                </h4>
                <button className="text-[10px] font-bold text-[#FF7B1D] hover:underline">View All</button>
              </div>

              {sharedMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.map((msg, i) => {
                    const attachments = msg.attachments || [];
                    const file = attachments[0] || { file_url: msg.file_url, message_type: msg.message_type };
                    const isImg = file.message_type === 'image' || file.file_url?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
                    return (
                      <div key={i} className="aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-pointer group/tile relative border border-gray-100 hover:opacity-80 transition-all">
                        {isImg ? (
                          <img src={file.file_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/tile:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#FF7B1D]">
                            <FileText size={18} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl italic text-gray-400 text-[9px] font-bold uppercase tracking-widest">No shared media</div>
              )}
            </div>

            {/* Starred Messages */}
            <div className="bg-white rounded-3xl p-5 border-2 border-orange-50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" /> Starred Items
                </h4>
                <span className="text-[10px] font-bold text-gray-400">{starred.length}</span>
              </div>
              <div className="space-y-3">
                {starred.length > 0 ? (
                  starred.slice(0, 3).map((msg, i) => (
                    <div key={i} className="p-4 bg-orange-50/20 rounded-2xl border border-orange-50/50 group/star hover:bg-white hover:shadow-md transition-all">
                      <p className="text-xs text-black font-medium line-clamp-2 italic leading-relaxed">"{msg.text}"</p>
                      <p className="text-[9px] font-bold text-[#FF7B1D] mt-2 uppercase tracking-widest">{msg.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 italic text-gray-400 text-[9px] font-bold uppercase tracking-widest">No starred items</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3 pb-8">
              <button className="w-full py-4 px-5 bg-orange-50 border border-orange-100 text-[#FF7B1D] text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[#FF7B1D] hover:text-white transition-all flex items-center justify-center gap-3 group shadow-sm">
                <BellOff size={16} className="group-hover:animate-shake" /> Mute Notifications
              </button>
              <button className="w-full py-4 px-5 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 group shadow-sm">
                <Trash2 size={16} /> Clear History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Input Component
export function ChatInput({
  message,
  setMessage,
  attachedFiles,
  setAttachedFiles,
  showEmojiPicker,
  setShowEmojiPicker,
  showAttachmentMenu,
  setShowAttachmentMenu,
  onSend,
  onFileSelect,
  fileInputRef,
  emojiPickerRef,
  textareaRef,
  attachmentMenuRef,
  isRecording,
  recordingDuration,
  handleVoiceMessage,
  cancelRecording,
  replyingTo,
  cancelReply,
  editingMessage,
  cancelEdit,
}) {
  const emojis = [
    "😊", "😂", "❤️", "👍", "🎉", "🔥", "✨", "💯", "👏", "🙌", "💪", "🎯", "🚀", "💡", "⭐", "🎊",
    "🎈", "🌟", "💝", "🤝", "👌", "✌️", "🙏", "💖", "😍", "🥰", "😘", "😎", "🤗", "🤔", "😅", "😆",
    "🙂", "😉", "😇", "🥳", "😴", "🤩", "😜", "😋", "🤤", "🤯", "🥺", "😭", "😢", "😤", "😡", "🤬",
  ];

  const handleEmojiClick = (emoji) => {
    const editor = textareaRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(emoji);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    setMessage(editor.innerText);
  };

  const handleAttachmentClick = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowAttachmentMenu(false);
  };

  return (
    <div className="bg-white border-t-2 border-orange-50/80 p-4 relative z-40">
      {/* Reply/Edit Banner */}
      {(replyingTo || editingMessage) && (
        <div className="absolute bottom-full left-0 right-0 p-3 bg-orange-50 border-t border-orange-100 flex items-center justify-between animate-slideUp">
          <div className="flex items-center gap-3 px-4">
            <div className="text-[#FF7B1D]">
              {editingMessage ? <Edit3 size={16} /> : <Reply size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">
                {editingMessage ? "Editing" : "Replying"}
              </p>
              <p className="text-xs text-orange-800 truncate font-semibold max-w-md italic">
                {editingMessage ? editingMessage.text : replyingTo?.text}
              </p>
            </div>
          </div>
          <button onClick={editingMessage ? cancelEdit : cancelReply} className="p-1 px-3 text-orange-600 hover:text-orange-800"><X size={14} /></button>
        </div>
      )}

      {/* Media Tray */}
      {attachedFiles.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 p-4 bg-gray-50 border-t border-gray-100 flex gap-3 overflow-x-auto no-scrollbar shadow-inner">
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="relative group flex-shrink-0">
              <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {file.type?.startsWith("image/") ? (
                  <img src={file.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <FileText size={20} className="text-[#FF7B1D]" />
                    <span className="text-[8px] font-bold uppercase truncate px-1 w-full text-center">{file.name}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setAttachedFiles(f => f.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <div className="relative flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 focus-within:border-[#FF7B1D] focus-within:ring-4 focus-within:ring-[#FF7B1D]/10 transition-all shadow-sm">
          <button
            ref={emojiPickerRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-1.5 text-gray-400 hover:text-[#FF7B1D] transition-colors ${showEmojiPicker ? "text-[#FF7B1D]" : ""}`}
          >
            <Smile size={20} />
          </button>

          <div
            ref={textareaRef}
            contentEditable
            onInput={(e) => setMessage(e.currentTarget.innerText)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            className="flex-1 px-2 py-1.5 text-sm focus:outline-none min-h-[36px] max-h-32 overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 font-bold font-primary break-words whitespace-pre-wrap"
            data-placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
          />

          <div className="relative" ref={attachmentMenuRef}>
            <button
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-1.5 text-gray-400 hover:text-[#FF7B1D] transition-colors"
            >
              <Paperclip size={20} />
            </button>

            {showAttachmentMenu && (
              <div className="absolute bottom-full right-0 mb-4 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-4 grid grid-cols-2 gap-2 min-w-[260px] animate-scaleUp z-50">
                {[
                  { icon: ImageIcon, label: "Image", type: "image" },
                  { icon: FileText, label: "File", type: "document" },
                  { icon: VideoIcon, label: "Video", type: "video" },
                  { icon: Camera, label: "Camera", type: "camera" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleAttachmentClick(item.type)}
                    className="flex items-center gap-3 p-2 hover:bg-orange-50 rounded-2xl transition-all group w-full"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7B1D] flex items-center justify-center group-hover:bg-[#FF7B1D] group-hover:text-white transition-all duration-300 flex-shrink-0">
                      <item.icon size={18} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 font-primary group-hover:text-[#FF7B1D] whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-4 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-72 animate-scaleUp z-50">
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto no-scrollbar">
                {emojis.map((e, i) => (
                  <button key={i} onClick={() => handleEmojiClick(e)} className="text-xl p-1 hover:bg-gray-100 rounded-lg">{e}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onSend}
          disabled={!message.trim() && attachedFiles.length === 0}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95 ${message.trim() || attachedFiles.length > 0
            ? "bg-[#FF7B1D] text-white hover:bg-[#E66A0D]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
        >
          <Send size={18} fill="currentColor" />
        </button>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFileSelect} />
    </div>
  );
}

// Empty State Component
export function EmptyState() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col h-full">
      <div className="m-auto flex flex-col items-center justify-center p-6 md:p-12 text-center font-primary w-full max-w-2xl">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 md:mb-8 shadow-inner transition-transform hover:scale-105 duration-500 group flex-shrink-0">
          <MessageCircle className="text-[#FF7B1D] group-hover:rotate-12 transition-transform w-12 h-12 md:w-16 md:h-16" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-black mb-3 tracking-tight">Your Conversations</h2>
        <p className="text-sm md:text-base text-gray-600 max-w-sm font-medium leading-relaxed mb-8 md:mb-10">
          Select a chat to view your message history or start a new connection with your team.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full px-4">
          {[
            { icon: Search, label: "Search Contacts", desc: "Find anyone in your team" },
            { icon: Star, label: "Starred Items", desc: "Access your saved gems" },
          ].map((item, i) => (
            <div key={i} className="bg-white border-2 border-orange-50 p-4 md:p-5 rounded-2xl md:rounded-3xl flex items-center gap-4 hover:border-[#FF7B1D] hover:shadow-xl hover:shadow-orange-500/10 transition-all cursor-pointer group w-full sm:w-64">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF7B1D] group-hover:bg-[#FF7B1D] group-hover:text-white transition-all duration-300 flex-shrink-0">
                <item.icon size={20} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">{item.label}</p>
                <p className="text-[10px] text-gray-500 font-medium truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// Forward Modal Component
export function ForwardModal({ contacts, onClose, onForward, messageToForward }) {
  const [selectedContacts, setSelectedContacts] = React.useState([]);

  const toggleContact = (contact) => {
    setSelectedContacts((prev) =>
      prev.find((c) => c.id === contact.id && c.type === contact.type)
        ? prev.filter((c) => !(c.id === contact.id && c.type === contact.type))
        : [...prev, contact]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-scaleUp border border-orange-50">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Forward To</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Select recipients</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {messageToForward && (
          <div className="px-6 py-4 bg-orange-50/30">
            <div className="p-4 bg-white rounded-2xl border border-orange-100 flex items-start gap-3 shadow-sm">
              <Reply size={16} className="text-[#FF7B1D] flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-orange-900 uppercase tracking-widest mb-1">Content</p>
                <p className="text-xs text-gray-600 italic line-clamp-2 font-medium">"{messageToForward.text || 'Flash message/media'}"</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-h-[360px] overflow-y-auto p-4 custom-scrollbar space-y-1">
          {[...contacts.team, ...contacts.clients].map((contact) => (
            <button
              key={`${contact.id}_${contact.type}`}
              onClick={() => toggleContact(contact)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border-2 ${selectedContacts.find((c) => c.id === contact.id && c.type === contact.type)
                ? "bg-orange-50 border-orange-200"
                : "hover:bg-gray-50 border-transparent"
                }`}
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600 uppercase">
                {contact.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{contact.role}</p>
              </div>
              {selectedContacts.find((c) => c.id === contact.id && c.type === contact.type) && (
                <div className="w-6 h-6 bg-[#FF7B1D] rounded-full flex items-center justify-center text-white shadow-md">
                  <Check size={14} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 font-bold text-gray-500 rounded-xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest">Cancel</button>
          <button
            onClick={() => onForward(selectedContacts)}
            disabled={selectedContacts.length === 0}
            className={`flex-1 px-4 py-2.5 font-bold rounded-xl transition-all text-xs uppercase tracking-widest ${selectedContacts.length > 0
              ? "bg-[#FF7B1D] text-white shadow-lg shadow-[#FF7B1D]/20 hover:scale-[1.02] active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            Send ({selectedContacts.length})
          </button>
        </div>
      </div>
    </div>
  );
}
