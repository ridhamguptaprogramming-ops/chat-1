import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Check, CheckCheck, ImagePlus, LogOut, Send, Users } from "lucide-react";
import type { Socket } from "socket.io-client";
import { api, login, signup, type Chat, type Message, type User } from "./api";
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
  const socketRef = useRef<Socket | null>(null);

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
    return <AuthScreen onAuth={(user, accessToken) => {
      localStorage.setItem("accessToken", accessToken);
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

function AuthScreen({ onAuth }: { onAuth: (user: User, token: string) => void }) {
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
