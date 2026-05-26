import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Assistant() {
  const { 
    user, 
    friends, 
    askAiSuggestion, 
    sendWsMessage 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('chatbot'); // 'chatbot' or 'cocook'

  // --- 1. CHATBOT STATES & LOGIC ---
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      sender: 'ai', 
      text: "Bonjour Chef! I am your AI Culinary Assistant. Tell me what ingredients you have in your fridge, or ask me for a custom recipe suggestion!" 
    }
  ]);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: chatInput.trim()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    // Call API
    const suggestion = await askAiSuggestion(userMsg.text);
    setIsAiTyping(false);

    if (suggestion) {
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Here is a custom recipe I crafted for you: **${suggestion.title}** (${suggestion.time_estimate} • ${suggestion.difficulty})`,
        recipe: {
          title: suggestion.title,
          content: suggestion.content,
          image: suggestion.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          tags: suggestion.tags ? suggestion.tags.split(',') : ['Custom'],
          time: suggestion.time_estimate || '15 mins',
          difficulty: suggestion.difficulty || 'Easy'
        }
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } else {
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I couldn't generate a recipe with those ingredients. Try adding basic pantry items like chicken, pasta, eggs, spinach, or tomato!"
      };
      setChatMessages(prev => [...prev, aiMsg]);
    }
  };

  // --- 2. REAL-TIME CO-COOKING STATES & LOGIC ---
  const [activeRoom, setActiveRoom] = useState(null); // { id, host_name, recipe, steps: [...] }
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeInvites, setActiveInvites] = useState([]); // [{ room_id, inviter_name, recipe }]
  const [roomChatMessages, setRoomChatMessages] = useState([]);
  const [roomChatInput, setRoomChatInput] = useState('');
  const roomChatEndRef = useRef(null);

  // Auto-scroll room chat
  useEffect(() => {
    roomChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomChatMessages]);

  // List of standard recipes for co-cooking
  const coCookRecipes = [
    {
      title: "Tuscan Garlic Chicken",
      description: "Creamy one-pan masterclass featuring seared chicken breast, baby spinach, and sun-dried tomatoes in a rich parmesan broth.",
      image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
      steps: [
        { id: 1, text: "Season chicken breasts with sea salt, ground pepper, and paprika.", completed: false, completedBy: null },
        { id: 2, text: "Heat olive oil in a pan, sear chicken until golden (6-8 mins each side) and remove.", completed: false, completedBy: null },
        { id: 3, text: "In the same skillet, sauté minced garlic, then add heavy cream and chicken broth.", completed: false, completedBy: null },
        { id: 4, text: "Stir in grated Parmesan cheese and let the creamy sauce simmer lightly.", completed: false, completedBy: null },
        { id: 5, text: "Add fresh baby spinach and halved cherry tomatoes; stir until spinach is wilted.", completed: false, completedBy: null },
        { id: 6, text: "Return chicken to pan, coat thoroughly in sauce, and garnish with fresh basil.", completed: false, completedBy: null }
      ]
    },
    {
      title: "Handmade Pomodoro Fettuccine",
      description: "Al dente fresh pasta tossed in a slow-simmered vine tomato sauce infused with garlic confit and fresh sweet basil.",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
      steps: [
        { id: 1, text: "Bring a large pot of heavily salted water to a rolling boil.", completed: false, completedBy: null },
        { id: 2, text: "In a saucepan, heat olive oil and cook crushed garlic until fragrant and golden.", completed: false, completedBy: null },
        { id: 3, text: "Add crushed vine tomatoes, a pinch of sugar, and fresh basil; simmer for 15 mins.", completed: false, completedBy: null },
        { id: 4, text: "Drop fresh fettuccine into boiling water; cook for 3-4 minutes until al dente.", completed: false, completedBy: null },
        { id: 5, text: "Drain pasta, preserving half a cup of starchy pasta water.", completed: false, completedBy: null },
        { id: 6, text: "Toss pasta in tomato sauce with pasta water, drizzle olive oil, and serve with Pecorino.", completed: false, completedBy: null }
      ]
    }
  ];

  // Listen to WebSocket events routed through custom window events
  useEffect(() => {
    const handleWebSocketMessage = (e) => {
      const { sender_id, payload } = e.detail;
      if (!payload) return;

      switch (payload.type) {
        case 'co_cook_invite':
          // Add to incoming invites list if we aren't already in it
          if (!activeInvites.some(i => i.room_id === payload.room_id)) {
            setActiveInvites(prev => [...prev, {
              room_id: payload.room_id,
              inviter_name: payload.inviter_name,
              recipe: payload.recipe,
              sender_id: sender_id
            }]);
          }
          break;

        case 'co_cook_join':
          // Another user joined. Add a system message in room chat
          setRoomChatMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'system',
            text: `${payload.joiner_name} joined the kitchen! 🍳`
          }]);
          // Sync current room state back to the joiner so they see checked off items
          if (activeRoom && activeRoom.isHost) {
            sendWsMessage({
              action: "co_cook_event",
              targets: [sender_id],
              payload: {
                type: "co_cook_sync_state",
                room_id: activeRoom.id,
                steps: activeRoom.steps,
                chat: roomChatMessages
              }
            });
          }
          break;

        case 'co_cook_sync_state':
          // Receive synced room state from the host
          if (activeRoom && activeRoom.id === payload.room_id) {
            setActiveRoom(prev => ({ ...prev, steps: payload.steps }));
            if (payload.chat && payload.chat.length > 0) {
              setRoomChatMessages(payload.chat);
            }
          }
          break;

        case 'co_cook_chat':
          // Receive real-time chat message from friend in room
          if (activeRoom && activeRoom.id === payload.room_id) {
            setRoomChatMessages(prev => [...prev, {
              id: payload.id,
              sender: 'friend',
              sender_name: payload.sender_name,
              text: payload.text
            }]);
          }
          break;

        case 'co_cook_step_toggle':
          // Receive real-time checklist toggling
          if (activeRoom && activeRoom.id === payload.room_id) {
            setActiveRoom(prev => {
              if (!prev) return null;
              const nextSteps = prev.steps.map(s => {
                if (s.id === payload.step_id) {
                  return { 
                    ...s, 
                    completed: payload.completed, 
                    completedBy: payload.completed ? payload.completed_by : null 
                  };
                }
                return s;
              });
              return { ...prev, steps: nextSteps };
            });
            // System message
            setRoomChatMessages(prev => [...prev, {
              id: Date.now(),
              sender: 'system',
              text: `${payload.completed_by} ${payload.completed ? 'completed' : 'unmarked'} Step ${payload.step_id}!`
            }]);
          }
          break;

        case 'co_cook_leave':
          // Friend left room
          if (activeRoom && activeRoom.id === payload.room_id) {
            setRoomChatMessages(prev => [...prev, {
              id: Date.now(),
              sender: 'system',
              text: `${payload.leaver_name} left the kitchen.`
            }]);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('co_cook_message', handleWebSocketMessage);
    return () => {
      window.removeEventListener('co_cook_message', handleWebSocketMessage);
    };
  }, [activeRoom, activeInvites, roomChatMessages]);

  // Create co-cooking room session
  const handleCreateRoom = (recipe) => {
    const roomId = 'room_' + Date.now();
    setActiveRoom({
      id: roomId,
      isHost: true,
      host_name: user.name,
      recipe: recipe,
      steps: recipe.steps.map(s => ({ ...s, completed: false, completedBy: null }))
    });
    setRoomChatMessages([
      { id: 1, sender: 'system', text: `Welcome to Co-Cooking! You started a room for ${recipe.title}. Invite your friends to cook together in real time!` }
    ]);
  };

  // Join co-cooking room session from invitation
  const handleJoinRoom = (invite) => {
    const roomId = invite.room_id;
    setActiveRoom({
      id: roomId,
      isHost: false,
      host_name: invite.inviter_name,
      recipe: invite.recipe,
      steps: invite.recipe.steps.map(s => ({ ...s, completed: false, completedBy: null }))
    });
    
    // Clear invite from lists
    setActiveInvites(prev => prev.filter(i => i.room_id !== roomId));

    // Send Join WS Event to the host
    sendWsMessage({
      action: "co_cook_event",
      targets: [invite.sender_id],
      payload: {
        type: "co_cook_join",
        room_id: roomId,
        joiner_name: user.name
      }
    });

    setRoomChatMessages([
      { id: 1, sender: 'system', text: `Joined ${invite.inviter_name}'s cooking session. Syncing kitchen state...` }
    ]);
  };

  // Invite friend to active room
  const handleInviteFriend = (friend) => {
    if (!activeRoom) return;
    sendWsMessage({
      action: "co_cook_event",
      targets: [friend.id],
      payload: {
        type: "co_cook_invite",
        room_id: activeRoom.id,
        recipe: activeRoom.recipe,
        inviter_name: user.name
      }
    });
    // Add success message
    setRoomChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'system',
      text: `Sent kitchen invitation to ${friend.name}!`
    }]);
  };

  // Leave active co-cooking room
  const handleLeaveRoom = () => {
    if (!activeRoom) return;
    const targets = friends.map(f => f.id);
    sendWsMessage({
      action: "co_cook_event",
      targets: targets,
      payload: {
        type: "co_cook_leave",
        room_id: activeRoom.id,
        leaver_name: user.name
      }
    });
    setActiveRoom(null);
    setRoomChatMessages([]);
  };

  // Send message inside co-cooking room
  const handleSendRoomChat = (e) => {
    e.preventDefault();
    if (!roomChatInput.trim() || !activeRoom) return;

    const newMsg = {
      id: Date.now(),
      sender: 'self',
      sender_name: user.name,
      text: roomChatInput.trim()
    };
    setRoomChatMessages(prev => [...prev, newMsg]);

    // Send WS event to friends
    const targets = friends.map(f => f.id);
    sendWsMessage({
      action: "co_cook_event",
      targets: targets,
      payload: {
        type: "co_cook_chat",
        room_id: activeRoom.id,
        id: newMsg.id,
        sender_name: user.name,
        text: newMsg.text
      }
    });
    setRoomChatInput('');
  };

  // Toggle checklist step completed state in real-time
  const handleToggleStep = (stepId, currentCompleted) => {
    if (!activeRoom) return;
    const nextCompleted = !currentCompleted;

    // Local Update
    setActiveRoom(prev => {
      if (!prev) return null;
      const nextSteps = prev.steps.map(s => {
        if (s.id === stepId) {
          return { ...s, completed: nextCompleted, completedBy: nextCompleted ? user.name : null };
        }
        return s;
      });
      return { ...prev, steps: nextSteps };
    });

    // Add local system log
    setRoomChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'system',
      text: `You ${nextCompleted ? 'completed' : 'unmarked'} Step ${stepId}!`
    }]);

    // Broadcast checklist change to friends over WebSockets
    const targets = friends.map(f => f.id);
    sendWsMessage({
      action: "co_cook_event",
      targets: targets,
      payload: {
        type: "co_cook_step_toggle",
        room_id: activeRoom.id,
        step_id: stepId,
        completed: nextCompleted,
        completed_by: user.name
      }
    });
  };

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/40 dark:bg-surface-dim/40 backdrop-blur-xl shadow-sm h-16 flex justify-between items-center px-container-padding-desktop left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl font-bold">smart_toy</span>
          </div>
          <h1 className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary">AI Kitchen</h1>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant/20 shadow-inner">
          <button 
            onClick={() => setActiveTab('chatbot')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'chatbot' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Chef AI Chatbot
          </button>
          <button 
            onClick={() => setActiveTab('cocook')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative ${activeTab === 'cocook' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Cook With Friends
            {activeInvites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary text-white text-[9px] rounded-full flex items-center justify-center font-black animate-bounce">
                {activeInvites.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="pt-20 px-container-padding-desktop space-y-6 pb-32 max-w-screen-md mx-auto">
        
        {/* --- TAB 1: CHEF AI CHATBOT SYSTEM --- */}
        {activeTab === 'chatbot' && (
          <section className="flex flex-col h-[75vh] bg-surface-container-lowest border border-outline-variant/35 rounded-3xl overflow-hidden shadow-lg neumorphic-lift">
            {/* Header */}
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <p className="font-bold text-sm text-on-surface leading-tight">Chef AI Specialiste</p>
                  <p className="text-[10px] text-outline">Real-time Culinary Genius</p>
                </div>
              </div>
              <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-primary/20">
                GPT-Chef Active
              </span>
            </div>

            {/* Chat Messages Logs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'user' ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-tl-none leading-relaxed'}`}>
                    {msg.text}
                  </div>
                  
                  {/* Embedded Recipe Suggestion Card */}
                  {msg.recipe && (
                    <article className="mt-3 bg-surface-container-low border border-primary/20 rounded-[24px] overflow-hidden w-full max-w-sm shadow-md animate-scale-up">
                      <div className="relative h-40">
                        <img className="w-full h-full object-cover" src={msg.recipe.image} alt="" />
                        <span className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                          {msg.recipe.time} • {msg.recipe.difficulty}
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="font-title-md text-primary font-bold text-base leading-tight">{msg.recipe.title}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mt-1">{msg.recipe.content}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10">
                          <div className="flex gap-1">
                            {msg.recipe.tags.map(t => (
                              <span key={t} className="text-[9px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">#{t}</span>
                            ))}
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTab('cocook');
                              handleCreateRoom({
                                title: msg.recipe.title,
                                description: msg.recipe.content,
                                image: msg.recipe.image,
                                steps: [
                                  { id: 1, text: "Gather all the necessary pantry ingredients.", completed: false, completedBy: null },
                                  { id: 2, text: "Prepare and portion ingredients as outlined in recipe content.", completed: false, completedBy: null },
                                  { id: 3, text: "Follow the cooking directions step-by-step with your friends.", completed: false, completedBy: null }
                                ]
                              });
                            }}
                            className="bg-primary text-on-primary text-[10px] font-bold px-3 py-1.5 rounded-full shadow hover:bg-primary-container active:scale-95 transition-transform"
                          >
                            Cook Together!
                          </button>
                        </div>
                      </div>
                    </article>
                  )}
                </div>
              ))}

              {isAiTyping && (
                <div className="flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant/20 rounded-2xl rounded-tl-none w-20 justify-center animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChat} className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex gap-2">
              <input 
                type="text" 
                className="flex-1 h-12 px-4 bg-surface-container-lowest border-none rounded-xl text-on-surface placeholder:text-outline text-sm focus:ring-2 focus:ring-primary/20 shadow-inner"
                placeholder="e.g. I have eggs, baby spinach, cheese. What should I cook?"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isAiTyping}
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isAiTyping}
                className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </form>
          </section>
        )}

        {/* --- TAB 2: COOK WITH FRIENDS COLLABORATIVE ROOMS --- */}
        {activeTab === 'cocook' && (
          <div className="space-y-6">
            
            {/* Incoming Cooking Invitations Notification Banner */}
            {activeInvites.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-title-md text-primary font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
                  Kitchen Invitations
                </h3>
                <div className="space-y-2">
                  {activeInvites.map(inv => (
                    <div key={inv.room_id} className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-up">
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          👨‍🍳 <span className="text-primary">{inv.inviter_name}</span> invited you to cook together!
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Recipe: <strong className="text-on-surface">{inv.recipe.title}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleJoinRoom(inv)}
                          className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-full shadow-md hover:bg-primary-container active:scale-95 transition-transform"
                        >
                          Join Kitchen
                        </button>
                        <button 
                          onClick={() => setActiveInvites(prev => prev.filter(i => i.room_id !== inv.room_id))}
                          className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-4 py-2 rounded-full border border-outline-variant/20 hover:bg-surface-variant active:scale-95 transition-transform"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If NOT in a room: Show Recipe Catalog to start a Room */}
            {!activeRoom ? (
              <div className="space-y-4">
                <div className="text-center py-6 bg-surface-container-low rounded-3xl border border-outline-variant/15 p-6 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-primary animate-bounce">group</span>
                  <h3 className="font-headline-lg-mobile text-on-surface font-bold">Collaborative Kitchen</h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                    Select a recipe below to open a Co-Cooking Session, invite your friends, and check off cooking steps together in real time!
                  </p>
                </div>

                <h3 className="font-title-md text-on-surface font-bold">Choose a Recipe to Cook</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coCookRecipes.map(recipe => (
                    <article key={recipe.title} className="bg-surface-container-low border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between neumorphic-lift">
                      <div>
                        <img className="h-44 w-full object-cover" src={recipe.image} alt={recipe.title} />
                        <div className="p-5 space-y-2">
                          <h4 className="font-title-md text-on-surface font-bold">{recipe.title}</h4>
                          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{recipe.description}</p>
                        </div>
                      </div>
                      <div className="px-5 pb-5 pt-2">
                        <button 
                          onClick={() => handleCreateRoom(recipe)}
                          className="w-full bg-primary text-on-primary py-3 rounded-2xl text-xs font-bold shadow-md hover:bg-primary-container active:scale-95 transition-transform flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-lg">local_fire_department</span>
                          Open Cooking Session
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              // --- ACTIVE CO-COOKING ROOM VIEW ---
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* Checklist Panel */}
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-surface-container-low border border-outline-variant/20 rounded-[32px] p-6 shadow-md space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-outline-variant/15 pb-4">
                      <div>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-primary/20">
                          Active Kitchen Session
                        </span>
                        <h3 className="font-headline-lg-mobile text-on-surface font-bold mt-2 leading-none">{activeRoom.recipe.title}</h3>
                        <p className="text-xs text-outline mt-1.5">Hosted by {activeRoom.host_name}</p>
                      </div>
                      <button 
                        onClick={handleLeaveRoom}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-red-500/20 active:scale-95"
                      >
                        Exit Kitchen
                      </button>
                    </div>

                    {/* Shared Cooking Steps */}
                    <div className="space-y-4 pt-2">
                      <h4 className="font-title-md text-secondary font-bold text-sm uppercase tracking-wider">Shared Checklist</h4>
                      <div className="space-y-3">
                        {activeRoom.steps.map(step => (
                          <div 
                            key={step.id} 
                            onClick={() => handleToggleStep(step.id, step.completed)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start active:scale-[0.98] ${
                              step.completed 
                                ? 'bg-secondary/5 border-secondary/25' 
                                : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/20'
                            }`}
                          >
                            {/* Checkbox Icon */}
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                              step.completed 
                                ? 'bg-secondary border-secondary text-white' 
                                : 'border-outline text-transparent'
                            }`}>
                              <span className="material-symbols-outlined text-sm font-bold">done</span>
                            </div>
                            
                            {/* Step Description */}
                            <div className="flex-1 space-y-1">
                              <p className={`text-sm leading-relaxed ${step.completed ? 'text-on-surface-variant/60 line-through font-medium' : 'text-on-surface font-bold'}`}>
                                {step.text}
                              </p>
                              {step.completed && (
                                <p className="text-[10px] text-secondary font-bold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-xs">done_all</span>
                                  Completed by {step.completedBy}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Side Controls & Live Room Chat */}
                <div className="space-y-4">
                  {/* Actions & Invitations */}
                  <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-5 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kitchen Control</h4>
                    <button 
                      onClick={() => setIsInviteModalOpen(true)}
                      className="w-full bg-primary text-on-primary py-3 rounded-2xl text-xs font-bold shadow-md hover:bg-primary-container active:scale-95 transition-transform flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-lg">person_add</span>
                      Invite Friends (WS)
                    </button>
                  </div>

                  {/* Room Live Chat */}
                  <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-3xl h-96 overflow-hidden flex flex-col shadow-md">
                    {/* Log Header */}
                    <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/15 flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Kitchen Chat
                      </span>
                    </div>

                    {/* Chat Logs */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide text-xs">
                      {roomChatMessages.map((msg, index) => {
                        if (msg.sender === 'system') {
                          return (
                            <div key={index} className="text-center text-[10px] text-outline-variant font-bold bg-surface-container-low p-2 rounded-xl border border-outline-variant/10">
                              📢 {msg.text}
                            </div>
                          );
                        }

                        const isSelf = msg.sender === 'self';
                        return (
                          <div key={index} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                            <span className="text-[9px] text-outline mb-0.5 px-1">{isSelf ? 'You' : msg.sender_name}</span>
                            <div className={`max-w-[85%] px-3 py-2 rounded-xl ${isSelf ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-low border border-outline-variant/15 text-on-surface rounded-tl-none'}`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={roomChatEndRef} />
                    </div>

                    {/* Chat Form */}
                    <form onSubmit={handleSendRoomChat} className="p-3 bg-surface-container-low border-t border-outline-variant/15 flex gap-1.5">
                      <input 
                        type="text" 
                        className="flex-1 h-9 px-3 bg-surface border-none rounded-xl text-xs text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/20 shadow-inner"
                        placeholder="Message cooks..."
                        value={roomChatInput}
                        onChange={e => setRoomChatInput(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        disabled={!roomChatInput.trim()}
                        className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* --- FLOATING INVITE FRIENDS MODAL DIALOG --- */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto flex justify-center py-8 px-4">
          <div className="bg-surface dark:bg-surface-dim w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-outline-variant/35 flex flex-col max-h-[60vh] overflow-hidden animate-scale-up my-auto self-start">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-md text-on-surface font-extrabold flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-xl">group</span>
                Invite Friends
              </h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Connected Friends List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {friends.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <img className="w-9 h-9 rounded-full object-cover" src={f.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'} alt="" />
                    <span className="font-bold text-xs text-on-surface leading-tight truncate max-w-[120px]">{f.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      handleInviteFriend(f);
                      setIsInviteModalOpen(false);
                    }}
                    className="bg-primary text-on-primary text-[10px] font-bold px-3.5 py-1.5 rounded-full shadow hover:bg-primary-container active:scale-95 transition-transform"
                  >
                    Invite
                  </button>
                </div>
              ))}

              {friends.length === 0 && (
                <div className="text-center py-8 text-xs text-outline italic">
                  No friends connected yet. Connect with foodies on the Feed page to invite them!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
