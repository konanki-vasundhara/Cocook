import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  API_BASE_URL,
  WS_BASE_URL
} from "../config";

const AppContext = createContext();

export function AppProvider({ children }) {

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cocook_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [communityPosts, setCommunityPosts] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [friends, setFriends] = useState([]);
  const [socket, setSocket] = useState(null);

  const token = localStorage.getItem("cocook_token");

  // ================= FETCH DATA =================

  const fetchData = async () => {

    if (!token) return;

    try {

      const [
        feedRes,
        communityRes,
        storiesRes,
        friendsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/feed?token=${token}`),
        fetch(`${API_BASE_URL}/api/community?token=${token}`),
        fetch(`${API_BASE_URL}/api/stories?token=${token}`),
        fetch(`${API_BASE_URL}/api/friends/list?token=${token}`)
      ]);

      // FEED
      if (feedRes.ok) {
        const data = await feedRes.json();

        setFeedPosts(Array.isArray(data) ? data : []);
      }

      // COMMUNITY
      if (communityRes.ok) {
        const data = await communityRes.json();

        setCommunityPosts(Array.isArray(data) ? data : []);
      }

      // STORIES
      if (storiesRes.ok) {
        const data = await storiesRes.json();

        setStories(Array.isArray(data) ? data : []);
      }

      // FRIENDS
      if (friendsRes.ok) {
        const data = await friendsRes.json();

        setFriends(Array.isArray(data) ? data : []);
      }

    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // ================= WEBSOCKET =================

  useEffect(() => {

    if (!token || !user) return;

    let ws;

    try {

      ws = new WebSocket(
        `${WS_BASE_URL}/ws?token=${token}`
      );

      ws.onopen = () => {
        console.log("WS Connected");
        setSocket(ws);
      };

      ws.onmessage = (event) => {

        try {

          const message = JSON.parse(event.data);

          if (message.action === "new_post") {
            setCommunityPosts(prev => [
              message.data,
              ...prev
            ]);
          }

          if (message.action === "new_feed_post") {
            setFeedPosts(prev => [
              message.data,
              ...prev
            ]);
          }

        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket Error", e);
      };

    } catch (err) {
      console.error("WS init failed:", err);
    }

    return () => {
      if (ws) ws.close();
    };

  }, [user]);

  // ================= POSTS =================

  const addCommunityPost = async (post) => {

    if (!token) return;

    try {

      await fetch(
        `${API_BASE_URL}/api/community?token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            content: post.text
          })
        }
      );

      fetchData();

    } catch (e) {
      console.error(e);
    }
  };

  const likeCommunityPost = (id) => {

    setCommunityPosts(prev =>
      prev.map(post =>
        post.id === id
          ? {
              ...post,
              likes: (post.likes || 0) + 1
            }
          : post
      )
    );
  };

  const sendWsMessage = (msg) => {

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(JSON.stringify(msg));
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        communityPosts,
        feedPosts,
        stories,
        friends,
        addCommunityPost,
        likeCommunityPost,
        sendWsMessage,
        refreshData: fetchData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
