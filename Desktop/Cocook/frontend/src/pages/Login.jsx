import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

// ================= API CONFIG =================

const API =
  import.meta.env.VITE_API_URL ||
  "http://13.60.36.200:8000";

// ==============================================

export default function Login() {

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState("Novice");

  const [favoriteCuisine, setFavoriteCuisine] =
    useState("");

  const [isSignUp, setIsSignUp] =
    useState(false);

  const [step, setStep] =
    useState(1);

  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // ================= SEND OTP =================

  const handleSendOtp = async (e) => {

    e.preventDefault();

    setIsLoading(true);

    setMessage("");

    try {

      const res = await fetch(
        `${API}/auth/send-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email
          })
        }
      );

      const data = await res.json();

      if (res.ok) {

        setStep(2);

        setMessage(
          `OTP sent successfully to ${email}`
        );

      } else {

        setMessage(
          data.detail ||
          "Failed to send OTP"
        );
      }

    } catch (err) {

      console.error(
        "Send OTP Error:",
        err
      );

      setMessage(
        "Backend server connection failed"
      );
    }

    setIsLoading(false);
  };

  // ================= VERIFY OTP =================

  const handleVerifyOtp = async (e) => {

    e.preventDefault();

    setIsLoading(true);

    setMessage("");

    try {

      const body = {
        email,
        otp
      };

      if (isSignUp) {

        body.name = name;

        body.bio = bio;

        body.experience_level =
          experienceLevel;

        body.favorite_cuisine =
          favoriteCuisine;
      }

      const res = await fetch(
        `${API}/auth/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(body)
        }
      );

      const data = await res.json();

      if (res.ok) {

        localStorage.setItem(
          "cocook_token",
          data.access_token
        );

        localStorage.setItem(
          "cocook_user",
          JSON.stringify(data.user)
        );

        window.location.href = "/feed";

      } else {

        setMessage(
          data.detail ||
          "Invalid OTP"
        );
      }

    } catch (err) {

      console.error(
        "Verify OTP Error:",
        err
      );

      setMessage(
        "Backend connection failed"
      );
    }

    setIsLoading(false);
  };

  // ================= GOOGLE LOGIN =================

  const handleGoogleSuccess = async (
    credentialResponse
  ) => {

    setIsLoading(true);

    setMessage("");

    try {

      const res = await fetch(
        `${API}/auth/google`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            token:
              credentialResponse.credential
          })
        }
      );

      const data = await res.json();

      if (res.ok) {

        localStorage.setItem(
          "cocook_token",
          data.access_token
        );

        localStorage.setItem(
          "cocook_user",
          JSON.stringify(data.user)
        );

        window.location.href = "/feed";

      } else {

        console.error(
          "Google Login Error:",
          data
        );

        setMessage(
          data.detail ||
          "Google Login Failed"
        );
      }

    } catch (err) {

      console.error(
        "Google Auth Network Error:",
        err
      );

      setMessage(
        "Cannot connect to backend server"
      );
    }

    setIsLoading(false);
  };

  return (

    <main className="w-full min-h-screen flex flex-col items-center justify-center px-4 bg-[#f7f3ed]">

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

        {/* Heading */}

        <div className="text-center mb-8">

          <h1 className="text-4xl font-bold mb-3">

            {isSignUp
              ? "Create Account"
              : "Welcome Back, Chef"}

          </h1>

          <p className="text-gray-600">
            AI-powered kitchen assistant
          </p>

        </div>

        {/* Message */}

        {message && (

          <div className="mb-5 p-4 rounded-xl bg-orange-100 text-orange-800 text-center">

            {message}

          </div>
        )}

        {/* Form */}

        <form
          className="space-y-4"
          onSubmit={
            step === 1
              ? handleSendOtp
              : handleVerifyOtp
          }
        >

          {/* Signup Fields */}

          {isSignUp && step === 1 && (
            <>

              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />

              <input
                type="text"
                placeholder="Bio"
                className="w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500"
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
              />

              <select
                className="w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500"
                value={experienceLevel}
                onChange={(e) =>
                  setExperienceLevel(
                    e.target.value
                  )
                }
              >
                <option value="Novice">
                  Novice
                </option>

                <option value="Home Cook">
                  Home Cook
                </option>

                <option value="Professional Chef">
                  Professional Chef
                </option>

                <option value="Master Chef">
                  Master Chef
                </option>

              </select>

              <input
                type="text"
                placeholder="Favorite Cuisine"
                className="w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500"
                value={favoriteCuisine}
                onChange={(e) =>
                  setFavoriteCuisine(
                    e.target.value
                  )
                }
              />

            </>
          )}

          {/* Email */}

          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            disabled={step === 2}
            required
          />

          {/* OTP */}

          {step === 2 && (

            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value)
              }
              required
            />
          )}

          {/* Submit Button */}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-700 hover:bg-orange-800 transition-all text-white p-4 rounded-xl text-lg font-semibold"
          >

            {isLoading
              ? "Processing..."
              : step === 1
              ? "Send OTP"
              : "Verify OTP"}

          </button>

        </form>

        {/* Google Login */}

        {step === 1 && !isSignUp && (

          <div className="mt-8 flex justify-center">

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {

                console.error(
                  "Google Login Failed"
                );

                setMessage(
                  "Google Login Failed"
                );
              }}
            />

          </div>
        )}

        {/* Toggle */}

        <div className="text-center mt-8">

          <button
            onClick={() => {

              setIsSignUp(!isSignUp);

              setStep(1);

              setMessage("");
            }}
            className="text-orange-700 font-semibold hover:underline"
          >

            {isSignUp
              ? "Already have an account? Sign In"
              : "Create Account"}

          </button>

        </div>

      </div>

    </main>
  );
}
