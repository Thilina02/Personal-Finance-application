"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

interface Category {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  amount: number;
  start_date: string;
  end_date: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export default function BudgetsPage() {
  const { user, token, logout, initialized } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    )
      .toISOString()
      .slice(0, 10),
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [catRes, budgetRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/budgets`, { headers: authHeaders() }),
      ]);
      if (catRes.status === 401 || budgetRes.status === 401) {
        logout();
        router.replace("/auth/login");
        return;
      }
      const cats = (await catRes.json()) as Category[];
      const rawBuds = (await budgetRes.json()) as any[];
      const buds: Budget[] = rawBuds.map((b) => ({
        ...b,
        amount: Number(b.amount),
      }));
      setCategories(cats.filter((c) => c.type === "EXPENSE"));
      setBudgets(buds);
    } catch (err: any) {
      setError(err.message || "Failed to load budgets");
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
    setEditingId(null);
    setForm({
      categoryId: "",
      amount: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      )
        .toISOString()
        .slice(0, 10),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const payload = {
      categoryId: Number(form.categoryId),
      amount: Number(form.amount),
      startDate: form.startDate,
      endDate: form.endDate,
    };
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API_BASE_URL}/budgets/${editingId}`
        : `${API_BASE_URL}/budgets`;
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save budget");
      await loadData();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save budget");
    }
  };

  const handleEdit = (b: Budget) => {
    setEditingId(b.id);
    setForm({
      categoryId: String(b.category_id),
      amount: String(b.amount),
      startDate: b.start_date,
      endDate: b.end_date,
    });
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Delete this budget?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/budgets/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete budget");
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete budget");
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
          <a href="/budgets" className="nav-item nav-item-active">
            Budgets
          </a>
          <a href="/categories" className="nav-item">
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
            <h2>Budgets</h2>
            <p>Set and monitor your monthly spending limits</p>
          </div>
        </header>

        {error && <p className="error-text">{error}</p>}

        <section className="grid grid-2">
          <div className="card">
            <h3>{editingId ? "Edit budget" : "Create budget"}</h3>
            <form
              onSubmit={handleSubmit}
              className="auth-form"
              style={{ marginTop: 6 }}
            >
              <label>
                Category
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Monthly amount
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Start date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  required
                />
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit">
                  {editingId ? "Save changes" : "Create budget"}
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
            <h3>Current budgets</h3>
            {loading ? (
              <p className="muted">Loading...</p>
            ) : budgets.length === 0 ? (
              <p className="muted">No budgets yet.</p>
            ) : (
              <ul className="list" style={{ marginTop: 8 }}>
                {budgets.map((b) => (
                  <li key={b.id} className="list-row column">
                    <div className="list-row">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {b.category_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-soft)",
                            marginTop: 2,
                          }}
                        >
                          {b.start_date} – {b.end_date}
                        </div>
                      </div>
                      <div style={{ fontSize: 13 }}>
                        Rs. {b.amount.toFixed(2)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleEdit(b)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDelete(b.id)}
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

