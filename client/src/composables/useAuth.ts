import { ref, computed } from "vue";
import { API_URL } from "@/config";

const token = ref<string | null>(localStorage.getItem("token"));
const user = ref<{ id: string; username: string; email: string } | null>(
  JSON.parse(localStorage.getItem("user") || "null")
);

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value);

  // kept so existing pages that call setToken(...) still work
  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem("token", newToken);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Login failed");

    setToken(data.token);
    user.value = data.user;
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  async function signup(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Sign up failed");
    return data.user;
  }

  // fetch wrapper: adds the token, and logs out on 401
  async function authFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token.value}`,
      },
    });
    if (res.status === 401) {
      logout();
      window.location.href = "/login";
    }
    return res;
  }

  return { token, user, isLoggedIn, setToken, logout, login, signup, authFetch };
}