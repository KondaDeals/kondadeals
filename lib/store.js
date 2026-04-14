import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Product cache to avoid refetching same pages
const productCache = new Map()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export const getCachedProducts = (key) => {
  const hit = productCache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_DURATION) return hit.data
  return null
}

export const setCachedProducts = (key, data) => {
  productCache.set(key, { data, ts: Date.now() })
}

const useStore = create(
  persist(
    (set, get) => ({
      cart: [],

     addToCart: (product, quantity = 1) => {
  set((state) => {
    const existing = state.cart.find(item => item.id === product.id)
    if (existing) {
      return {
        cart: state.cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
    }
    // Store ALL coupon fields when adding to cart
    return {
      cart: [...state.cart, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        mrp: product.mrp,
        sale_price: product.sale_price,
        images: product.images,
        stock: product.stock,
        quantity,
        // Product coupon fields — critical for cart display
        product_coupon_enabled: product.product_coupon_enabled || false,
        product_coupon_code: product.product_coupon_code || null,
        product_coupon_type: product.product_coupon_type || 'percentage',
        product_coupon_value: product.product_coupon_value || 0,
        product_coupon_min_qty: product.product_coupon_min_qty || 1,
        product_coupon_start_date: product.product_coupon_start_date || null,
        product_coupon_end_date: product.product_coupon_end_date || null,
        product_coupon_active: product.product_coupon_active !== false,
        categories: product.categories,
      }]
    }
  })
},

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter(item => item.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId)
          return
        }
        set({
          cart: get().cart.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
        })
      },

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart.reduce(
          (total, item) => total + item.sale_price * item.quantity, 0
        )
      },

      getCartCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0)
      },

      user: null,
      setUser: (user) => set({ user }),

      wishlist: [],
      toggleWishlist: (product) => {
        const wishlist = get().wishlist
        const exists = wishlist.find(item => item.id === product.id)
        if (exists) {
          set({ wishlist: wishlist.filter(item => item.id !== product.id) })
        } else {
          set({ wishlist: [...wishlist, product] })
        }
      },
      isInWishlist: (productId) => {
        return get().wishlist.some(item => item.id === productId)
      },
    }),
    {
      name: 'kondadeals-store',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    }
  )
)

export default useStore