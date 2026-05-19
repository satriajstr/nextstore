# 🧠 CONTEXT PROJECT – WEB KASIR SEDERHANA (PEDAGANG PASAR)

## 🎯 TUJUAN SISTEM

Membuat web app kasir sederhana untuk pedagang pasar:

* Input transaksi cepat saat jualan
* Otomatis hitung total & keuntungan
* Menghilangkan pencatatan manual + Excel

---

## 🧱 STACK TEKNOLOGI

Frontend:

* Next.js (App Router)
* React (Client Component)

Backend:

* Supabase (PostgreSQL + API)

Hosting:

* Vercel

---

## ⚙️ ARSITEKTUR

Frontend langsung terhubung ke Supabase (tanpa backend custom).

Flow:
User → Next.js → Supabase → Database

---

## 🗃️ DATABASE STRUCTURE

## 🗃️ DATABASE STRUCTURE

```sql
-- 1. STORES
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  primary_color text DEFAULT '#ec4899'::text,
  CONSTRAINT stores_pkey PRIMARY KEY (id)
);

-- 2. PROFILES
CREATE TABLE public.profiles (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'kasir'::text, -- Menggunakan text untuk fleksibilitas role ('admin', 'kasir')
  full_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  store_id uuid REFERENCES public.stores(id),
  status text DEFAULT 'pending'::text, -- 'pending' atau 'approved'
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id)
);

-- 3. PRODUCTS
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  harga_modal integer NOT NULL,
  harga_jual integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  stock integer DEFAULT 0,
  category text DEFAULT 'Umum'::text,
  store_id uuid REFERENCES public.stores(id),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- 4. TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  total_harga integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  diskon integer DEFAULT 0,
  payment_method text DEFAULT 'Tunai'::text,
  refunded boolean NOT NULL DEFAULT false,
  store_id uuid REFERENCES public.stores(id),
  CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

-- 5. TRANSACTION ITEMS
CREATE TABLE public.transaction_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  quantity integer NOT NULL,
  subtotal integer NOT NULL,
  store_id uuid REFERENCES public.stores(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transaction_items_pkey PRIMARY KEY (id)
);

-- 6. DAILY SUMMARY (Kunci Integrasi Buka/Tutup Hari Multi-Tenant)
CREATE TABLE public.daily_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_penjualan integer DEFAULT 0,
  jumlah_transaksi integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  total_modal integer DEFAULT 0,
  keuntungan_bersih integer DEFAULT 0,
  status text DEFAULT 'closed'::text,
  carry_over integer DEFAULT 0,
  total_diskon integer DEFAULT 0,
  carry_modal numeric DEFAULT 0,
  carry_diskon numeric DEFAULT 0,
  carry_trx_count numeric DEFAULT 0,
  store_id uuid REFERENCES public.stores(id),
  CONSTRAINT daily_summary_pkey PRIMARY KEY (id),
  -- FIX CRITICAL: Satu toko hanya boleh memiliki 1 rekap per hari. Tapi antar toko boleh di hari yang sama!
  CONSTRAINT daily_summary_date_store_unique UNIQUE (date, store_id)
);
```

---

## 🔐 SECURITY & ROW LEVEL SECURITY (RLS)

Seluruh akses dari client Next.js dibatasi secara ketat berdasarkan toko terdaftar milik kasir/admin yang sedang login.

```sql
-- Aktifkan RLS di semua tabel
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;

-- 1. RLS Profiles (Bebas Rekursi)
CREATE POLICY "Profiles self access only"
ON public.profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. RLS Stores
CREATE POLICY "Users can view their store"
ON public.stores
FOR SELECT
USING (id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Owners can manage their store"
ON public.stores
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 3. RLS Products
CREATE POLICY "Tenant isolation for products"
ON public.products
FOR ALL
USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));

-- 4. RLS Transactions
CREATE POLICY "Tenant isolation for transactions"
ON public.transactions
FOR ALL
USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));

-- 5. RLS Transaction Items
CREATE POLICY "Tenant isolation for transaction_items"
ON public.transaction_items
FOR ALL
USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));

-- 6. RLS Daily Summary
CREATE POLICY "Tenant isolation for daily_summary"
ON public.daily_summary
FOR ALL
USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));
```

---

## 🔌 SUPABASE CLIENT

File: src/lib/supabase.js

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY'
)
```

---

## ⚠️ RULES

* NEVER use secret key in frontend
* ALWAYS use publishable key
* Component using useEffect MUST use 'use client'

---

## 📦 CORE FEATURE FLOW

### 1. Load Products

* Fetch from Supabase
* Display as clickable buttons

---

### 2. Cart System (Frontend State)

Structure:
cart = [
{
id,
name,
harga_jual,
quantity
}
]

---

### 3. Add to Cart Logic

* If product exists → increase quantity
* Else → add new item

---

### 4. Calculate Total

total = sum(harga_jual * quantity)

---

### 5. Checkout (Tutup Hari / Selesai)

Steps:

1. Insert into `transactions`
2. Get transaction_id
3. Insert multiple `transaction_items`

---

## 🚫 WHAT NOT TO DO

* No complex authentication
* No overengineering backend
* No unnecessary features (discount, tax, etc.)

---

## 🎯 UX PRINCIPLES

* Max 2–3 taps per transaction
* Large buttons (mobile-first)
* Fast input > fancy UI

---

## 🧪 TESTING STRATEGY

### Test 1 (System Accuracy)

* Developer inputs data
* Compare with manual notes

### Test 2 (Real Usage)

* User inputs directly
* Observe:

  * speed
  * mistakes
  * usability

---

## ⚠️ COMMON ERRORS

* 401 Supabase → wrong key or RLS
* No console log → missing 'use client'
* Module not found → wrong file path
* Empty data → table empty

---

## 🎯 CURRENT PROGRESS STATE

✔ Supabase connected
✔ Data fetched and displayed
👉 NEXT: Implement cart system

---

## 📌 NEXT TASK FOR AI AGENT

Implement:

* addToCart()
* cart state
* display cart
* calculate total

DO NOT:

* implement backend logic yet
* implement checkout yet

---

END OF CONTEXT
