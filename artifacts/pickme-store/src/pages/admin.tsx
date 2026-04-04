import React, { useState, useEffect, useRef } from "react";

const API = "/api";

type Category = "shoes" | "tops" | "bottoms" | "accessories" | "supplements";
type Badge = "new" | "sold" | null;

type Gender = "women" | "men" | "unisex";

interface Product {
  id: number;
  brand: string;
  name: string;
  size: string;
  price: number;
  category: Category;
  caption: string;
  imageUrl: string | null;
  imageUrls?: string[];
  badge: Badge;
  telegramUrl: string;
  avitoLink?: string | null;
  featured: boolean;
  sku?: string | null;
  purchasePrice?: number | null;
  gender: Gender;
  sortOrder?: number | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  shoes: "Обувь",
  tops: "Верх",
  bottoms: "Низ",
  accessories: "Аксессуары",
  supplements: "БАД",
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
  telegramUrl: "https://t.me/V_Limerence",
  avitoLink: "",
  featured: false,
  sku: "",
  purchasePrice: "",
  gender: "women" as Gender,
  sortOrder: "",
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

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Сервер вернул неожиданный ответ (${res.status}). Попробуйте ещё раз.`);
  }
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
      const data = await safeJson<{ token: string }>(res);
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
          badge: (initial.badge ?? "") as "" | "new" | "sold",
          telegramUrl: initial.telegramUrl,
          avitoLink: initial.avitoLink ?? "",
          featured: initial.featured ?? false,
          sku: initial.sku ?? "",
          purchasePrice: initial.purchasePrice != null ? String(initial.purchasePrice) : "",
          gender: (initial.gender ?? "women") as Gender,
          sortOrder: initial.sortOrder != null ? String(initial.sortOrder) : "",
        }
      : {
          brand: EMPTY_FORM.brand,
          name: EMPTY_FORM.name,
          size: EMPTY_FORM.size,
          price: EMPTY_FORM.price,
          category: EMPTY_FORM.category,
          caption: EMPTY_FORM.caption,
          badge: EMPTY_FORM.badge,
          telegramUrl: EMPTY_FORM.telegramUrl,
          avitoLink: EMPTY_FORM.avitoLink,
          featured: EMPTY_FORM.featured,
          sku: EMPTY_FORM.sku,
          purchasePrice: EMPTY_FORM.purchasePrice,
          gender: EMPTY_FORM.gender,
          sortOrder: EMPTY_FORM.sortOrder,
        }
  );

  const initImages = (): string[] => {
    if (initial?.imageUrls && initial.imageUrls.length > 0) return initial.imageUrls;
    if (initial?.imageUrl) return [initial.imageUrl];
    return [];
  };
  const [imageUrls, setImageUrls] = useState<string[]>(initImages);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const draggedIdx = useRef<number | null>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const available = 3 - imageUrls.length;
    if (available <= 0) { setError("Уже загружено 3 фото"); return; }

    const toUpload = selected.slice(0, available);
    setError("");

    for (const f of toUpload) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`«${f.name}»: допустимые форматы jpg, png, webp`);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`«${f.name}»: файл превышает 5 МБ`);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
    }

    if (selected.length > available) {
      setError(`Выбрано ${selected.length} файлов — добавляем первые ${available}`);
    }

    setUploading(true);
    try {
      const fd = new FormData();
      toUpload.forEach(f => fd.append("images", f));
      const res = await fetch(`${API}/admin/upload-multiple`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const d = await safeJson<{ error?: string }>(res);
        throw new Error(d.error ?? "Ошибка загрузки");
      }
      const data = await safeJson<{ imageUrls: string[] }>(res);
      setImageUrls(prev => [...prev, ...data.imageUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const handleDragStart = (idx: number) => { draggedIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (toIdx: number) => {
    if (draggedIdx.current === null || draggedIdx.current === toIdx) return;
    setImageUrls(prev => {
      const arr = [...prev];
      const [item] = arr.splice(draggedIdx.current!, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    draggedIdx.current = null;
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
      imageUrl: imageUrls[0] ?? "",
      imageUrls,
      badge: form.badge || null,
      telegramUrl: form.telegramUrl,
      avitoLink: form.avitoLink.trim() || null,
      featured: form.featured,
      sku: form.sku.trim() || null,
      purchasePrice: form.purchasePrice !== "" ? Number(form.purchasePrice) : null,
      gender: form.gender,
      sortOrder: form.sortOrder !== "" ? Number(form.sortOrder) : null,
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
        const d = await safeJson<{ error?: string }>(res);
        throw new Error(d.error ?? "Ошибка сохранения");
      }
      const saved = await safeJson<Product>(res);
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
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
                <option value="supplements">БАД</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Пол *</label>
              <select value={form.gender} onChange={set("gender")} style={inputStyle} required>
                <option value="women">Женское</option>
                <option value="men">Мужское</option>
                <option value="unisex">Унисекс</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Артикул</label>
              <input value={form.sku} onChange={set("sku")} style={inputStyle} placeholder="SKU-001" />
            </div>
            <div>
              <label style={labelStyle}>Цена закупки (₽)</label>
              <input value={form.purchasePrice} onChange={set("purchasePrice")} style={inputStyle} type="number" min={0} placeholder="2000" />
            </div>
            <div>
              <label style={labelStyle}>Порядок отображения</label>
              <input value={form.sortOrder} onChange={set("sortOrder")} style={inputStyle} type="number" min={0} placeholder="1, 2, 3…" />
            </div>
          </div>

          <label style={labelStyle}>Подпись (ироничный текст)</label>
          <textarea
            value={form.caption}
            onChange={set("caption")}
            style={{ ...inputStyle, height: 64, resize: "vertical" }}
            placeholder="идеально для похода к подружке и её бывшему"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Ссылка на Telegram *</label>
              <input value={form.telegramUrl} onChange={set("telegramUrl")} style={inputStyle} required placeholder="https://t.me/V_Limerence" />
            </div>
            <div>
              <label style={labelStyle}>Ссылка на Авито</label>
              <input value={form.avitoLink} onChange={set("avitoLink")} style={inputStyle} placeholder="https://www.avito.ru/..." />
            </div>
          </div>

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
              <label style={labelStyle}>Показывать на главной</label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#f7147a" }} />
                <span style={{ fontSize: 14 }}>Показывать в разделе «Новинки»</span>
              </label>
            </div>
          </div>

          {/* Photo upload — full width */}
          <div style={{ marginTop: 4 }}>
            <label style={labelStyle}>Фото (до 3) — jpg, png, webp, макс. 5 МБ каждое</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              ref={fileRef}
              onChange={handleUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ ...btnSecondary, marginTop: 0, opacity: imageUrls.length >= 3 ? 0.5 : 1 }}
              disabled={uploading || imageUrls.length >= 3}
            >
              {uploading ? "Загрузка..." : imageUrls.length >= 3 ? "Максимум 3 фото" : `Выбрать фото (${imageUrls.length}/3)`}
            </button>

            {imageUrls.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {imageUrls.map((url, idx) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    style={{ position: "relative", cursor: "grab" }}
                    title="Перетащите для изменения порядка"
                  >
                    <img
                      src={url}
                      alt={`фото ${idx + 1}`}
                      style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: idx === 0 ? "2px solid #f7147a" : "1px solid #e5e7eb", display: "block", pointerEvents: "none" }}
                    />
                    <span style={{ position: "absolute", bottom: 3, left: 3, fontSize: 9, background: idx === 0 ? "#f7147a" : "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>
                      {idx === 0 ? "главное" : idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
  const [skuSearch, setSkuSearch] = useState("");
  const [mode, setMode] = useState<"list" | "calc">("list");
  const [calcSelected, setCalcSelected] = useState<Set<number>>(new Set());
  const [calcSkuSearch, setCalcSkuSearch] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/products`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await safeJson<Product[]>(res);
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

  const activeSearch = mode === "calc" ? calcSkuSearch : skuSearch;
  const displayedProducts = activeSearch.trim()
    ? products.filter(p => p.sku?.toLowerCase().includes(activeSearch.trim().toLowerCase()))
    : products;
  const selectedProducts = products.filter(p => calcSelected.has(p.id));
  const totalPurchase = selectedProducts.reduce((sum, p) => sum + (p.purchasePrice ?? 0), 0);

  const toggleCalcProduct = (id: number) => {
    setCalcSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setCalcSkuSearch("");
      }
      return next;
    });
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

        {/* Mode tabs + Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 3 }}>
              <button
                onClick={() => setMode("list")}
                style={{ padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: mode === "list" ? "#fff" : "transparent", color: mode === "list" ? "#1a1a2e" : "#6b7280", boxShadow: mode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
              >Список</button>
              <button
                onClick={() => setMode("calc")}
                style={{ padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: mode === "calc" ? "#fff" : "transparent", color: mode === "calc" ? "#1a1a2e" : "#6b7280", boxShadow: mode === "calc" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
              >🧮 Калькулятор</button>
            </div>
            {/* SKU search (list mode) */}
            {mode === "list" && (
              <input
                value={skuSearch}
                onChange={e => setSkuSearch(e.target.value)}
                placeholder="Поиск по артикулу..."
                style={{ ...inputStyle, width: 220, marginBottom: 0 }}
              />
            )}
          </div>
          {mode === "list" && (
            <button onClick={() => { setEditProduct(null); setShowForm(true); }} style={btnPrimary}>
              + Добавить товар
            </button>
          )}
        </div>

        {/* Calc mode: SKU search */}
        {mode === "calc" && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <input
              value={calcSkuSearch}
              onChange={e => setCalcSkuSearch(e.target.value)}
              placeholder="Поиск по артикулу..."
              style={{ ...inputStyle, width: 280, marginBottom: 0 }}
              autoFocus
            />
            {calcSkuSearch && (
              <button onClick={() => setCalcSkuSearch("")} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13 }}>✕</button>
            )}
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Нашли: {displayedProducts.length} товара
            </span>
          </div>
        )}

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
        ) : displayedProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
            По запросу «{activeSearch}» ничего не найдено
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", paddingBottom: mode === "calc" ? 160 : 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  {mode === "calc" && (
                    <th style={{ padding: "12px 16px", width: 40 }}></th>
                  )}
                  {["Фото", "Товар", "Артикул", "Закупочная цена", "Статус", ...(mode === "list" ? ["Категория", "Размер", "Цена / Прибыль", "Действия"] : [])].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((product, idx) => {
                  const isSelected = calcSelected.has(product.id);
                  return (
                    <tr
                      key={product.id}
                      style={{ borderBottom: idx < displayedProducts.length - 1 ? "1px solid #f3f4f6" : "none", background: isSelected && mode === "calc" ? "#fdf4f8" : undefined, cursor: mode === "calc" ? "pointer" : undefined }}
                      onClick={mode === "calc" ? () => toggleCalcProduct(product.id) : undefined}
                    >
                      {mode === "calc" && (
                        <td style={{ padding: "12px 16px" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCalcProduct(product.id)}
                            onClick={e => e.stopPropagation()}
                            style={{ width: 18, height: 18, accentColor: "#f7147a", cursor: "pointer" }}
                          />
                        </td>
                      )}
                      <td style={{ padding: "12px 16px", width: 60 }}>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                        ) : (
                          <div style={{ width: 48, height: 48, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👗</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{product.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{product.brand}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                        {product.sku ? <span style={{ fontFamily: "monospace", background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{product.sku}</span> : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {product.purchasePrice != null && product.purchasePrice > 0
                          ? <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{product.purchasePrice.toLocaleString("ru-RU")} ₽</span>
                          : <span style={{ fontSize: 13, color: "#d1d5db" }}>Нет цены</span>
                        }
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: product.badge === "sold" ? "#fee2e2" : product.badge === "new" ? "#dcfce7" : "#f3f4f6", color: product.badge === "sold" ? "#b91c1c" : product.badge === "new" ? "#166534" : "#374151" }}>
                          {product.badge === "sold" ? "Продано" : product.badge === "new" ? "New" : "В наличии"}
                        </span>
                      </td>
                      {mode === "list" && <>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{CATEGORY_LABELS[product.category]}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{product.size}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{product.price.toLocaleString("ru-RU")} ₽</div>
                          {product.purchasePrice != null && product.purchasePrice > 0 && (
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>закупка: {product.purchasePrice.toLocaleString("ru-RU")} ₽</div>
                          )}
                          {product.purchasePrice != null && product.purchasePrice > 0 && (
                            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1, color: product.price - product.purchasePrice >= 0 ? "#16a34a" : "#dc2626" }}>
                              прибыль: {(product.price - product.purchasePrice).toLocaleString("ru-RU")} ₽
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setEditProduct(product); setShowForm(true); }} style={{ ...btnSecondary, padding: "6px 14px", fontSize: 13 }}>Изменить</button>
                            <button onClick={() => setDeleteProduct(product)} style={{ background: "transparent", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Удалить</button>
                          </div>
                        </td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sticky calculator panel */}
        {mode === "calc" && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "2px solid #f7147a", boxShadow: "0 -4px 24px rgba(0,0,0,0.10)", padding: "16px 32px", zIndex: 100, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                Выбрано позиций: <strong style={{ color: "#1a1a2e" }}>{calcSelected.size}</strong>
              </div>
              {selectedProducts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedProducts.map(p => (
                    <div key={p.id} style={{ background: "#fdf4f8", border: "1px solid #f7147a22", borderRadius: 6, padding: "3px 10px", fontSize: 12 }}>
                      <span style={{ fontFamily: "monospace", color: "#f7147a", fontWeight: 700 }}>{p.sku ?? "—"}</span>
                      <span style={{ color: "#374151", marginLeft: 6 }}>{p.name}</span>
                      <span style={{ color: "#6b7280", marginLeft: 6 }}>
                        {p.purchasePrice != null && p.purchasePrice > 0 ? `${p.purchasePrice.toLocaleString("ru-RU")} ₽` : "Нет цены"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", minWidth: 180 }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Итого закупочная стоимость:</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f7147a", lineHeight: 1 }}>
                {totalPurchase.toLocaleString("ru-RU")} ₽
              </div>
              {calcSelected.size > 0 && (
                <button
                  onClick={() => setCalcSelected(new Set())}
                  style={{ ...btnSecondary, padding: "6px 16px", fontSize: 13, marginTop: 8 }}
                >
                  Очистить выбор
                </button>
              )}
            </div>
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
