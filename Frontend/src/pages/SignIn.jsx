import LoginForm from "../components/LoginForm";

export default function SignIn() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-6 text-center font-headline text-3xl text-on-background">
          Welcome Back
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
