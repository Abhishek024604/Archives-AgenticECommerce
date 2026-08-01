import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white flex flex-col justify-between">
      <HomeNavbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="w-full max-w-md space-y-8 bg-white border border-stone-200 p-8 sm:p-10 rounded-2xl shadow-sm">
          
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">
              Welcome Back
            </span>
            <h1 className="font-headline text-3xl sm:text-4xl font-normal text-stone-950 mt-1">
              Sign In to Archive
            </h1>
            <p className="mt-2 text-xs text-stone-500 font-light">
              Enter your credentials to access your account & orders.
            </p>
          </div>

          <LoginForm />

          <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
            <span>Don't have an account yet? </span>
            <Link
              to="/signup"
              className="font-bold text-stone-950 hover:underline tracking-wider"
            >
              Create Account →
            </Link>
          </div>

        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
