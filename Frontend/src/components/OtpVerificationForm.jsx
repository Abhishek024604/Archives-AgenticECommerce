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
      <div className="w-full max-w-md border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-[0px_32px_80px_rgba(17,24,39,0.18)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Email Verification
            </p>
            <h2 className="mt-3 font-headline text-3xl text-on-background">
              Enter OTP
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              We sent a 6-digit code to <span className="text-on-background">{email}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant transition-colors hover:text-on-background"
            aria-label="Close OTP verification"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onVerify} className="mt-8 space-y-6">
          <div>
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
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
              className="w-full border-0 border-b border-outline bg-surface-container-low px-0 py-4 text-center text-2xl tracking-[0.4em] text-on-background placeholder:text-outline-variant/40 focus:border-primary focus:ring-0"
            />
          </div>

          {info ? (
            <p className="border border-primary/15 bg-primary/5 p-3 text-sm text-on-background">
              {info}
            </p>
          ) : null}

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onResend}
              disabled={resending || submitting}
              className="flex-1 border border-outline px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
            <button
              type="submit"
              disabled={submitting || resending}
              className="flex-1 bg-primary px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-on-primary transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Verifying..." : "Verify & Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
