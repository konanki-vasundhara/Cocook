import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// API URL from .env
const API = import.meta.env.VITE_API_URL;

// WebSocket URL
const WS_URL = API.replace('http', 'ws');

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

      // Feed
      const feedRes = await fetch(`${API}/api/feed?token=${token}`);
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
          authorAvatar: p.author.avatar || '',
          created_at: p.created_at
        })));
      }

      // Community
      const commRes = await fetch(`${API}/api/community?token=${token}`);
      if (commRes.ok) {
        const data = await commRes.json();

        setCommunityPosts(data.map(p => ({
          id: p.id,
          author: p.author.name,
          authorAvatar: p.author.avatar || '',
          time: new Date(p.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          text: p.content,
          likes: p.likes,
          comments: p.comments,
          group: 'The Sizzle Crew'
        })));
      }

      // Stories
      const storyRes = await fetch(`${API}/api/stories?token=${token}`);
      if (storyRes.ok) {
        const data = await storyRes.json();
        setStories(data);
      }

      // Pending Requests
      const reqRes = await fetch(`${API}/api/friends/pending?token=${token}`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setPendingRequests(data);
      }

      // Sent Requests
      const sentRes = await fetch(`${API}/api/friends/sent?token=${token}`);
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data);
      }

      // Friends
      const friendsRes = await fetch(`${API}/api/friends/list?token=${token}`);
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

  // WebSocket
  useEffect(() => {

    const token = localStorage.getItem('cocook_token');

    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket Connected");
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
            authorAvatar: p.author.avatar || '',
            time: new Date(p.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
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
            image: p.image_url || '',
            file_type: p.file_type || 'image',
            filter_style: p.filter_style || '',
            tags: p.tags ? p.tags.split(',') : [],
            likes: p.likes,
            comments: p.comments,
            time: p.time_estimate || '15 mins',
            author: p.author.name,
            authorAvatar: p.author.avatar || '',
            created_at: p.created_at
          },
          ...prev
        ]);

      } else if (message.action === 'new_story') {

        const s = message.data;
        setStories(prev => [s, ...prev]);

      } else if (message.action === 'delete_story') {

        const deletedId = message.data.id;
        setStories(prev => prev.filter(st => st.id !== deletedId));

      } else if (
        message.action === 'friend_request_received' ||
        message.action === 'friend_request_accepted'
      ) {

        fetchData();

      } else if (message.action === 'co_cook_event') {

        const ev = new CustomEvent('co_cook_message', {
          detail: message
        });

        window.dispatchEvent(ev);

      } else if (message.action === 'dm_message') {

        const ev = new CustomEvent('dm_message', {
          detail: message
        });

        window.dispatchEvent(ev);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket Closed");
    };

    return () => {
      ws.close();
      setSocket(null);
    };

  }, [user]);

  // Add Community Post
  const addCommunityPost = async (post) => {

    const token = localStorage.getItem('cocook_token');

    if (!token) return alert('Please login first!');

    try {

      await fetch(`${API}/api/community?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: post.text
        })
      });

    } catch (e) {
      console.warn("Backend down.");
    }
  };

  // Add Feed Post
  const addFeedPost = async (recipe) => {

    const token = localStorage.getItem('cocook_token');

    if (!token) {
      alert('Please login first!');
      return false;
    }

    try {

      const res = await fetch(`${API}/api/feed?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
      }

      return false;

    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Search Users
  const searchUsers = async (query) => {

    const token = localStorage.getItem('cocook_token');

    if (!token) return [];

    try {

      const res = await fetch(`${API}/api/users/search?token=${token}&query=${query}`);

      if (res.ok) {
        return await res.json();
      }

    } catch (e) {
      console.warn(e);
    }

    return [];
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      communityPosts,
      feedPosts,
      stories,
      pendingRequests,
      sentRequests,
      friends,
      addCommunityPost,
      addFeedPost,
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
