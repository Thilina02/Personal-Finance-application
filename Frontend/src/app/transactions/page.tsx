"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type TransactionType = "INCOME" | "EXPENSE";

interface Category {
  id: number;
  name: string;
  type: TransactionType;
}

interface Transaction {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  category_name: string;
  type: TransactionType;
  date: string;
  note: string | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export default function TransactionsPage() {
  const { user, token, logout, initialized } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    categoryId: "",
    type: "EXPENSE" as TransactionType,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [catRes, txRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/transactions`, { headers: authHeaders() }),
      ]);
      if (catRes.status === 401 || txRes.status === 401) {
        logout();
        router.replace("/auth/login");
        return;
      }
      const cats = (await catRes.json()) as Category[];
      const rawTxs = (await txRes.json()) as any[];
      const txs: Transaction[] = rawTxs.map((t) => ({
        ...t,
        amount: Number(t.amount),
      }));
      setCategories(cats);
      setTransactions(txs);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
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
    setEditing(null);
    setForm({
      title: "",
      amount: "",
      categoryId: "",
      type: "EXPENSE",
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const payload = {
      title: form.title,
      amount: Number(form.amount),
      categoryId: Number(form.categoryId),
      type: form.type,
      date: form.date,
      note: form.note || undefined,
    };
    try {
      setError(null);
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `${API_BASE_URL}/transactions/${editing.id}`
        : `${API_BASE_URL}/transactions`;
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save transaction");
      }
      await loadData();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save transaction");
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditing(tx);
    setForm({
      title: tx.title,
      amount: String(tx.amount),
      categoryId: String(tx.category_id),
      type: tx.type,
      date: tx.date,
      note: tx.note ?? "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete transaction");
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
          <a href="/transactions" className="nav-item nav-item-active">
            Transactions
          </a>
          <a href="/budgets" className="nav-item">
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
            <h2>Transactions</h2>
            <p>Manage your income and expense records</p>
          </div>
        </header>

        {error && <p className="error-text">{error}</p>}

        <section className="grid grid-2">
          <div className="card">
            <h3>{editing ? "Edit transaction" : "Add transaction"}</h3>
            <form
              onSubmit={handleSubmit}
              className="auth-form"
              style={{ marginTop: 6 }}
            >
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Amount
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
                Type
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as TransactionType,
                    }))
                  }
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </label>
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
                  {categories
                    .filter((c) => c.type === form.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Note (optional)
                <input
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                />
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 4,
                  alignItems: "center",
                }}
              >
                <button type="submit">
                  {editing ? "Save changes" : "Add transaction"}
                </button>
                {editing && (
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
            <h3>Recent transactions</h3>
            {loading ? (
              <p className="muted">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="muted">No transactions yet.</p>
            ) : (
              <ul className="list" style={{ marginTop: 8 }}>
                {transactions.slice(0, 20).map((t) => (
                  <li key={t.id} className="list-row column">
                    <div className="list-row">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {t.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-soft)",
                            marginTop: 2,
                          }}
                        >
                          {t.category_name} • {t.date}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color:
                            t.type === "INCOME"
                              ? "var(--positive)"
                              : "var(--negative)",
                        }}
                      >
                        {t.type === "INCOME" ? "+" : "-"}Rs.{" "}
                        {t.amount.toFixed(2)}
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
                        onClick={() => handleEdit(t)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDelete(t.id)}
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

