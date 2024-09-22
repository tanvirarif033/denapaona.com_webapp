import { useState, useContext, createContext, useEffect } from "react";
import { useAuth } from "./auth"; // Import useAuth to get the logged-in user

const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [auth] = useAuth(); // Use the auth context to get the current user
  const [loadingCart, setLoadingCart] = useState(true); // Add a loading state
  const [initialLoad, setInitialLoad] = useState(true); // Track the initial load

  useEffect(() => {
    if (auth?.user) {
      // Retrieve the cart associated with the logged-in user on initial load
      let existingCartItem = localStorage.getItem(`cart-${auth.user.email}`);
      if (existingCartItem) {
        setCart(JSON.parse(existingCartItem)); // Set cart from local storage
      } else {
        setCart([]); // Initialize empty cart if none exists
      }
      setInitialLoad(false); // Mark the initial load as complete
    } else {
      setCart([]); // Clear cart if no user is logged in
    }
    setLoadingCart(false); // Cart has been loaded, stop loading state
  }, [auth?.user]);

  // Sync cart changes to localStorage when the cart state changes, but not on initial load
  useEffect(() => {
    if (!initialLoad && auth?.user) {
      // Save the cart only if a user is logged in and it's not the initial load
      localStorage.setItem(`cart-${auth.user.email}`, JSON.stringify(cart));
    }
  }, [cart, auth?.user, initialLoad]);

  // While loading the cart, don't render the children
  if (loadingCart) {
    return <div>Loading cart...</div>; // Or use a spinner if desired
  }

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };
