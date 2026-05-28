import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { API_URL } from '../config';

export default function Community() {
  const { 
    user, 
    friends, 
    sendWsMessage, 
    communityPosts, 
    addCommunityPost, 
    likeCommunityPost 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'dms'
  const [newPostText, setNewPostText] = useState('');

  // --- REAL-TIME FRIEND ONLINE PRESENCE STATUS ---
  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {
    const fetchFriendsStatus = async () => {
      const token = localStorage.getItem('cocook_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/friends/status?token=${token}`);
        if (res.ok) {
          const status = await res.json();
          setOnlineStatus(status);
        }
      } catch (e) {
        console.warn("Failed to check active status:", e);
      }
    };

    fetchFriendsStatus();
    const interval = setInterval(fetchFriendsStatus, 5000);
    return () => clearInterval(interval);
  }, [friends]);

  // --- INSTAGRAM-STYLE DIRECT MESSAGES (DMs) LOGIC ---
  const [activeChatFriend, setActiveChatFriend] = useState(null); // Selected friend user object
  const [dmInputText, setDmInputText] = useState('');
  const [conversations, setConversations] = useState({}); // { friend_id: [messages...] }
  const dmEndRef = useRef(null);

  // Auto-scroll DM thread
  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatFriend]);

  // Listen to incoming direct messages over WebSocket
  useEffect(() => {
    const handleIncomingDM = (e) => {
      const { sender_id, text, created_at } = e.detail;
      if (!sender_id || !text) return;

      // Add message to that friend's conversation thread
      setConversations(prev => {
        const thread = prev[sender_id] || [];
        return {
          ...prev,
          [sender_id]: [
            ...thread,
            { id: Date.now(), sender: 'friend', text, created_at }
          ]
        };
      });

      // If we are not currently chatting with this friend, show a subtle alert or visual indicator
      if (!activeChatFriend || activeChatFriend.id !== sender_id) {
        // Soft audio tone or clean alert (can be mocked visually)
      }
    };

    window.addEventListener('dm_message', handleIncomingDM);
    return () => {
      window.removeEventListener('dm_message', handleIncomingDM);
    };
  }, [activeChatFriend]);

  const handleSendDM = (e) => {
    e.preventDefault();
    if (!dmInputText.trim() || !activeChatFriend) return;

    const newMsg = {
      id: Date.now(),
      sender: 'self',
      text: dmInputText.trim(),
      created_at: new Date().toISOString()
    };

    // Update local conversation state
    setConversations(prev => {
      const thread = prev[activeChatFriend.id] || [];
      return {
        ...prev,
        [activeChatFriend.id]: [...thread, newMsg]
      };
    });

    // Send over WebSocket
    sendWsMessage({
      action: "dm_message",
      receiver_id: activeChatFriend.id,
      payload: {
        text: newMsg.text
      }
    });

    setDmInputText('');
  };

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

  // Get active chat thread messages
  const activeChatMessages = activeChatFriend ? (conversations[activeChatFriend.id] || []) : [];

  return (
    <>
      {/* Header with App Title & Tab Switches */}
      <header className="fixed top-0 w-full z-40 bg-surface/40 dark:bg-surface-dim/40 backdrop-blur-xl shadow-sm h-16 flex justify-between items-center px-container-padding-desktop left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl font-bold">group</span>
          </div>
          <h1 className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary">Community</h1>
        </div>

        {/* Tab switcher: Board Feed vs Direct Messages */}
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant/20 shadow-inner">
          <button 
            onClick={() => setActiveTab('board')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'board' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Social Board
          </button>
          <button 
            onClick={() => setActiveTab('dms')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative ${activeTab === 'dms' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Direct Messages
          </button>
        </div>
      </header>

      <main className="pt-20 px-container-padding-desktop mx-auto pb-32 max-w-screen-md">
        
        {/* --- TAB 1: ORIGINAL SOCIAL FORUM BOARD --- */}
        {activeTab === 'board' && (
          <div className="space-y-6">
            {/* Create Vibe Post */}
            <section className="bg-surface-container-low p-4 rounded-[24px] neumorphic-pill flex items-center gap-4 animate-fade-in border border-outline-variant/15">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/15 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                {user.avatar ? (
                  <img className="w-full h-full object-cover" src={user.avatar} alt="" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <input 
                className="flex-grow px-6 py-2.5 bg-surface-container rounded-full text-on-surface placeholder:text-outline-variant font-label-md border-none focus:ring-0 shadow-inner text-sm"
                placeholder="Share your cooking vibe..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePost()}
              />
              <button 
                onClick={handlePost}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </section>

            {/* Forum Post Lists */}
            <div className="space-y-6">
              {communityPosts.map(post => (
                <article key={post.id} className="bg-surface-container-lowest border border-outline-variant/35 rounded-[32px] overflow-hidden shadow-sm neumorphic-lift animate-fade-in group">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20 flex items-center justify-center bg-primary/10 text-primary font-bold">
                        {post.authorAvatar ? (
                          <img className="w-full h-full object-cover" src={post.authorAvatar} alt="" />
                        ) : (
                          post.author.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm leading-tight">{post.author}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{post.time} • <span className="text-secondary font-bold">{post.group || 'The Sizzle Crew'}</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 pb-5">
                    <p className="text-sm text-on-surface leading-relaxed font-medium mb-4">{post.text}</p>
                    
                    <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => likeCommunityPost(post.id)}
                          className="flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-4 py-2 rounded-full active:scale-95 transition-transform text-xs font-bold"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">favorite</span>
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full active:scale-95 transition-transform text-xs font-bold border border-outline-variant/10">
                          <span className="material-symbols-outlined text-sm">chat_bubble</span>
                          <span>{post.comments}</span>
                        </button>
                      </div>
                      <button className="text-outline hover:text-primary active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-lg">bookmark</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {communityPosts.length === 0 && (
                <div className="text-center py-16 px-4 bg-surface-container-low rounded-[24px] border border-dashed border-outline-variant">
                  <span className="material-symbols-outlined text-5xl text-outline-variant animate-pulse">forum</span>
                  <p className="mt-4 text-on-surface-variant font-title-md font-bold">The forum is calm.</p>
                  <p className="text-sm text-outline mt-1">Start a conversation or share what you are cooking!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: INSTAGRAM-STYLE DIRECT MESSAGES (DMs) --- */}
        {activeTab === 'dms' && (
          <section className="flex bg-surface-container-lowest border border-outline-variant/35 rounded-3xl overflow-hidden shadow-lg h-[75vh] neumorphic-lift animate-fade-in">
            
            {/* Friends Directory Panel (Left/Top) */}
            <div className={`w-full md:w-80 bg-surface-container-low border-r border-outline-variant/20 flex flex-col ${activeChatFriend ? 'hidden md:flex' : 'flex'}`}>
              <div className="px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
                <span className="font-bold text-sm text-on-surface">Active Conversations</span>
                <span className="bg-emerald-500/15 text-emerald-600 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live Status
                </span>
              </div>

              {/* Connected Friends Directory list */}
              <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/10 p-2 space-y-1 scrollbar-hide">
                {friends.map(friend => {
                  const isOnline = onlineStatus[friend.id] === 'online';
                  const thread = conversations[friend.id] || [];
                  const lastMsg = thread.length > 0 ? thread[thread.length - 1] : null;

                  return (
                    <button
                      key={friend.id}
                      onClick={() => setActiveChatFriend(friend)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left border border-transparent ${
                        activeChatFriend && activeChatFriend.id === friend.id
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'hover:bg-surface-container hover:border-outline-variant/10 text-on-surface'
                      }`}
                    >
                      {/* Avatar with dynamic real-time presence glowing indicator */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-outline-variant/20 flex items-center justify-center font-bold text-xs overflow-hidden shadow-sm">
                          {friend.avatar ? (
                            <img className="w-full h-full object-cover" src={friend.avatar} alt="" />
                          ) : (
                            friend.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Glow indicator */}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container-lowest ${
                          isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-400'
                        }`}></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-bold text-xs truncate text-on-surface">{friend.name}</p>
                          {isOnline && (
                            <span className="text-[8px] text-emerald-500 font-extrabold uppercase animate-pulse">active</span>
                          )}
                        </div>
                        <p className="text-[10px] text-outline truncate mt-0.5 font-medium">
                          {lastMsg 
                            ? (lastMsg.sender === 'self' ? `You: ${lastMsg.text}` : lastMsg.text) 
                            : (friend.bio || 'Connected foodie')}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {friends.length === 0 && (
                  <div className="text-center py-16 px-4 space-y-3">
                    <span className="material-symbols-outlined text-4xl text-outline-variant animate-pulse">alternate_email</span>
                    <p className="text-xs text-outline italic leading-relaxed">
                      No friends connected yet.<br/>Go to the Feed page search bar to find and connect with other chefs!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Messages Chat View Window (Right) */}
            <div className={`flex-1 flex flex-col bg-surface-container-lowest ${!activeChatFriend ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
              
              {!activeChatFriend ? (
                /* Unselected State */
                <div className="text-center p-8 space-y-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto animate-bounce">
                    <span className="material-symbols-outlined text-3xl font-bold">chat</span>
                  </div>
                  <h4 className="font-bold text-on-surface text-base">Direct Messages</h4>
                  <p className="text-xs text-outline max-w-xs mx-auto leading-relaxed">
                    Select an active chef friend from the directory to start an Instagram-style direct real-time chat session!
                  </p>
                </div>
              ) : (
                /* Active Chat State */
                <>
                  {/* Friend Chat Header */}
                  <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Back button (Mobile only) */}
                      <button 
                        onClick={() => setActiveChatFriend(null)}
                        className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-on-surface md:hidden active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                      </button>

                      {/* User Icon */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-outline-variant/25 flex items-center justify-center font-bold text-xs overflow-hidden shadow-sm">
                          {activeChatFriend.avatar ? (
                            <img className="w-full h-full object-cover" src={activeChatFriend.avatar} alt="" />
                          ) : (
                            activeChatFriend.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container-low ${
                          onlineStatus[activeChatFriend.id] === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-400'
                        }`}></span>
                      </div>

                      <div>
                        <p className="font-bold text-xs text-on-surface leading-tight">{activeChatFriend.name}</p>
                        <p className="text-[9px] text-outline mt-0.5">
                          {onlineStatus[activeChatFriend.id] === 'online' ? 'Active now in kitchen' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Thread Log */}
                  <div className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-hide text-xs">
                    
                    {/* Welcome notice */}
                    <div className="text-center text-[10px] text-outline font-bold bg-surface-container-low p-3 rounded-2xl max-w-xs mx-auto border border-outline-variant/10">
                      🍽️ You connected with {activeChatFriend.name}! Start planning your next culinary feast together in real-time DMs.
                    </div>

                    {activeChatMessages.map((msg, idx) => {
                      const isSelf = msg.sender === 'self';
                      return (
                        <div key={idx} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} animate-fade-in`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                            isSelf 
                              ? 'bg-gradient-to-tr from-primary to-primary-container text-on-primary rounded-tr-none shadow-orange-500/5' 
                              : 'bg-surface-container-low border border-outline-variant/15 text-on-surface rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-outline-variant mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={dmEndRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendDM} className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 h-11 px-4 bg-surface-container-lowest border-none rounded-xl text-xs text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/20 shadow-inner"
                      placeholder={`Message ${activeChatFriend.name}...`}
                      value={dmInputText}
                      onChange={e => setDmInputText(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={!dmInputText.trim()}
                      className="w-11 h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">send</span>
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
