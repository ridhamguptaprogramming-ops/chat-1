const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type User = {
  id: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type Chat = {
  id: string;
  type: "DIRECT" | "GROUP";
  title?: string | null;
  members: Array<{ user: User }>;
  messages: Message[];
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  body?: string | null;
  kind: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "SYSTEM";
  createdAt: string;
  sender: User;
  receipts?: Array<{ userId: string; status: "SENT" | "DELIVERED" | "READ" }>;
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function login(identifier: string, password: string) {
  const isEmail = identifier.includes("@");
  return api<{ user: User; accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      [isEmail ? "email" : "phone"]: identifier,
      password
    })
  });
}

export async function signup(displayName: string, identifier: string, password: string) {
  const isEmail = identifier.includes("@");
  return api<{ user: User; accessToken: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      displayName,
      [isEmail ? "email" : "phone"]: identifier,
      password
    })
  });
}
