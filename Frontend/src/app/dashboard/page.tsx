"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface ExpenseByCategory {
  category_name: string;
  total: number;
}

interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

interface BudgetUsage {
  budgetId: number;
  categoryName: string;
  budgetAmount: number;
  spent: number;
  usage: number;
}

interface DashboardResponse {
  summary: DashboardSummary;
  expenseByCategory: ExpenseByCategory[];
  monthlyIncomeVsExpenses: MonthlyPoint[];
  budgetUsage: BudgetUsage[];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export default function DashboardPage() {
  const { user, token, logout, initialized } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;

    if (!user || !token) {
      router.replace("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            logout();
            router.replace("/auth/login");
            return;
          }
          throw new Error("Failed to load dashboard");
        }
        const raw = (await res.json()) as any;
        const normalized: DashboardResponse = {
          summary: {
            totalIncome: Number(raw.summary?.totalIncome ?? 0),
            totalExpense: Number(raw.summary?.totalExpense ?? 0),
            balance: Number(raw.summary?.balance ?? 0),
          },
          expenseByCategory: (raw.expenseByCategory || []).map(
            (item: any) => ({
              category_name: item.category_name,
              total: Number(item.total ?? 0),
            })
          ),
          monthlyIncomeVsExpenses: (raw.monthlyIncomeVsExpenses || []).map(
            (m: any) => ({
              month: m.month,
              income: Number(m.income ?? 0),
              expense: Number(m.expense ?? 0),
            })
          ),
          budgetUsage: (raw.budgetUsage || []).map((b: any) => ({
            budgetId: b.budgetId,
            categoryName: b.categoryName,
            budgetAmount: Number(b.budgetAmount ?? 0),
            spent: Number(b.spent ?? 0),
            usage: Number(b.usage ?? 0),
          })),
        };
        setData(normalized);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialized, user, token, router, logout]);

  if (!initialized || !user) return null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="logo">FinanceBoard</h1>
        <nav className="nav">
          <a href="/dashboard" className="nav-item nav-item-active">
            Dashboard
          </a>
          <a href="/transactions" className="nav-item">
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
            <h2>Overview</h2>
            <p>High-level view of your finances</p>
          </div>
        </header>

        {loading && <p>Loading dashboard...</p>}
        {error && <p className="error-text">{error}</p>}

        {data && (
          <>
            <section className="grid grid-3">
              <div className="card">
                <h3>Total Income</h3>
                <p className="metric metric-positive">
                  Rs. {data.summary.totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h3>Total Expenses</h3>
                <p className="metric metric-negative">
                  Rs. {data.summary.totalExpense.toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h3>Current Balance</h3>
                <p
                  className={
                    "metric " +
                    (data.summary.balance >= 0
                      ? "metric-positive"
                      : "metric-negative")
                  }
                >
                  Rs. {data.summary.balance.toFixed(2)}
                </p>
              </div>
            </section>

            <section className="grid grid-2">
              <div className="card">
                <h3>Expense distribution by category</h3>
                {data.expenseByCategory.length === 0 ? (
                  <p className="muted">No expenses yet.</p>
                ) : (
                  <ul className="list">
                    {data.expenseByCategory.map((item) => (
                      <li key={item.category_name} className="list-row">
                        <span>{item.category_name}</span>
                        <span>Rs. {item.total.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card">
                <h3>Monthly income vs expenses</h3>
                {data.monthlyIncomeVsExpenses.length === 0 ? (
                  <p className="muted">No transactions yet.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Income</th>
                        <th>Expenses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthlyIncomeVsExpenses.map((m) => (
                        <tr key={m.month}>
                          <td>{m.month}</td>
                          <td>Rs. {m.income.toFixed(2)}</td>
                          <td>Rs. {m.expense.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="grid grid-2">
              <div className="card">
                <h3>Budget vs actual spending</h3>
                {data.budgetUsage.length === 0 ? (
                  <p className="muted">No budgets defined.</p>
                ) : (
                  <ul className="list">
                    {data.budgetUsage.map((b) => (
                      <li key={b.budgetId} className="list-row column">
                        <div className="list-row">
                          <span>{b.categoryName}</span>
                          <span>
                            Rs. {b.spent.toFixed(2)} / Rs.{" "}
                            {b.budgetAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={
                              "progress-fill " +
                              (b.usage >= 100 ? "progress-over" : "")
                            }
                            style={{ width: `${b.usage}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card">
                <h3>Next steps</h3>
                <ul className="list bullet-list">
                  <li>Add your recurring income and expenses.</li>
                  <li>Set monthly budgets for key expense categories.</li>
                  <li>Review your dashboard weekly to stay on track.</li>
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

