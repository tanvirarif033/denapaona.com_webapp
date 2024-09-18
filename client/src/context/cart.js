import { useState, useContext, createContext, useEffect } from "react";
import { useAuth } from "./auth"; // Import useAuth to get the logged-in user

const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [auth] = useAuth(); // Use the auth context to get the current user

  useEffect(() => {
    if (auth?.user) {
      // Retrieve the cart associated with the logged-in user
      let existingCartItem = localStorage.getItem(`cart-${auth.user.email}`);
      if (existingCartItem) {
        setCart(JSON.parse(existingCartItem)); // Set cart for the logged-in user
      }
    } else {
      setCart([]); // Clear cart if no user is logged in
    }
  }, [auth?.user]);

  // Sync cart changes to localStorage when the cart state changes
  useEffect(() => {
    if (auth?.user) {
      // Save the cart only if a user is logged in
      localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(cart));
    }
  }, [cart, auth?.user]);

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };
