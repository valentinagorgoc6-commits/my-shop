import React, { useState, useEffect, useRef } from "react";

const API = "/api";

type Category = "shoes" | "tops" | "bottoms" | "accessories";
type Badge = "new" | "sold" | null;

interface Product {
  id: number;
  brand: string;
  name: string;
  size: string;
  price: number;
  category: Category;
  caption: string;
  imageUrl: string | null;
  badge: Badge;
  telegramUrl: string;
  featured: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  shoes: "Обувь",
  tops: "Верх",
  bottoms: "Низ",
  accessories: "Аксессуары",
};

const EMPTY_FORM = {
  brand: "",
  name: "",
  size: "",
  price: "",
  category: "shoes" as Category,
  caption: "",
  imageUrl: "",
  badge: "" as "" | "new" | "sold",
  telegramUrl: "https://t.me/pickmestore",
  featured: false,
};

function useAdminToken() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("adminToken"));
  const login = (t: string) => {
    localStorage.setItem("adminToken", t);
    setToken(t);
  };
  const logout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
  };
  return { token, login, logout };
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ─── Login Page ───────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Неверный пароль");
        return;
      }
      const data = await res.json() as { token: string };
      onLogin(data.token);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "40px 48px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", width: 360 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Админ-панель</h1>
        <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 14 }}>PickMe Store</p>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="Введите пароль"
            autoFocus
            required
          />
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "8px 0 0" }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: 20, width: "100%" }}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────
function DeleteDialog({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>Удалить товар?</h2>
        <p style={{ color: "#374151", margin: "0 0 6px" }}>
          <strong>{product.brand} — {product.name}</strong>
        </p>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>Это действие нельзя отменить.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnSecondary}>Отмена</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...btnPrimary, background: "#ef4444" }}>
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Form ──────────────────────────────────────────────────
function ProductForm({
  initial,
  token,
  onSave,
  onCancel,
}: {
  initial?: Product;
  token: string;
  onSave: (p: Product) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          brand: initial.brand,
          name: initial.name,
          size: initial.size,
          price: String(initial.price),
          category: initial.category,
          caption: initial.caption,
          imageUrl: initial.imageUrl ?? "",
          badge: (initial.badge ?? "") as "" | "new" | "sold",
          telegramUrl: initial.telegramUrl,
          featured: initial.featured ?? false,
        }
      : { ...EMPTY_FORM }
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API}/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { imageUrl: string };
      setForm(f => ({ ...f, imageUrl: data.imageUrl }));
    } catch {
      setError("Ошибка загрузки изображения");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      brand: form.brand,
      name: form.name,
      size: form.size,
      price: Number(form.price),
      category: form.category,
      caption: form.caption,
      imageUrl: form.imageUrl || null,
      badge: form.badge || null,
      telegramUrl: form.telegramUrl,
      featured: form.featured,
    };
    try {
      const url = initial ? `${API}/products/${initial.id}` : `${API}/products`;
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Ошибка сохранения");
      }
      const saved = await res.json() as Product;
      onSave(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>
          {initial ? "Редактировать товар" : "Добавить товар"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Бренд *</label>
              <input value={form.brand} onChange={set("brand")} style={inputStyle} required placeholder="Nike" />
            </div>
            <div>
              <label style={labelStyle}>Размер *</label>
              <input value={form.size} onChange={set("size")} style={inputStyle} required placeholder="38 / M" />
            </div>
          </div>

          <label style={labelStyle}>Название *</label>
          <input value={form.name} onChange={set("name")} style={inputStyle} required placeholder="Кроссовки Air Max 90" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Цена (₽) *</label>
              <input value={form.price} onChange={set("price")} style={inputStyle} required type="number" min={0} placeholder="4500" />
            </div>
            <div>
              <label style={labelStyle}>Категория *</label>
              <select value={form.category} onChange={set("category")} style={inputStyle} required>
                <option value="shoes">Обувь</option>
                <option value="tops">Верх</option>
                <option value="bottoms">Низ</option>
                <option value="accessories">Аксессуары</option>
              </select>
            </div>
          </div>

          <label style={labelStyle}>Подпись (ироничный текст) *</label>
          <textarea
            value={form.caption}
            onChange={set("caption")}
            style={{ ...inputStyle, height: 64, resize: "vertical" }}
            required
            placeholder="идеально для похода к подружке и её бывшему"
          />

          <label style={labelStyle}>Ссылка на Telegram *</label>
          <input value={form.telegramUrl} onChange={set("telegramUrl")} style={inputStyle} required placeholder="https://t.me/pickmestore" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Статус</label>
              <select value={form.badge} onChange={set("badge")} style={inputStyle}>
                <option value="">В наличии</option>
                <option value="new">New</option>
                <option value="sold">Продано</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Фото</label>
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                onChange={handleUpload}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{ ...btnSecondary, width: "100%", marginTop: 0 }}
                disabled={uploading}
              >
                {uploading ? "Загрузка..." : form.imageUrl ? "Заменить фото" : "Загрузить фото"}
              </button>
            </div>
          </div>

          {form.imageUrl && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={form.imageUrl}
                alt="preview"
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <span style={{ fontSize: 13, color: "#6b7280", wordBreak: "break-all" }}>{form.imageUrl}</span>
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: "#f7147a", cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>Показать на главной</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>(отображается в каталоге на главной странице)</span>
          </label>

          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "12px 0 0" }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button" onClick={onCancel} style={btnSecondary}>Отмена</button>
            <button type="submit" disabled={saving || uploading} style={btnPrimary}>
              {saving ? "Сохранение..." : initial ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/products`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json() as Product[];
      setProducts(data);
    } catch {
      setError("Не удалось загрузить товары");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = (saved: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditProduct(null);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await fetch(`${API}/products/${deleteProduct.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    } catch {
      setError("Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>PickMe Store</span>
          <span style={{ marginLeft: 12, fontSize: 13, color: "#6b7280" }}>Управление товарами</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← На сайт</a>
          <button onClick={onLogout} style={{ ...btnSecondary, padding: "6px 14px", fontSize: 13 }}>Выйти</button>
        </div>
      </div>

      <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Stats bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Всего товаров", value: products.length },
            { label: "В наличии", value: products.filter(p => p.badge !== "sold").length },
            { label: "Продано", value: products.filter(p => p.badge === "sold").length },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 24px", border: "1px solid #e5e7eb", flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e" }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1a1a2e" }}>Товары</h2>
          <button onClick={() => { setEditProduct(null); setShowForm(true); }} style={btnPrimary}>
            + Добавить товар
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#b91c1c", marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Загрузка...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <p style={{ fontSize: 16 }}>Товаров пока нет</p>
            <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, marginTop: 16 }}>Добавить первый товар</button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  {["Фото", "Товар", "Категория", "Размер", "Цена", "Статус", "Действия"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product.id} style={{ borderBottom: idx < products.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px 16px", width: 60 }}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 48, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                          👗
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{product.brand}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                      {CATEGORY_LABELS[product.category]}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{product.size}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>
                      {product.price.toLocaleString("ru-RU")} ₽
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: product.badge === "sold" ? "#fee2e2" : product.badge === "new" ? "#dcfce7" : "#f3f4f6",
                        color: product.badge === "sold" ? "#b91c1c" : product.badge === "new" ? "#166534" : "#374151",
                      }}>
                        {product.badge === "sold" ? "Продано" : product.badge === "new" ? "New" : "В наличии"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => { setEditProduct(product); setShowForm(true); }}
                          style={{ ...btnSecondary, padding: "6px 14px", fontSize: 13 }}
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => setDeleteProduct(product)}
                          style={{ background: "transparent", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showForm) && (
        <ProductForm
          key={editProduct?.id ?? "new"}
          initial={editProduct ?? undefined}
          token={token}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditProduct(null); }}
        />
      )}

      {deleteProduct && (
        <DeleteDialog
          product={deleteProduct}
          onConfirm={handleDelete}
          onCancel={() => setDeleteProduct(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────
export default function AdminPage() {
  const { token, login, logout } = useAdminToken();

  if (!token) return <LoginPage onLogin={login} />;
  return <Dashboard token={token} onLogout={logout} />;
}

// ─── Styles ────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
  marginTop: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  color: "#1a1a2e",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  background: "#e8609a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "#fff",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "9px 20px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: "32px",
  width: 420,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  fontFamily: "system-ui, sans-serif",
};
