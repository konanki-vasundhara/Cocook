import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const API =
  import.meta.env.VITE_API_URL ||
  'http://13.60.36.200:8000';

export default function Login() {

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();

    try {

      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      setMessage(data.message || 'OTP Sent');

    } catch (err) {

      console.error(err);
      setMessage('Backend connection failed');

    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSendOtp}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit">
          Send OTP
        </button>
      </form>

      <p>{message}</p>

      <GoogleLogin
        onSuccess={(credentialResponse) => {
          console.log(credentialResponse);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />
    </div>
  );
}
