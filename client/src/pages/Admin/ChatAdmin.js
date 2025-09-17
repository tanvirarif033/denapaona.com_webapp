import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Picker from "emoji-picker-react";
import { initSocket, getSocket } from "../../chat/socket";
import "./chat-admin.css";

dayjs.extend(relativeTime);

export default function ChatAdmin({ auth }) {
  const [rooms, setRooms] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);

  const endRef = useRef(null);
  const emojiRef = useRef(null);
  const socketRef = useRef(null);
  const currentRoomIdRef = useRef(null);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.REACT_APP_API || "http://localhost:8080",
      withCredentials: true,
    });
    instance.interceptors.request.use((cfg) => {
      const ctx = auth || JSON.parse(localStorage.getItem("auth") || "{}");
      if (ctx?.token) {
        const cleanToken = ctx.token.startsWith("Bearer ") ? ctx.token.slice(7) : ctx.token;
        cfg.headers.Authorization = cleanToken;
      }
      return cfg;
    });
    return instance;
  }, [auth]);

  const scrollToEnd = () => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/v1/chat/rooms");
        setRooms(data);
      } catch (e) {
        console.error("rooms failed", e?.response?.status, e?.response?.data || e.message);
      }
    })();
  }, [api]);

  useEffect(() => {
    if (!auth?.token) return;

    // Initialize socket once
    socketRef.current = initSocket(auth.token);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [auth?.token]);

  useEffect(() => {
    if (!active || !auth?.token || !socketRef.current) return;
    
    let disposed = false;
    setLoading(true);
    currentRoomIdRef.current = active._id;

    (async () => {
      try {
        const { data } = await api.get(`/api/v1/chat/rooms/${active._id}/messages`);
        if (disposed || currentRoomIdRef.current !== active._id) return;
        
        setMessages(data.messages);
        setTimeout(scrollToEnd, 0);

        // Join the room and mark as seen
        socketRef.current.emit("join", { roomId: active._id });
        socketRef.current.emit("message:seen", { roomId: active._id });

        const onNew = (msg) => {
          // Only add message if it's for the currently active room
          if (msg.room === active._id) {
            setMessages((p) => [...p, msg]);
            setTimeout(scrollToEnd, 10);
          }
        };
        
        socketRef.current.on("message:new", onNew);
        
        return () => {
          socketRef.current.off("message:new", onNew);
        };
      } catch (e) {
        console.error("messages failed", e?.response?.status, e?.response?.data || e.message);
      } finally {
        if (!disposed && currentRoomIdRef.current === active._id) {
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
    };
  }, [active, auth?.token, api]);

  useEffect(() => {
    if (!showEmoji) return;
    const onKey = (e) => e.key === "Escape" && setShowEmoji(false);
    const onClick = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [showEmoji]);

  const handleRoomChange = (room) => {
    // Clear current messages immediately when switching rooms
    setMessages([]);
    setActive(room);
  };

  const send = () => {
    if (!text.trim() || !active) return;
    socketRef.current.emit("message:send", {
      roomId: active._id,
      text: text.trim(),
    });
    setText("");
  };

  const sendImage = async (file) => {
    if (!file || !active) return;
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post("/api/v1/chat/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    socketRef.current.emit("message:send", {
      roomId: active._id,
      imageUrl: data.url,
    });
  };

  return (
    <div className="chat-admin">
      <aside className="chat-admin__list">
        <div className="chat-admin__search">
          <input placeholder="Search users..." />
        </div>
        <div className="chat-admin__rooms">
          {rooms.map((r) => (
            <button
              key={r._id}
              className={`room ${active?._id === r._id ? "active" : ""}`}
              onClick={() => handleRoomChange(r)}
            >
              <div className="avatar">{(r.username || "U").slice(0, 1).toUpperCase()}</div>
              <div className="meta">
                <div className="top">
                  <div className="name">{r.username}</div>
                  <div className="time">
                    {r.lastMessageAt ? dayjs(r.lastMessageAt).fromNow() : "—"}
                  </div>
                </div>
                <div className="bottom">
                  <div className="preview">{r.lastPreview || ""}</div>
                  {r.unreadForAdmin > 0 && <div className="badge">{r.unreadForAdmin}</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-admin__conv">
        <div className="conv__header">
          <div className="title">{active?.username || "Pick a chat"}</div>
        </div>

        <div className="conv__body">
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m._id} className={`chat-line ${m.fromRole === "admin" ? "user" : "admin"}`}>
                  {m.imageUrl ? (
                    <a href={m.imageUrl} target="_blank" rel="noreferrer" className="chat-image">
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
        </div>

        {active && (
          <div className="conv__footer">
            <button className="icon-btn" onClick={() => setShowEmoji((v) => !v)} title="Emoji">😊</button>
            <label className="icon-btn" title="Send image" style={{ cursor: "pointer" }}>
              📷
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) sendImage(f);
                  e.target.value = "";
                }}
              />
            </label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a reply..."
              className="chat-text"
            />
            <button className="send-btn" onClick={send}>Send</button>

            {showEmoji && (
              <div ref={emojiRef} className="emoji-popover admin" onMouseDown={(e) => e.preventDefault()}>
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
          </div>
        )}
      </section>
    </div>
  );
}