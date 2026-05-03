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

### Table: products

* id (uuid, primary key)
* name (text)
* harga_modal (integer)
* harga_jual (integer)
* stock (integer, optional)
* created_at (timestamp)

---

### Table: transactions

* id (uuid)
* total_harga (integer)
* created_at (timestamp)

---

### Table: transaction_items

* id (uuid)
* transaction_id (uuid)
* product_id (uuid)
* quantity (integer)
* subtotal (integer)

---

## 🔐 SECURITY (IMPORTANT)

* RLS (Row Level Security) ENABLED
* Development policy:

ALLOW ALL (temporary)

SQL:
create policy "allow all"
on products
for all
using (true)
with check (true);

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
