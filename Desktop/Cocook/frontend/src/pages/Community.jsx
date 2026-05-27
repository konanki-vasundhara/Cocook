import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

// ================= API URL =================
const API =
  import.meta.env.VITE_API_URL ||
  "http://13.60.13.36:8000";
// ===========================================

export default function Community() {

  const {
    user,
    friends,
    sendWsMessage,
    communityPosts,
    addCommunityPost,
    likeCommunityPost
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('board');
  const [newPostText, setNewPostText] = useState('');

  // ================= ONLINE STATUS =================

  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {

    const fetchFriendsStatus = async () => {

      const token = localStorage.getItem('cocook_token');

      if (!token) return;

      try {

        const res = await fetch(
          `${API}/api/friends/status?token=${token}`
        );

        if (res.ok) {

          const status = await res.json();

          setOnlineStatus(status);
        }

      } catch (e) {

        console.warn(
          "Failed to check active status:",
          e
        );
      }
    };

    fetchFriendsStatus();

    const interval = setInterval(
      fetchFriendsStatus,
      5000
    );

    return () => clearInterval(interval);

  }, [friends]);

  // ================= DIRECT MESSAGES =================

  const [activeChatFriend, setActiveChatFriend] =
    useState(null);

  const [dmInputText, setDmInputText] =
    useState('');

  const [conversations, setConversations] =
    useState({});

  const dmEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {

    dmEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  }, [conversations, activeChatFriend]);

  // Listen for incoming DMs
  useEffect(() => {

    const handleIncomingDM = (e) => {

      const {
        sender_id,
        text,
        created_at
      } = e.detail;

      if (!sender_id || !text) return;

      setConversations(prev => {

        const thread =
          prev[sender_id] || [];

        return {
          ...prev,
          [sender_id]: [
            ...thread,
            {
              id: Date.now(),
              sender: 'friend',
              text,
              created_at
            }
          ]
        };
      });
    };

    window.addEventListener(
      'dm_message',
      handleIncomingDM
    );

    return () => {

      window.removeEventListener(
        'dm_message',
        handleIncomingDM
      );
    };

  }, [activeChatFriend]);

  // ================= SEND DM =================

  const handleSendDM = (e) => {

    e.preventDefault();

    if (
      !dmInputText.trim() ||
      !activeChatFriend
    ) return;

    const newMsg = {
      id: Date.now(),
      sender: 'self',
      text: dmInputText.trim(),
      created_at: new Date().toISOString()
    };

    // Update local UI
    setConversations(prev => {

      const thread =
        prev[activeChatFriend.id] || [];

      return {
        ...prev,
        [activeChatFriend.id]: [
          ...thread,
          newMsg
        ]
      };
    });

    // Send through websocket
    sendWsMessage({
      action: "dm_message",
      receiver_id: activeChatFriend.id,
      payload: {
        text: newMsg.text
      }
    });

    setDmInputText('');
  };

  // ================= COMMUNITY POST =================

  const handlePost = () => {

    if (newPostText.trim()) {

      addCommunityPost({
        group: 'The Sizzle Crew',
        text: newPostText,
        duration: 'Just now'
      });

      setNewPostText('');
    }
  };

  const activeChatMessages =
    activeChatFriend
      ? (conversations[
          activeChatFriend.id
        ] || [])
      : [];

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 w-full z-40 bg-surface/40 dark:bg-surface-dim/40 backdrop-blur-xl shadow-sm h-16 flex justify-between items-center px-container-padding-desktop left-0 right-0">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl font-bold">
              group
            </span>
          </div>

          <h1 className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary">
            Community
          </h1>

        </div>

        {/* TABS */}
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant/20 shadow-inner">

          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'board'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Social Board
          </button>

          <button
            onClick={() => setActiveTab('dms')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative ${
              activeTab === 'dms'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Direct Messages
          </button>

        </div>

      </header>

      <main className="pt-20 px-container-padding-desktop mx-auto pb-32 max-w-screen-md">

        {/* ================= BOARD ================= */}
        {activeTab === 'board' && (

          <div className="space-y-6">

            {/* CREATE POST */}
            <section className="bg-surface-container-low p-4 rounded-[24px] neumorphic-pill flex items-center gap-4 animate-fade-in border border-outline-variant/15">

              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary font-bold">

                {user?.avatar ? (

                  <img
                    className="w-full h-full object-cover"
                    src={user.avatar}
                    alt=""
                  />

                ) : (

                  user?.name?.charAt(0).toUpperCase()

                )}

              </div>

              <input
                className="flex-grow px-6 py-2.5 bg-surface-container rounded-full text-on-surface placeholder:text-outline-variant font-label-md border-none focus:ring-0 shadow-inner text-sm"
                placeholder="Share your cooking vibe..."
                value={newPostText}
                onChange={(e) =>
                  setNewPostText(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  handlePost()
                }
              />

              <button
                onClick={handlePost}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-lg">
                  send
                </span>
              </button>

            </section>

            {/* POSTS */}
            <div className="space-y-6">

              {communityPosts.map(post => (

                <article
                  key={post.id}
                  className="bg-surface-container-lowest border border-outline-variant/35 rounded-[32px] overflow-hidden shadow-sm neumorphic-lift animate-fade-in group"
                >

                  <div className="p-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20 flex items-center justify-center bg-primary/10 text-primary font-bold">

                        {post.authorAvatar ? (

                          <img
                            className="w-full h-full object-cover"
                            src={post.authorAvatar}
                            alt=""
                          />

                        ) : (

                          post.author
                            ?.charAt(0)
                            .toUpperCase()

                        )}

                      </div>

                      <div>

                        <p className="font-bold text-on-surface text-sm leading-tight">
                          {post.author}
                        </p>

                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {post.time} •{" "}
                          <span className="text-secondary font-bold">
                            {post.group ||
                              'The Sizzle Crew'}
                          </span>
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="px-6 pb-5">

                    <p className="text-sm text-on-surface leading-relaxed font-medium mb-4">
                      {post.text}
                    </p>

                    <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            likeCommunityPost(
                              post.id
                            )
                          }
                          className="flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-4 py-2 rounded-full active:scale-95 transition-transform text-xs font-bold"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">
                            favorite
                          </span>

                          <span>
                            {post.likes}
                          </span>
                        </button>

                        <button className="flex items-center gap-1.5 bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full active:scale-95 transition-transform text-xs font-bold border border-outline-variant/10">
                          <span className="material-symbols-outlined text-sm">
                            chat_bubble
                          </span>

                          <span>
                            {post.comments}
                          </span>
                        </button>

                      </div>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          </div>
        )}

        {/* ================= DMS ================= */}
        {activeTab === 'dms' && (

          <section className="flex bg-surface-container-lowest border border-outline-variant/35 rounded-3xl overflow-hidden shadow-lg h-[75vh] neumorphic-lift animate-fade-in">

            {/* FRIENDS LIST */}
            <div className={`w-full md:w-80 bg-surface-container-low border-r border-outline-variant/20 flex flex-col ${activeChatFriend ? 'hidden md:flex' : 'flex'}`}>

              <div className="px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">

                <span className="font-bold text-sm text-on-surface">
                  Active Conversations
                </span>

              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/10 p-2 space-y-1 scrollbar-hide">

                {friends.map(friend => {

                  const isOnline =
                    onlineStatus[friend.id] === 'online';

                  return (

                    <button
                      key={friend.id}
                      onClick={() =>
                        setActiveChatFriend(friend)
                      }
                      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left hover:bg-surface-container"
                    >

                      <div className="relative">

                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs overflow-hidden">

                          {friend.avatar ? (

                            <img
                              className="w-full h-full object-cover"
                              src={friend.avatar}
                              alt=""
                            />

                          ) : (

                            friend.name
                              .charAt(0)
                              .toUpperCase()

                          )}

                        </div>

                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isOnline
                              ? 'bg-emerald-500'
                              : 'bg-zinc-400'
                          }`}
                        ></span>

                      </div>

                      <div>

                        <p className="font-bold text-xs">
                          {friend.name}
                        </p>

                        <p className="text-[10px] text-outline">
                          {isOnline
                            ? 'Online'
                            : 'Offline'}
                        </p>

                      </div>

                    </button>
                  );
                })}

              </div>

            </div>

            {/* CHAT AREA */}
            <div className={`flex-1 flex flex-col ${!activeChatFriend ? 'hidden md:flex items-center justify-center' : 'flex'}`}>

              {!activeChatFriend ? (

                <div className="text-center p-8">

                  <h4 className="font-bold text-on-surface text-base">
                    Select a friend to start chatting
                  </h4>

                </div>

              ) : (

                <>
                  {/* CHAT HEADER */}
                  <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center gap-3">

                    <button
                      onClick={() =>
                        setActiveChatFriend(null)
                      }
                      className="md:hidden"
                    >
                      ←
                    </button>

                    <div className="font-bold text-sm">
                      {activeChatFriend.name}
                    </div>

                  </div>

                  {/* MESSAGES */}
                  <div className="flex-grow overflow-y-auto p-5 space-y-4">

                    {activeChatMessages.map((msg, idx) => {

                      const isSelf =
                        msg.sender === 'self';

                      return (

                        <div
                          key={idx}
                          className={`flex ${
                            isSelf
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >

                          <div
                            className={`max-w-[75%] px-4 py-2 rounded-2xl text-xs ${
                              isSelf
                                ? 'bg-primary text-white'
                                : 'bg-surface-container-low'
                            }`}
                          >
                            {msg.text}
                          </div>

                        </div>
                      );
                    })}

                    <div ref={dmEndRef} />

                  </div>

                  {/* INPUT */}
                  <form
                    onSubmit={handleSendDM}
                    className="p-4 border-t border-outline-variant/20 flex gap-2"
                  >

                    <input
                      type="text"
                      className="flex-1 h-11 px-4 rounded-xl border text-sm"
                      placeholder={`Message ${activeChatFriend.name}...`}
                      value={dmInputText}
                      onChange={(e) =>
                        setDmInputText(e.target.value)
                      }
                    />

                    <button
                      type="submit"
                      className="w-11 h-11 bg-primary text-white rounded-xl"
                    >
                      Send
                    </button>

                  </form>
                </>
              )}

            </div>

          </section>
        )}

      </main>
    </>
  );
}
