'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed top-6 right-6 z-50 max-w-sm w-full shadow-2xl rounded-2xl p-5 flex items-start gap-4 animate-fade-in
      ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <span className="text-2xl">{isSuccess ? '✅' : '❌'}</span>
      <div className="flex-1">
        <p className={`font-bold text-sm ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
          {isSuccess ? 'Berhasil' : 'Gagal'}
        </p>
        <p className={`text-sm mt-0.5 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {toast.message}
        </p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>
  )
}

export default function Home() {

  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // 1. Fetch Products
  const getData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (data) {
      setProducts(data)
    } else if (error) {
      console.error("Error fetching products:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    getData()
  }, [])

  // 2. Add to Cart Logic
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          harga_jual: product.harga_jual,
          quantity: 1
        }
      ]
    })
  }

  // 3. Remove/Decrease from Cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId)
      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId)
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      )
    })
  }

  // 4. Calculations & Formatter
  const totalHarga = cart.reduce((acc, item) => acc + (item.harga_jual * item.quantity), 0)

  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const [processing, setProcessing] = useState(false)

  // 5. Checkout Logic
  const handleCheckout = async () => {
    if (cart.length === 0) return

    setProcessing(true)

    try {
      // Step 1: Insert Transaction Header
      const { data: trx, error: trxError } = await supabase
        .from('transactions')
        .insert([
          { total_harga: totalHarga }
        ])
        .select()
        .single()

      if (trxError) throw trxError

      // Step 2: Prepare & Insert Transaction Items
      const items = cart.map(item => ({
        transaction_id: trx.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.harga_jual * item.quantity
      }))

      const { error: itemError } = await supabase
        .from('transaction_items')
        .insert(items)

      if (itemError) throw itemError

      // Step 3: Update Product Stock
      const stockUpdates = cart.map(async (item) => {
        const product = products.find(p => p.id === item.id)
        const newStock = (product.stock || 0) - item.quantity

        return supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id)
      })

      await Promise.all(stockUpdates)

      // Success Flow
      setCart([])
      await getData()
      showToast('Transaksi berhasil & stok terupdate!', 'success')

    } catch (error) {
      console.error("CHECKOUT ERROR:", error)
      showToast('Gagal memproses transaksi. Silakan coba lagi.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-900 font-sans">

        <section className="w-full md:w-3/5 p-4 md:p-6 border-r border-gray-200">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-pink-500 tracking-tight">SmartCashier</h1>
              <p className="text-gray-400 text-sm">Ketuk produk untuk menambah ke keranjang</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/produk"
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200"
              >
                📦 Produk
              </Link>
              <Link
                href="/laporan"
                className="px-4 py-2 bg-pink-50 text-pink-500 rounded-xl text-sm font-bold hover:bg-pink-100 transition-all border border-pink-100"
              >
                📊 Laporan
              </Link>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  disabled={processing}
                  onClick={() => addToCart(product)}
                  className="flex flex-col justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-pink-300 hover:shadow-md transition-all active:scale-95 text-left h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-semibold text-gray-700 line-clamp-2">{product.name}</span>
                  <div className="mt-auto">
                    <span className="text-pink-500 font-bold block">{formatIDR(product.harga_jual)}</span>
                    {product.stock !== undefined && (
                      <span className="text-[10px] text-gray-400">Stok: {product.stock}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT SIDE: CART & TOTAL */}
        <section className="w-full md:w-2/5 p-4 md:p-6 bg-white flex flex-col h-auto md:h-screen sticky top-0 shadow-2xl md:shadow-none">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              🛒 Keranjang
              <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)} Item
              </span>
            </h2>
            {cart.length > 0 && (
              <button
                disabled={processing}
                onClick={() => setCart([])}
                className="text-gray-400 text-sm font-medium hover:text-pink-500 transition-colors disabled:opacity-50"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* CART LIST */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl">
                <span className="text-4xl mb-2 opacity-50">🛍️</span>
                <p className="text-sm">Keranjang masih kosong</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-pink-100 transition-all">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-700 text-sm">{item.name}</h4>
                    <p className="text-xs text-pink-400 font-medium">{formatIDR(item.harga_jual)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={processing}
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-pink-500 hover:border-pink-200 transition-all disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center text-gray-700">{item.quantity}</span>
                    <button
                      disabled={processing}
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 flex items-center justify-center bg-pink-500 rounded-lg text-white hover:bg-pink-600 transition-all shadow-sm disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SUMMARY & TOTAL */}
          <div className="mt-auto border-t border-gray-100 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Subtotal</span>
              <span className="font-semibold text-gray-700">{formatIDR(totalHarga)}</span>
            </div>
            <div className="flex justify-between items-end border-t border-gray-100 pt-4">
              <span className="text-lg font-bold text-gray-600">Total Tagihan</span>
              <span className="text-3xl font-black text-pink-500 tracking-tighter">
                {formatIDR(totalHarga)}
              </span>
            </div>

            <button
              disabled={cart.length === 0 || processing}
              onClick={handleCheckout}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 ${cart.length === 0 || processing
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-[0.98] shadow-pink-100'
                }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                'Selesai Transaksi'
              )}
            </button>
          </div>
        </section>
      </main>
    </>
  )
}