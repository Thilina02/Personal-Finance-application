"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type CategoryType = "INCOME" | "EXPENSE";

interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export default function CategoriesPage() {
  const { user, token, logout, initialized } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [editingId, setEditingId] = useState<number | null>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        logout();
        router.replace("/auth/login");
        return;
      }
      const data = (await res.json()) as Category[];
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;

    if (!user || !token) {
      router.replace("/auth/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user, token]);

  const resetForm = () => {
    setName("");
    setType("EXPENSE");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API_BASE_URL}/categories/${editingId}`
        : `${API_BASE_URL}/categories`;
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({ name, type }),
      });
      if (!res.ok) throw new Error("Failed to save category");
      await loadData();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setType(category.type);
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (
      !window.confirm(
        "Delete this category? Note: you cannot delete categories that are used by existing transactions."
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          body.message ||
          (res.status === 400
            ? "Cannot delete this category because it is in use."
            : "Failed to delete category");
        throw new Error(message);
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
    }
  };

  if (!initialized || !user) return null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="logo">FinanceBoard</h1>
        <nav className="nav">
          <a href="/dashboard" className="nav-item">
            Dashboard
          </a>
          <a href="/transactions" className="nav-item">
            Transactions
          </a>
          <a href="/budgets" className="nav-item">
            Budgets
          </a>
          <a href="/categories" className="nav-item nav-item-active">
            Categories
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
          <button className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="content">
        <header className="content-header">
          <div>
            <h2>Categories</h2>
            <p>Organize your income and expense groups</p>
          </div>
        </header>

        {error && <p className="error-text">{error}</p>}

        <section className="grid grid-2">
          <div className="card">
            <h3>{editingId ? "Edit category" : "Add category"}</h3>
            <form
              onSubmit={handleSubmit}
              className="auth-form"
              style={{ marginTop: 6 }}
            >
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CategoryType)}
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit">
                  {editingId ? "Save changes" : "Add category"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h3>All categories</h3>
            {loading ? (
              <p className="muted">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="muted">No categories yet.</p>
            ) : (
              <ul className="list" style={{ marginTop: 8 }}>
                {categories.map((c) => (
                  <li key={c.id} className="list-row">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {c.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-soft)",
                          marginTop: 2,
                        }}
                      >
                        {c.type === "INCOME" ? "Income" : "Expense"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

