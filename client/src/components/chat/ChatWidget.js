import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Picker from "emoji-picker-react";
import { initSocket, getSocket } from "../../chat/socket";
import { useAuth } from "../../context/auth";
import "./chat.css";

export default function ChatWidget() {
  const [auth, , , , refreshToken] = useAuth();
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const emojiPopRef = useRef(null);
  const socketRef = useRef(null);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.REACT_APP_API || "http://localhost:8080",
      withCredentials: true,
    });
    instance.interceptors.request.use(async (cfg) => {
      const ctx = auth || JSON.parse(localStorage.getItem("auth") || "{}");
      if (ctx?.token) {
        // Remove "Bearer " prefix for socket auth consistency
        const cleanToken = ctx.token.startsWith("Bearer ") ? ctx.token.slice(7) : ctx.token;
        cfg.headers.Authorization = cleanToken;
      } else if (ctx?.refreshToken) {
        const newToken = await refreshToken();
        if (newToken) {
          cfg.headers.Authorization = newToken;
        }
      }
      return cfg;
    });
    return instance;
  }, [auth, refreshToken]);

  useEffect(() => {
    if (!auth?.token) return;

    const initializeSocket = async () => {
      socketRef.current = initSocket(auth.token);
      
      socketRef.current.on("connect_error", async (error) => {
        if (error.message === "UNAUTHORIZED" && auth?.refreshToken) {
          console.log("Attempting token refresh for socket");
          const newToken = await refreshToken();
          if (newToken) {
            socketRef.current.disconnect();
            socketRef.current = initSocket(newToken);
          }
        }
      });
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [auth?.token, auth?.refreshToken, refreshToken]);

  const scrollToEnd = () => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!open || !auth?.token || !socketRef.current) return;
    
    let disposed = false;
    setLoading(true);

    (async () => {
      try {
        // Get user's room
        const { data: myRoom } = await api.get("/api/v1/chat/rooms/me");
        if (disposed) return;

        if (auth?.user?.role === 1) {
          // Admin: Fetch all rooms
          const { data: adminRooms } = await api.get("/api/v1/chat/rooms");
          setRooms(adminRooms);
          if (adminRooms.length > 0) {
            setRoom(adminRooms[0]);
          } else {
            setRoom(null);
          }
        } else {
          // Non-admin: Use personal room
          setRoom(myRoom);
        }

        if (room?._id && room._id !== "admin") {
          const { data } = await api.get(`/api/v1/chat/rooms/${room._id}/messages`);
          setMessages(data.messages);
          setTimeout(scrollToEnd, 0);
        } else {
          setMessages([]);
        }
        

        const s = socketRef.current;
        if (room?._id && room._id !== "admin") {
          s.emit("join", { roomId: room._id });
        }

        const onNew = (msg) => {
          if (msg.room === room?._id) {
            setMessages((prev) => {
              if (prev.some((existingMsg) => existingMsg._id === msg._id)) {
                return prev;
              }
              return [...prev, msg];
            });
            setTimeout(scrollToEnd, 10);
          }
        };
        
        s.on("message:new", onNew);
        
        return () => {
          s.off("message:new", onNew);
        };
      } catch (error) {
        console.error("Error in chat setup:", error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [open, auth?.token, room?._id, api, auth?.user?.role]);

  useEffect(() => {
    if (!showEmoji) return;
    const onKey = (e) => e.key === "Escape" && setShowEmoji(false);
    const onClickOutside = (e) => {
      if (emojiPopRef.current && !emojiPopRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [showEmoji]);

  const sendText = async () => {
    if (!text.trim() || !room?._id || sending || room._id === "admin") return;
    setSending(true);
    try {
      (getSocket() || socketRef.current).emit("message:send", {
        roomId: room._id,
        text: text.trim(),
      });
      setText("");
      setShowEmoji(false);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file) => {
    if (!file || !room?._id || sending || room._id === "admin") return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const { data } = await api.post("/api/v1/chat/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      (getSocket() || socketRef.current).emit("message:send", {
        roomId: room._id,
        imageUrl: data.url,
      });
    } catch (error) {
      console.error("Error sending image:", error);
    } finally {
      setSending(false);
    }
  };

  if (!auth?.token) {
    return (
      <button className="chat-fab" onClick={() => (window.location.href = "/login")}>
        Chat
      </button>
    );
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(true)}>Chat</button>

      <div className={`chat-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      <section className={`chat-panel ${open ? "open" : ""}`}>
        <header className="chat-header">
          <div>
            <strong>Support</strong>
            <div className="chat-subtitle">We typically reply within a few minutes</div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
        </header>

        {auth?.user?.role === 1 && rooms.length > 0 && (
          <select
            value={room?._id || ""}
            onChange={(e) => {
              const selected = rooms.find(r => r._id === e.target.value);
              setRoom(selected);
            }}
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          >
            <option value="">Select a user room</option>
            {rooms.map(r => (
              <option key={r._id} value={r._id}>{r.username}</option>
            ))}
          </select>
        )}

        <main className="chat-body">
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m._id} className={`chat-line ${m.fromRole}`}>
                  {m.imageUrl ? (
                    <a className="chat-image" href={m.imageUrl} target="_blank" rel="noreferrer">
                      <img src={m.imageUrl} alt="upload" />
                    </a>
                  ) : (
                    <div className="chat-bubble">{m.text}</div>
                  )}
                  <div className="chat-time">{dayjs(m.createdAt).format("HH:mm")}</div>
                </div>
              ))}
              <div ref={endRef} />
            </>
          )}
        </main>

        <footer className="chat-inputbar">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) sendImage(f);
              e.target.value = "";
            }}
          />

          <button
            className={`icon-btn ${showEmoji ? "active" : ""}`}
            onClick={() => setShowEmoji((v) => !v)}
            title="Emoji"
            disabled={!room || room._id === "admin"}
          >
            😊
          </button>

          <button 
            className="icon-btn" 
            onClick={() => fileInputRef.current?.click()} 
            title="Send image"
            disabled={!room || room._id === "admin"}
          >
            📷
          </button>

          <input
            className="chat-text"
            placeholder={!room || room._id === "admin" ? "Select a user to chat" : "Type your message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendText()}
            disabled={!room || room._id === "admin"}
          />

          <button 
            className="send-btn" 
            onClick={sendText} 
            disabled={sending || !text.trim() || !room || room._id === "admin"}
          >
            ➤
          </button>

          {showEmoji && (
            <div ref={emojiPopRef} className="emoji-popover" onMouseDown={(e) => e.preventDefault()}>
              <div className="emoji-popover-header">
                <span>Emoji</span>
                <button className="emoji-close" onClick={() => setShowEmoji(false)}>×</button>
              </div>
              <Picker
                onEmojiClick={(emojiData) => setText((t) => (t || "") + (emojiData?.emoji || ""))}
                searchDisabled
                height={320}
                width="100%"
              />
            </div>
          )}
        </footer>
      </section>
    </>
  );
}