import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { API_URL } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Novice');
  const [favoriteCuisine, setFavoriteCuisine] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1); // 1 = Details/Email, 2 = OTP
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        if (data.real_email) {
          setMessage(`OTP sent successfully to ${email}!`);
        } else {
          setMessage(`OTP generated! (Check backend console: ${data.mock_code_for_testing})`);
        }
      } else {
        setMessage(data.detail || 'Failed to send OTP');
      }
    } catch (err) {
      setMessage('Network error. Is the backend running?');
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const body = { email, otp };
      if (isSignUp) {
        body.name = name;
        body.bio = bio;
        body.experience_level = experienceLevel;
        body.favorite_cuisine = favoriteCuisine;
      }
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('cocook_token', data.access_token);
        localStorage.setItem('cocook_user', JSON.stringify(data.user));
        // Force app reload or state update to refresh profile
        window.location.href = '/feed';
      } else {
        setMessage(data.detail || 'Invalid OTP');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('cocook_token', data.access_token);
        localStorage.setItem('cocook_user', JSON.stringify(data.user));
        window.location.href = '/feed';
      } else {
        console.error('Google Auth server error:', data);
        setMessage(data.detail || 'Google Auth failed on server');
      }
    } catch (err) {
      console.error('Google Auth network error:', err);
      setMessage('Cannot connect to the server. Please make sure the backend is running on port 8000.');
    }
    setIsLoading(false);
  };

  return (
    <main className="w-full min-h-screen px-container-padding-mobile md:px-0 flex flex-col items-center pt-12 pb-6 relative overflow-hidden bg-surface">
      {/* Contextual Soft Neumorphic Element */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-20 -right-20 w-80 h-80 bg-primary-container/10 rounded-full blur-[100px] -z-10"></div>

      <header className="w-full flex justify-center items-center mb-6">
        <img src="/logo.png" alt="CoCook Logo" className="h-12 w-auto object-contain rounded-xl shadow-sm" />
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg tracking-tighter text-primary ml-3 hidden md:block">CoCook</h1>
      </header>

      <div className="w-full max-w-screen-md flex flex-col items-center relative z-10 px-4 md:px-0">
        {/* Illustration Section */}
        {step === 1 && (
          <div className="relative w-48 h-48 mb-4">
            <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-3xl"></div>
            <img 
              alt="Digital Gastronomy Illustration" 
              className="relative z-10 w-full h-full object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTdiVOkXTKgLThQigecDGF8nSnoADPxDtXnYm_GLICgVbcG5Q9L9trkB7rD3ikNo8sIjQtkrgKQSU10Un1KemOO8zBRSOB9ynZg3CDIbF-K5wGsUW2almm6vAe84eAajy4696W6uoDzOLhxRz0Tb7QNRv9_q20dansa7EOJsr7Y_wxSGzEyP4NzBGWeKOxSS35bwcl-uWS4gSDvYa-Ry11PTw8m47fC_-l85dMM3fidztnrnFfZEdsQs9jVaEozX9Lwi9RsfJ8Cb6M"
            />
          </div>
        )}

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">
            {isSignUp ? 'Create Chef Account' : 'Welcome Back, Chef'}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            {isSignUp 
              ? 'Enter your profile details below to register in the AI-powered kitchen.' 
              : 'Sign in to access your AI-powered kitchen assistant and recipe collection.'}
          </p>
        </div>
        
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center text-primary font-bold text-sm w-full">
            {message}
          </div>
        )}

        {/* Auth Form */}
        <form className="w-full space-y-4" onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp}>
          
          {/* Sign Up Specific Fields */}
          {isSignUp && step === 1 && (
            <>
              {/* Name Field */}
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant ml-4">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                  <input 
                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low rounded-xl border-none text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 neumorphic-inset transition-all" 
                    placeholder="Chef Maria Rossi" 
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant ml-4">Bio / Tagline</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">description</span>
                  <input 
                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low rounded-xl border-none text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 neumorphic-inset transition-all" 
                    placeholder="Curating flavors for the digital kitchen" 
                    type="text"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>
              </div>

              {/* Experience Level & Favorite Cuisine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-md text-on-surface-variant ml-4">Experience Level</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">restaurant</span>
                    <select 
                      className="w-full h-14 pl-12 pr-8 bg-surface-container-low rounded-xl border-none text-on-surface focus:ring-2 focus:ring-primary/20 neumorphic-inset transition-all appearance-none"
                      value={experienceLevel}
                      onChange={e => setExperienceLevel(e.target.value)}
                    >
                      <option value="Novice">Novice</option>
                      <option value="Home Cook">Home Cook</option>
                      <option value="Professional Chef">Professional Chef</option>
                      <option value="Master Level">Master Level</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-md text-on-surface-variant ml-4">Favorite Cuisine</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">local_pizza</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low rounded-xl border-none text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 neumorphic-inset transition-all" 
                      placeholder="Italian, Indian, Asian..." 
                      type="text"
                      value={favoriteCuisine}
                      onChange={e => setFavoriteCuisine(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant ml-4">Email Address</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input 
                className="w-full h-14 pl-12 pr-4 bg-surface-container-low rounded-xl border-none text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 neumorphic-inset transition-all disabled:opacity-50" 
                placeholder="maria@cocook.com" 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={step === 2}
              />
            </div>
          </div>

          {/* OTP Field (Conditionally Rendered) */}
          {step === 2 && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between items-center px-4">
                <label className="font-label-md text-on-surface-variant">One-Time Password (OTP)</label>
                <button className="text-primary font-label-md hover:underline animate-pulse" type="button" onClick={() => setStep(1)}>Change Email</button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input 
                  className="w-full h-14 pl-12 pr-12 bg-surface-container-low rounded-xl border-none text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 neumorphic-inset transition-all" 
                  placeholder="Enter 6-digit code" 
                  type="text"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Primary Action */}
          <button 
            className="w-full h-14 bg-primary text-on-primary font-title-md rounded-xl neumorphic-lift active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 shadow-md" 
            type="submit"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Processing...' : (step === 1 ? (isSignUp ? 'Send OTP to Register' : 'Send OTP') : (isSignUp ? 'Verify & Create Account' : 'Verify & Sign In'))}</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>

        {/* Divider */}
        {step === 1 && !isSignUp && (
          <>
            <div className="w-full flex items-center gap-4 my-8">
              <div className="h-px flex-1 bg-outline-variant/30"></div>
              <span className="font-label-md text-outline">or continue with</span>
              <div className="h-px flex-1 bg-outline-variant/30"></div>
            </div>

            {/* Social Logins */}
            <div className="flex justify-center w-full shadow-sm rounded-lg overflow-hidden border border-outline-variant/20 hover:scale-[1.02] transition-transform">
               <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setMessage('Google Login Failed');
                  }}
                  useOneTap
               />
            </div>
          </>
        )}

        {/* Footer Toggle */}
        <footer className="mt-10 mb-12 text-center">
          <p className="font-body-md text-on-surface-variant">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStep(1);
                setMessage('');
              }}
              className="text-primary font-title-md ml-1 hover:underline active:opacity-70 transition-opacity"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </footer>
      </div>
    </main>
  );
}
