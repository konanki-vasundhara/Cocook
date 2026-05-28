import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL, WS_URL } from '../config';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Load user from local storage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cocook_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [communityPosts, setCommunityPosts] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [socket, setSocket] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return;

    try {
      // 1. Fetch Feed
      const feedRes = await fetch(`${API_URL}/api/feed?token=${token}`);
      if (feedRes.ok) {
        const data = await feedRes.json();
        setFeedPosts(data.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content,
          image: p.image_url || 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
          file_type: p.file_type || 'image',
          filter_style: p.filter_style || '',
          tags: p.tags ? p.tags.split(',') : [],
          likes: p.likes,
          comments: p.comments,
          time: p.time_estimate || '15 mins',
          author: p.author.name,
          authorAvatar: p.author.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv',
          created_at: p.created_at
        })));
      }

      // 2. Fetch Community Posts
      const commRes = await fetch(`${API_URL}/api/community?token=${token}`);
      if (commRes.ok) {
        const data = await commRes.json();
        setCommunityPosts(data.map(p => ({
          id: p.id,
          author: p.author.name,
          authorAvatar: p.author.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv',
          time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: p.content,
          likes: p.likes,
          comments: p.comments,
          group: 'The Sizzle Crew'
        })));
      }

      // 3. Fetch Active Stories
      const storyRes = await fetch(`${API_URL}/api/stories?token=${token}`);
      if (storyRes.ok) {
        const data = await storyRes.json();
        setStories(data);
      }

      // 4. Fetch Pending Requests
      const reqRes = await fetch(`${API_URL}/api/friends/pending?token=${token}`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setPendingRequests(data);
      }

      // Fetch Sent Requests
      const sentRes = await fetch(`${API_URL}/api/friends/sent?token=${token}`);
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data);
      }

      // 5. Fetch Friends
      const friendsRes = await fetch(`${API_URL}/api/friends/list?token=${token}`);
      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data);
      }

    } catch (e) {
      console.warn("Error fetching data:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
    
    ws.onopen = () => {
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.action === 'new_post') {
        const p = message.data;
        setCommunityPosts(prev => [
          {
            id: p.id,
            author: p.author.name,
            authorAvatar: p.author.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv',
            time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: p.content,
            likes: p.likes,
            comments: p.comments,
            group: 'The Sizzle Crew'
          },
          ...prev
        ]);
      } else if (message.action === 'new_feed_post') {
        const p = message.data;
        setFeedPosts(prev => [
          {
            id: p.id,
            title: p.title,
            content: p.content,
            image: p.image_url || 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
            file_type: p.file_type || 'image',
            filter_style: p.filter_style || '',
            tags: p.tags ? p.tags.split(',') : [],
            likes: p.likes,
            comments: p.comments,
            time: p.time_estimate || '15 mins',
            author: p.author.name,
            authorAvatar: p.author.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv',
            created_at: p.created_at
          },
          ...prev
        ]);
      } else if (message.action === 'new_story') {
        const s = message.data;
        setStories(prev => [s, ...prev.filter(st => st.id !== s.id)]);
      } else if (message.action === 'delete_story') {
        const deletedId = message.data.id;
        setStories(prev => prev.filter(st => st.id !== deletedId));
      } else if (message.action === 'friend_request_received') {
        fetchData();
      } else if (message.action === 'friend_request_accepted') {
        fetchData();
      } else if (message.action === 'co_cook_event') {
        const ev = new CustomEvent('co_cook_message', { detail: message });
        window.dispatchEvent(ev);
      } else if (message.action === 'dm_message') {
        const ev = new CustomEvent('dm_message', { detail: message });
        window.dispatchEvent(ev);
      }
    };

    return () => {
      ws.close();
      setSocket(null);
    };
  }, [user]);

  const addCommunityPost = async (post) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return alert('Please login first!');

    try {
      await fetch(`${API_URL}/api/community?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.text })
      });
    } catch (e) {
      console.warn("Backend down.");
    }
  };

  const addFeedPost = async (recipe) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) {
      alert('Please login first!');
      return false;
    }

    try {
      const res = await fetch(`${API_URL}/api/feed?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recipe.title,
          content: recipe.content,
          image_url: recipe.image,
          file_type: recipe.file_type || 'image',
          filter_style: recipe.filter_style || '',
          tags: recipe.tags.join(','),
          time_estimate: recipe.time
        })
      });
      if (res.ok) {
        fetchData();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Feed post failed:", res.status, errData);
        alert(errData.detail || `Failed to post recipe (Status: ${res.status})`);
        return false;
      }
    } catch (e) {
      console.error("Feed post error:", e);
      alert("Could not post recipe. Please check if the backend server is running.");
      return false;
    }
  };

  const askAiSuggestion = async (ingredients) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/ai/suggestion?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("AI suggestion failed:", e);
    }
    return null;
  };

  const likeCommunityPost = async (id) => {
    setCommunityPosts(communityPosts.map(post => post.id === id ? {...post, likes: post.likes + 1} : post));
  };

  const sendFriendRequest = async (receiverId) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return;
    // Optimistic UI state update: add a temp pending request to sentRequests
    const tempReq = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending",
      sender: user,
      receiver: { id: receiverId }
    };
    setSentRequests(prev => [...prev, tempReq]);

    try {
      await fetch(`${API_URL}/api/friends/request?token=${token}&receiver_id=${receiverId}`, {
        method: 'POST'
      });
      fetchData();
    } catch (e) {
      setSentRequests(prev => prev.filter(r => r.receiver_id !== receiverId));
      console.warn(e);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return;

    // Find the request to know who the friend is
    const req = pendingRequests.find(r => r.id === requestId);
    if (req) {
      // Optimistically remove from pending, and add to friends list
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      if (!friends.some(f => f.id === req.sender.id)) {
        setFriends(prev => [...prev, req.sender]);
      }
    }

    try {
      await fetch(`${API_URL}/api/friends/accept?token=${token}&request_id=${requestId}`, {
        method: 'POST'
      });
      fetchData();
    } catch (e) {
      console.warn(e);
      fetchData();
    }
  };

  const rejectFriendRequest = async (requestId) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return;

    // Optimistically remove from pending and sent
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setSentRequests(prev => prev.filter(r => r.id !== requestId));

    try {
      await fetch(`${API_URL}/api/friends/reject?token=${token}&request_id=${requestId}`, {
        method: 'POST'
      });
      fetchData();
    } catch (e) {
      console.warn(e);
      fetchData();
    }
  };

  const removeFriend = async (friendId) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return;

    // Optimistically remove friend from friends state
    setFriends(prev => prev.filter(f => f.id !== friendId));

    try {
      await fetch(`${API_URL}/api/friends/remove?token=${token}&friend_id=${friendId}`, {
        method: 'POST'
      });
      fetchData();
    } catch (e) {
      console.warn(e);
      fetchData();
    }
  };

  const sendWsMessage = (msg) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
      return true;
    }
    return false;
  };

  const searchUsers = async (query) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return [];
    try {
      const res = await fetch(`${API_URL}/api/users/search?token=${token}&query=${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  };

  const addStory = async (content, imageUrl, fileType = "image", filterStyle = "") => {
    const token = localStorage.getItem('cocook_token');
    if (!token) {
      alert('Please login first!');
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/api/stories?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          image_url: imageUrl, 
          file_type: fileType, 
          filter_style: filterStyle 
        })
      });
      if (res.ok) {
        fetchData();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Story share failed:", res.status, errData);
        alert(errData.detail || `Failed to share story (Status: ${res.status})`);
        return false;
      }
    } catch (e) {
      console.error("Story share error:", e);
      alert("Could not share story. Please check if the backend server is running.");
      return false;
    }
  };

  const deleteStory = async (storyId) => {
    const token = localStorage.getItem('cocook_token');
    if (!token) return false;
    try {
      const res = await fetch(`${API_URL}/api/stories/${storyId}?token=${token}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setStories(prev => prev.filter(s => s.id !== storyId));
        return true;
      }
    } catch (e) {
      console.warn("Error deleting story:", e);
    }
    return false;
  };

  return (
    <AppContext.Provider value={{
      user, 
      setUser, 
      communityPosts, 
      addCommunityPost, 
      likeCommunityPost,
      feedPosts,
      addFeedPost,
      askAiSuggestion,
      stories,
      addStory,
      deleteStory,
      pendingRequests,
      sentRequests,
      setSentRequests,
      friends,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      sendWsMessage,
      searchUsers,
      refreshData: fetchData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
