import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignUpForm from "../components/SignUpForm";

export default function SignUp() {
  const { user } = useAuth();

  return (
    <div className="font-body bg-surface text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-inverse-surface/92 text-white backdrop-blur-xl">
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-5 py-5 md:px-10">
          <Link
            to="/"
            className="font-headline text-xl font-normal uppercase tracking-[0.34em] text-white md:text-2xl"
          >
            ARCHIVIST
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/products"
              className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/75 transition-opacity hover:opacity-70"
            >
              Return to Shop
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              <Link
                to="/communities"
                aria-label="Account"
                className="text-white transition-opacity duration-300 hover:opacity-70"
              >
                <span className="material-symbols-outlined">person</span>
              </Link>
            ) : (
              <Link
                to="/signup"
                className="hidden border border-white/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-white hover:text-inverse-surface sm:inline-flex"
              >
                Sign Up
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex min-h-screen items-center justify-center bg-surface px-6 pb-16 pt-[112px]">
        <section className="w-full max-w-md">
            <header className="mb-12">
              <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-background tracking-tighter mb-4">
                Identity Registration
              </h1>
              <p className="text-on-surface-variant font-body leading-relaxed">
                Join a curated ecosystem of discovery and heritage craft.
              </p>
            </header>
            <SignUpForm />
        </section>
      </main>

    </div>
  );
}
