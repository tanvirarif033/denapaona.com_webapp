// client/src/components/chat/ChatWidget.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Picker from "emoji-picker-react";
import { initSocket, getSocket } from "../../chat/socket";
import "./chat.css";

export default function ChatWidget({ auth }) {
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const emojiPopRef = useRef(null);

  // Axios (always raw token in Authorization)
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.REACT_APP_API || "http://localhost:8080",
      withCredentials: true,
    });
    instance.interceptors.request.use((cfg) => {
      const ctx = auth || JSON.parse(localStorage.getItem("auth") || "{}");
      if (ctx?.token) cfg.headers.Authorization = ctx.token; // no Bearer
      return cfg;
    });
    return instance;
  }, [auth]);

  const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  // open => load room + messages + socket listeners
  useEffect(() => {
    if (!open || !auth?.token) return;
    let disposed = false;

    (async () => {
      const { data: myRoom } = await api.get("/api/v1/chat/rooms/me");
      if (disposed) return;
      setRoom(myRoom);

      const { data } = await api.get(`/api/v1/chat/rooms/${myRoom._id}/messages`);
      setMessages(data.messages);
      setTimeout(scrollToEnd, 0);

      const s = initSocket(auth.token);
      s.emit("join", { roomId: myRoom._id });
      s.emit("message:seen", { roomId: myRoom._id });

      const onNew = (msg) => {
        if (msg.room === myRoom._id) {
          setMessages((p) => [...p, msg]);
          setTimeout(scrollToEnd, 10);
        }
      };
      s.on("message:new", onNew);
      return () => s.off("message:new", onNew);
    })();

    return () => {
      disposed = true;
    };
  }, [open, auth?.token, api]);

  // close emoji on ESC/click outside
  useEffect(() => {
    if (!showEmoji) return;
    const onKey = (e) => e.key === "Escape" && setShowEmoji(false);
    const onClickOutside = (e) => {
      if (emojiPopRef.current && !emojiPopRef.current.contains(e.target)) setShowEmoji(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [showEmoji]);

  const sendText = async () => {
    if (!text.trim() || !room || sending) return;
    setSending(true);
    try {
      (getSocket() || initSocket(auth.token)).emit("message:send", {
        roomId: room._id,
        text: text.trim(),
      });
      setText("");
      setShowEmoji(false);
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file) => {
    if (!file || !room || sending) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const { data } = await api.post("/api/v1/chat/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      (getSocket() || initSocket(auth.token)).emit("message:send", {
        roomId: room._id,
        imageUrl: data.url,
      });
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

        <main className="chat-body">
          {messages.map((m) => (
            <div key={m._id || Math.random()} className={`chat-line ${m.fromRole}`}>
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
          >
            😊
          </button>

          <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Send image">
            📷
          </button>

          <input
            className="chat-text"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendText()}
          />

          <button className="send-btn" onClick={sendText} disabled={sending || !text.trim()}>
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
