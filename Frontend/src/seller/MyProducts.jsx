import { useEffect, useState } from "react";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/currency";

export default function MyProducts() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await API.get("/products");
      const mine = (res.data || []).filter((p) => p.seller?._id === user?._id);
      setItems(mine);
    })();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p._id} className="border rounded p-3">
            <img src={p.images?.[0]} className="h-40 w-full object-cover rounded" />
            <div className="mt-2 font-medium">{p.productName}</div>
            <div className="text-gray-600">{formatPrice(p.price)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
