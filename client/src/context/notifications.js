import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { makeSocket } from "../lib/socket";
import { useAuth } from "./auth";

const STORAGE_KEY_ITEMS = "notif_items";
const STORAGE_KEY_COUNT = "notif_count";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [auth] = useAuth();
  const [items, setItems] = useState([]);
  const [countUnread, setCountUnread] = useState(0);
  const socketRef = useRef(null);

  // ✅ hydrate from localStorage on first mount
  useEffect(() => {
    try {
      const cachedItems = JSON.parse(localStorage.getItem(STORAGE_KEY_ITEMS)) || [];
      const cachedCount = Number(localStorage.getItem(STORAGE_KEY_COUNT)) || 0;
      setItems(cachedItems);
      setCountUnread(cachedCount);
    } catch {
      setItems([]);
      setCountUnread(0);
    }
  }, []);

  // persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEY_COUNT, String(countUnread));
  }, [items, countUnread]);

  // server fetch
  const load = async () => {
    if (!auth?.token) return;
    try {
      const { data } = await axios.get("/api/v1/notification", {
        headers: { Authorization: auth?.token },
      });
      if (data?.success) {
        setItems(data.items || []);
        setCountUnread(data.countUnread || 0);
      }
    } catch (e) {
      console.error("Notifications load failed", e?.response?.status);
    }
  };

  // react on auth.token changes
  useEffect(() => {
    if (!auth?.token) {
      setItems([]);
      setCountUnread(0);
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_COUNT);
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // fetch after login / refresh
    load();

    // connect socket
    socketRef.current?.disconnect();
    socketRef.current = makeSocket(auth.token);

    socketRef.current.on("notification:new", (n) => {
      setItems((prev) => [
        { ...n, isRead: false, _id: n._id || Math.random().toString(36) },
        ...prev,
      ]);
      setCountUnread((prev) => prev + 1);
    });

    return () => socketRef.current?.disconnect();
  }, [auth?.token]);

  const markAllRead = async () => {
    try {
      await axios.put(
        "/api/v1/notification/read-all",
        {},
        { headers: { Authorization: auth?.token } }
      );
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCountUnread(0);
    } catch {}
  };

  const value = useMemo(
    () => ({ items, countUnread, markAllRead, reload: load }),
    [items, countUnread]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
