import { useState, useEffect } from "react";
import axios from "axios";

export default function useCategory() {
  const [categories, setCategories] = useState([]);

  // Get categories
  const getCategories = async () => {
    try {
      const { data } = await axios.get(
        "https://denapaona-com-webapp-server.vercel.app/api/v1/category/get-category"
      );
      if (data?.success) {
        setCategories(data.category);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  return categories;
}
