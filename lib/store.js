import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (product, quantity = 1) => {
        const cart = get().cart
        const existing = cart.find(item => item.id === product.id)
        if (existing) {
          set({
            cart: cart.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          set({ cart: [...cart, { ...product, quantity }] })
        }
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