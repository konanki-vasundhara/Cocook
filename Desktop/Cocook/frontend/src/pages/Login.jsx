import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const API =
  import.meta.env.VITE_API_URL ||
  process.env.REACT_APP_API_URL ||
  'http://13.60.36.200:8000';

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Novice');
  const [favoriteCuisine, setFavoriteCuisine] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {

    e.preventDefault();

    setIsLoading(true);
    setMessage('');

    try {

      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {

        setStep(2);

        if (data.real_email) {
          setMessage(`OTP sent successfully to ${email}!`);
        } else {
          setMessage(`OTP generated!`);
        }

      } else {

        setMessage(data.detail || 'Failed to send OTP');

      }

    } catch (err) {

      console.error(err);
      setMessage('Cannot connect to backend server');

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

      const res = await fetch(`${API}/auth/verify-otp`, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)

      });

      const data = await res.json();

      if (res.ok) {

        localStorage.setItem('cocook_token', data.access_token);

        localStorage.setItem(
          'cocook_user',
          JSON.stringify(data.user)
        );

        window.location.href = '/feed';

      } else {

        setMessage(data.detail || 'Invalid OTP');

      }

    } catch (err) {

      console.error(err);
      setMessage('Cannot connect to backend server');

    }

    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {

    setIsLoading(true);
    setMessage('');

    try {

      const res = await fetch(`${API}/auth/google`, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          token: credentialResponse.credential
        })

      });

      const data = await res.json();

      if (res.ok) {

        localStorage.setItem(
          'cocook_token',
          data.access_token
        );

        localStorage.setItem(
          'cocook_user',
          JSON.stringify(data.user)
        );

        window.location.href = '/feed';

      } else {

        console.error(data);
        setMessage(data.detail || 'Google Auth failed');

      }

    } catch (err) {

      console.error(err);
      setMessage('Cannot connect to backend server');

    }

    setIsLoading(false);
  };
