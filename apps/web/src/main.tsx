import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Check, CheckCheck, ImagePlus, LogOut, Send, Users } from "lucide-react";
import type { Socket } from "socket.io-client";
import { GOOGLE_LOGIN_URL, api, login, signup, type Chat, type Message, type User } from "./api";
import { connectSocket } from "./socket";
import "./styles.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [authNotice, setAuthNotice] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const authError = params.get("authError");

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      setToken(accessToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (authError) {
      localStorage.removeItem("accessToken");
      setToken(null);
      setAuthNotice(authError === "google_not_configured"
        ? "Google login needs client credentials in the backend .env file."
        : "Google login failed. Try again or use email login.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    api<{ user: User }>("/me").then(({ user }) => setUser(user)).catch(() => setToken(null));
    api<{ chats: Chat[] }>("/chats").then(({ chats }) => {
      setChats(chats);
      setActiveChatId(chats[0]?.id ?? null);
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("message:new", ({ message }: { message: Message }) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      socket.emit("message:delivered", { messageId: message.id });
    });
    socket.on("typing:update", ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers((current) => {
        const next = new Set(current);
        isTyping ? next.add(userId) : next.delete(userId);
        return next;
      });
    });
    socket.on("presence:update", ({ userId, status }: { userId: string; status: "online" | "offline" }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        status === "online" ? next.add(userId) : next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!activeChatId) return;
    api<{ messages: Message[] }>(`/chats/${activeChatId}/messages`).then(({ messages }) => setMessages(messages));
    socketRef.current?.emit("chat:join", { chatId: activeChatId });
  }, [activeChatId]);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId) ?? null, [chats, activeChatId]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
    setChats([]);
    setMessages([]);
  }

  if (!token || !user) {
    return <AuthScreen notice={authNotice} onAuth={(user, accessToken) => {
      localStorage.setItem("accessToken", accessToken);
      setAuthNotice("");
      setUser(user);
      setToken(accessToken);
    }} />;
  }

  return (
    <main className="app-shell">
      <aside className="chat-list">
        <div className="pane-header">
          <div>
            <strong>{user.displayName}</strong>
            <span>Available</span>
          </div>
          <button className="icon-button" onClick={handleLogout} aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
        <button className="new-chat-button">
          <Users size={18} />
          New chat
        </button>
        <div className="chat-items">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`chat-row ${chat.id === activeChatId ? "active" : ""}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="avatar">{chatTitle(chat, user).slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{chatTitle(chat, user)}</strong>
                <span>{chat.messages?.[0]?.body ?? "No messages yet"}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="conversation">
        {activeChat ? (
          <>
            <header className="conversation-header">
              <div className="avatar large">{chatTitle(activeChat, user).slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{chatTitle(activeChat, user)}</strong>
                <span>{onlineUsers.size ? "Online now" : "Offline"}</span>
              </div>
            </header>
            <MessageList messages={messages} currentUserId={user.id} />
            <Composer
              chatId={activeChat.id}
              socket={socketRef.current}
              typing={typingUsers.size > 0}
              onLocalMessage={(message) => setMessages((current) => [...current, message])}
            />
          </>
        ) : (
          <div className="empty-state">Select a chat or create a new one.</div>
        )}
      </section>
    </main>
  );
}

function AuthScreen({ notice, onAuth }: { notice: string; onAuth: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = mode === "login"
        ? await login(identifier, password)
        : await signup(displayName, identifier, password);
      onAuth(result.user, result.accessToken);
    } catch {
      setError("Authentication failed. Check your details and try again.");
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <h1>Chat</h1>
        <a className="google-button" href={GOOGLE_LOGIN_URL}>
          <GoogleMark />
          Continue with Google
        </a>
        {notice && <p className="form-notice">{notice}</p>}
        <div className="auth-divider"><span>or</span></div>
        <div className="segmented">
          <button type="button" className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Login</button>
          <button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        {mode === "signup" && (
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
        )}
        <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Email or phone" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit">{mode === "login" ? "Login" : "Create account"}</button>
      </form>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.34A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.06l3-2.34Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .96 4.94l3 2.34C4.67 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

function MessageList({ messages, currentUserId }: { messages: Message[]; currentUserId: string }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="messages">
      {messages.map((message) => {
        const mine = message.senderId === currentUserId;
        return (
          <article key={message.id} className={`message ${mine ? "mine" : ""}`}>
            {!mine && <span className="sender">{message.sender.displayName}</span>}
            <p>{message.body}</p>
            <footer>
              <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
              {mine && <ReceiptIcon status={bestReceipt(message)} />}
            </footer>
          </article>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function Composer({ chatId, socket, typing, onLocalMessage }: {
  chatId: string;
  socket: Socket | null;
  typing: boolean;
  onLocalMessage: (message: Message) => void;
}) {
  const [body, setBody] = useState("");
  const typingTimer = useRef<number | undefined>(undefined);

  function notifyTyping() {
    socket?.emit("typing:start", { chatId });
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => socket?.emit("typing:stop", { chatId }), 1200);
  }

  function send() {
    const text = body.trim();
    if (!text || !socket) return;
    setBody("");
    socket.emit("message:send", { chatId, body: text, kind: "TEXT", clientId: crypto.randomUUID() }, (response: { ok: boolean; message?: Message }) => {
      if (response.ok && response.message) onLocalMessage(response.message);
    });
    socket.emit("typing:stop", { chatId });
  }

  return (
    <footer className="composer-wrap">
      <div className={`typing-line ${typing ? "visible" : ""}`}>Typing...</div>
      <div className="composer">
        <button className="icon-button" aria-label="Attach media">
          <ImagePlus size={20} />
        </button>
        <textarea
          value={body}
          rows={1}
          onChange={(event) => {
            setBody(event.target.value);
            notifyTyping();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Message"
        />
        <button className="send-button" onClick={send} aria-label="Send message">
          <Send size={18} />
        </button>
      </div>
    </footer>
  );
}

function ReceiptIcon({ status }: { status: "SENT" | "DELIVERED" | "READ" }) {
  if (status === "SENT") return <Check size={14} />;
  return <CheckCheck size={14} className={status === "READ" ? "read" : ""} />;
}

function bestReceipt(message: Message): "SENT" | "DELIVERED" | "READ" {
  const statuses = message.receipts?.map((receipt) => receipt.status) ?? [];
  if (statuses.includes("READ")) return "READ";
  if (statuses.includes("DELIVERED")) return "DELIVERED";
  return "SENT";
}

function chatTitle(chat: Chat, currentUser: User) {
  if (chat.type === "GROUP") return chat.title ?? "Group chat";
  return chat.members.find((member) => member.user.id !== currentUser.id)?.user.displayName ?? "Direct chat";
}

createRoot(document.getElementById("root")!).render(<App />);
