export default function OtpVerificationForm({
  isOpen,
  email,
  otp,
  info,
  error,
  submitting,
  resending,
  onOtpChange,
  onVerify,
  onResend,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-6 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md border border-stone-200 bg-white p-8 shadow-[0px_32px_80px_rgba(17,24,39,0.18)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              Email Verification
            </p>
            <h2 className="mt-3 font-headline text-3xl text-stone-950">
              Enter OTP
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              We sent a 6-digit code to <span className="text-stone-950">{email}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 transition-colors hover:text-stone-900"
            aria-label="Close OTP verification"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onVerify} className="mt-8 space-y-6">
          <div>
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500"
              htmlFor="signup_otp"
            >
              One-Time Password
            </label>
            <input
              id="signup_otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={onOtpChange}
              placeholder="123456"
              className="w-full border-0 border-b border-stone-300 bg-stone-50 px-0 py-4 text-center text-2xl tracking-[0.4em] text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-0"
            />
          </div>

          {info ? (
            <p className="border border-stone-300 bg-stone-50 p-3 text-sm text-stone-950">
              {info}
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onResend}
              disabled={resending || submitting}
              className="flex-1 border border-stone-300 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
            <button
              type="submit"
              disabled={submitting || resending}
              className="flex-1 bg-stone-950 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Verifying..." : "Verify & Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
