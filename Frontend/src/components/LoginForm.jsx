import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 p-8">
      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-stone-900 mb-1">Email</label>
          <input name="email" onChange={handleChange} className="w-full bg-stone-50 border-0 border-b border-stone-300 focus:ring-0 focus:border-stone-900 px-0 py-2" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-stone-900 mb-1">Password</label>
          <input type="password" name="password" onChange={handleChange} className="w-full bg-stone-50 border-0 border-b border-stone-300 focus:ring-0 focus:border-stone-900 px-0 py-2" placeholder="        " />
        </div>
      </div>

      <button type="submit" className="w-full mt-6 bg-stone-950 text-white py-3 font-label text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-black transition-colors">Login</button>
    </form>
  );
}
