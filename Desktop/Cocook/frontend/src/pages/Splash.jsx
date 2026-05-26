import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center p-container-padding-mobile">
      <div className="relative flex flex-col items-center space-y-8">
        {/* Steam Graphic Logic (Minimalist representation) */}
        <div className="flex space-x-2 mb-4">
          <div className="w-1.5 h-12 bg-primary/20 rounded-full steam-graphic -rotate-12 translate-y-2"></div>
          <div className="w-1.5 h-16 bg-primary/30 rounded-full steam-graphic"></div>
          <div className="w-1.5 h-12 bg-primary/20 rounded-full steam-graphic rotate-12 translate-y-2"></div>
        </div>
        
        <img src="/logo.png" alt="CoCook Logo" className="w-32 h-32 object-contain shadow-sm rounded-3xl" />
        <h1 className="font-display-lg text-display-lg text-primary tracking-tighter">CoCook</h1>
        
        {/* Tagline */}
        <p className="font-title-md text-title-md text-on-surface-variant text-center max-w-md">
          Cook Together.<br/>Share Together.
        </p>
      </div>
    </section>
  );
}
