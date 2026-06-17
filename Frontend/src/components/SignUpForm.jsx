import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP } from "../api/otp";
import { useAuth } from "../context/AuthContext";
import OtpVerificationForm from "./OtpVerificationForm";

const initialFormData = {
  role: "customer",
  name: "",
  email: "",
  password: "",
  storeName: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  contact: "",
};

export default function SignUpForm() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      if (name === "role" && value === "customer") {
        return {
          ...prev,
          role: value,
          storeName: "",
          locality: "",
          city: "",
          state: "",
          pincode: "",
          contact: "",
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const buildPayload = () => {
    const payload = {
      role: formData.role,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    };

    if (!payload.name || !payload.email || !payload.password) {
      throw new Error("Name, email, and password are required.");
    }

    if (formData.role === "seller") {
      if (
        !formData.storeName ||
        !formData.locality ||
        !formData.city ||
        !formData.state ||
        !formData.pincode ||
        !formData.contact
      ) {
        throw new Error("Complete seller details are required.");
      }

      payload.sellerInfo = {
        storeName: formData.storeName.trim(),
        address: {
          locality: formData.locality.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: Number(formData.pincode),
        },
        contact: Number(formData.contact),
      };
    }

    return payload;
  };

  const closeOtpModal = () => {
    setIsOtpOpen(false);
    setPendingPayload(null);
    setOtp("");
    setOtpInfo("");
    setOtpError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const payload = buildPayload();

      setSendingOtp(true);
      await sendOTP({ email: payload.email });

      setPendingPayload(payload);
      setOtp("");
      setOtpError("");
      setOtpInfo(`OTP sent to ${payload.email}.`);
      setIsOtpOpen(true);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!pendingPayload) {
      setOtpError("Signup details are missing. Please try again.");
      return;
    }

    if (otp.trim().length !== 6) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setVerifyingOtp(true);
      setOtpError("");
      await verifyOTP({ email: pendingPayload.email, otp: otp.trim() });
      await register(pendingPayload);
      closeOtpModal();
      navigate("/");
    } catch (err) {
      setOtpError(
        err?.response?.data?.message || "OTP verification or signup failed"
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    const email = pendingPayload?.email || formData.email.trim().toLowerCase();

    if (!email) {
      setOtpError("Enter your email before requesting OTP.");
      return;
    }

    try {
      setResendingOtp(true);
      setOtpError("");
      await sendOTP({ email });
      setOtp("");
      setOtpInfo(`A new OTP was sent to ${email}.`);
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Select Your Path
          </span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="group relative cursor-pointer">
              <input
                checked={formData.role === "customer"}
                className="peer sr-only"
                name="role"
                type="radio"
                value="customer"
                onChange={handleChange}
              />
              <div className="min-h-28 border border-outline-variant/30 p-5 transition-all duration-300 peer-checked:border-primary peer-checked:bg-surface-container-low md:p-6">
                <span className="block font-headline text-lg font-bold leading-snug text-on-surface group-hover:text-primary">
                  Join as a Buyer
                </span>
                <span className="mt-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                  To Discover
                </span>
              </div>
            </label>
            <label className="group relative cursor-pointer">
              <input
                checked={formData.role === "seller"}
                className="peer sr-only"
                name="role"
                type="radio"
                value="seller"
                onChange={handleChange}
              />
              <div className="min-h-28 border border-outline-variant/30 p-5 transition-all duration-300 peer-checked:border-primary peer-checked:bg-surface-container-low md:p-6">
                <span className="block font-headline text-lg font-bold leading-snug text-on-surface group-hover:text-primary">
                  Join as a Seller
                </span>
                <span className="mt-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                  To Showcase
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
              htmlFor="full_name"
            >
              Full Legal Name
            </label>
            <input
              id="full_name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Alexander Hamilton"
              className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
              htmlFor="email"
            >
              Electronic Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@archivist.com"
              className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
              htmlFor="password"
            >
              Secure Passcode
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
            />
          </div>

          {formData.role === "seller" ? (
            <>
              <div>
                <label
                  className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                  htmlFor="storeName"
                >
                  Store Name
                </label>
                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="Archivist Atelier"
                  className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                  htmlFor="locality"
                >
                  Locality
                </label>
                <input
                  id="locality"
                  name="locality"
                  type="text"
                  required
                  value={formData.locality}
                  onChange={handleChange}
                  placeholder="Connaught Place"
                  className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                    htmlFor="city"
                  >
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New Delhi"
                    className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                    htmlFor="state"
                  >
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Delhi"
                    className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                    htmlFor="pincode"
                  >
                    Pincode
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="number"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="110001"
                    className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                    htmlFor="contact"
                  >
                    Contact Number
                  </label>
                  <input
                    id="contact"
                    name="contact"
                    type="number"
                    required
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full border-0 border-b border-outline bg-surface-container-low px-2 py-4 text-sm transition-all placeholder:text-outline-variant/50 focus:border-primary focus:ring-0"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <div className="pt-6">
          <button
            className="flex w-full items-center justify-center gap-2 bg-primary py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-on-primary transition-colors duration-300 hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={sendingOtp}
          >
            {sendingOtp ? "Sending OTP..." : "Initialize Account"}
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
            >
              arrow_forward
            </span>
          </button>
        </div>

        <div className="flex justify-center pt-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Already signed up?
            <Link
              to="/login"
              className="ml-1 border-b border-primary/30 pb-0.5 font-bold text-primary transition-all hover:border-primary"
            >
              Login
            </Link>
          </p>
        </div>
      </form>

      <OtpVerificationForm
        isOpen={isOtpOpen}
        email={pendingPayload?.email || formData.email.trim().toLowerCase()}
        otp={otp}
        info={otpInfo}
        error={otpError}
        submitting={verifyingOtp}
        resending={resendingOtp}
        onOtpChange={(event) =>
          setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={closeOtpModal}
      />
    </>
  );
}
