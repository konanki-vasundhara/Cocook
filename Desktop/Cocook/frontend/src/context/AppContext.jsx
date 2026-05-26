import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

const AppContext = createContext();

// ================= ENV VARIABLES =================

// Uses .env value if available,
// otherwise falls back to your EC2 backend URL

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://13.60.13.36:8000";

const WS_BASE_URL =
  API_BASE_URL.replace("http", "ws");

// =================================================

export function AppProvider({ children }) {

  // ================= USER =================

  const [user, setUser] = useState(() => {

    const savedUser =
      localStorage.getItem("cocook_user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  // ================= STATES =================

  const [communityPosts, setCommunityPosts] =
    useState([]);

  const [feedPosts, setFeedPosts] =
    useState([]);

  const [stories, setStories] =
    useState([]);

  const [pendingRequests, setPendingRequests] =
    useState([]);

  const [sentRequests, setSentRequests] =
    useState([]);

  const [friends, setFriends] =
    useState([]);

  const [socket, setSocket] =
    useState(null);

  // ================= FETCH DATA =================

  const fetchData = async () => {

    const token =
      localStorage.getItem("cocook_token");

    if (!token) return;

    try {

      // -------- Feed --------

      const feedRes = await fetch(
        `${API_BASE_URL}/api/feed?token=${token}`
      );

      if (feedRes.ok) {

        const data =
          await feedRes.json();

        setFeedPosts(data);
      }

      // -------- Community --------

      const commRes = await fetch(
        `${API_BASE_URL}/api/community?token=${token}`
      );

      if (commRes.ok) {

        const data =
          await commRes.json();

        setCommunityPosts(data);
      }

      // -------- Stories --------

      const storyRes = await fetch(
        `${API_BASE_URL}/api/stories?token=${token}`
      );

      if (storyRes.ok) {

        const data =
          await storyRes.json();

        setStories(data);
      }

      // -------- Pending Requests --------

      const reqRes = await fetch(
        `${API_BASE_URL}/api/friends/pending?token=${token}`
      );

      if (reqRes.ok) {

        const data =
          await reqRes.json();

        setPendingRequests(data);
      }

      // -------- Sent Requests --------

      const sentRes = await fetch(
        `${API_BASE_URL}/api/friends/sent?token=${token}`
      );

      if (sentRes.ok) {

        const data =
          await sentRes.json();

        setSentRequests(data);
      }

      // -------- Friends --------

      const friendsRes = await fetch(
        `${API_BASE_URL}/api/friends/list?token=${token}`
      );

      if (friendsRes.ok) {

        const data =
          await friendsRes.json();

        setFriends(data);
      }

    } catch (error) {

      console.error(
        "Fetch Error:",
        error
      );
    }
  };

  // ================= INITIAL FETCH =================

  useEffect(() => {

    if (user) {

      fetchData();
    }

  }, [user]);

  // ================= WEBSOCKET =================

  useEffect(() => {

    const token =
      localStorage.getItem("cocook_token");

    if (!token) return;

    const ws = new WebSocket(
      `${WS_BASE_URL}/ws?token=${token}`
    );

    ws.onopen = () => {

      console.log(
        "WebSocket Connected"
      );

      setSocket(ws);
    };

    ws.onmessage = (event) => {

      const message =
        JSON.parse(event.data);

      console.log(
        "WS Message:",
        message
      );

      // Auto refresh when websocket updates arrive
      fetchData();
    };

    ws.onerror = (error) => {

      console.error(
        "WebSocket Error:",
        error
      );
    };

    ws.onclose = () => {

      console.log(
        "WebSocket Closed"
      );

      setSocket(null);
    };

    return () => {

      ws.close();
    };

  }, [user]);

  // ================= ADD COMMUNITY POST =================

  const addCommunityPost = async (post) => {

    const token =
      localStorage.getItem("cocook_token");

    if (!token) {

      alert("Please login first!");

      return;
    }

    try {

      const res = await fetch(
        `${API_BASE_URL}/api/community?token=${token}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            content: post.text
          })
        }
      );

      if (res.ok) {

        fetchData();

      } else {

        alert(
          "Failed to create post"
        );
      }

    } catch (error) {

      console.error(error);

      alert(
        "Backend connection failed"
      );
    }
  };

  // ================= ADD FEED POST =================

  const addFeedPost = async (recipe) => {

    const token =
      localStorage.getItem("cocook_token");

    if (!token) {

      alert("Please login first!");

      return false;
    }

    try {

      const res = await fetch(
        `${API_BASE_URL}/api/feed?token=${token}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            title: recipe.title,
            content: recipe.content,
            image_url: recipe.image,
            file_type:
              recipe.file_type || "image",
            filter_style:
              recipe.filter_style || "",
            tags:
              recipe.tags?.join(",") || "",
            time_estimate:
              recipe.time
          })
        }
      );

      if (res.ok) {

        fetchData();

        return true;
      }

      return false;

    } catch (error) {

      console.error(error);

      return false;
    }
  };

  // ================= SEND WS MESSAGE =================

  const sendWsMessage = (msg) => {

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {

      socket.send(
        JSON.stringify(msg)
      );

      return true;
    }

    return false;
  };

  // ================= PROVIDER =================

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,

        communityPosts,
        addCommunityPost,

        feedPosts,
        addFeedPost,

        stories,

        pendingRequests,
        sentRequests,

        friends,

        sendWsMessage,

        refreshData: fetchData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ================= HOOK =================

export function useAppContext() {

  return useContext(AppContext);
}
