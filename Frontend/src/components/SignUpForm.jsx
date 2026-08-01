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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-2">
            Select Account Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange({ target: { name: "role", value: "customer" } })}
              className={`py-3 px-4 text-center rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                formData.role === "customer"
                  ? "border-stone-950 bg-stone-950 text-white shadow-xs"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => handleChange({ target: { name: "role", value: "seller" } })}
              className={`py-3 px-4 text-center rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                formData.role === "seller"
                  ? "border-stone-950 bg-stone-950 text-white shadow-xs"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
              }`}
            >
              Seller
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
            Full Name
          </label>
          <input
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Alexander Hamilton"
            className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 focus:bg-white rounded-md transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@domain.com"
            className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 focus:bg-white rounded-md transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 focus:bg-white rounded-md transition-colors"
          />
        </div>

        {formData.role === "seller" && (
          <div className="space-y-4 pt-2 border-t border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Seller & Store Details
            </h3>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
                Store / Brand Name
              </label>
              <input
                name="storeName"
                type="text"
                required
                value={formData.storeName}
                onChange={handleChange}
                placeholder="e.g. Atelier Luxury"
                className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 focus:bg-white rounded-md"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
                Locality / Street
              </label>
              <input
                name="locality"
                type="text"
                required
                value={formData.locality}
                onChange={handleChange}
                placeholder="e.g. Connaught Place"
                className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 focus:bg-white rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
                  City
                </label>
                <input
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New Delhi"
                  className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
                  State
                </label>
                <input
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Delhi"
                  className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
                  Pincode
                </label>
                <input
                  name="pincode"
                  type="number"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="110001"
                  className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 mb-1.5">
                  Contact Phone
                </label>
                <input
                  name="contact"
                  type="number"
                  required
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-950 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={sendingOtp}
          className="w-full bg-stone-950 text-white py-3.5 px-6 text-xs font-bold uppercase tracking-[0.18em] hover:bg-black transition-colors rounded-md disabled:opacity-50"
        >
          {sendingOtp ? "Sending OTP..." : "Initialize Account"}
        </button>
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
