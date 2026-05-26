import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-between py-12 px-container-padding-mobile md:px-container-padding-desktop bg-surface-container-lowest relative">
      {/* Top Visual / Hero */}
      <div className="w-full max-w-screen-lg aspect-[16/9] md:aspect-[21/9] rounded-[32px] overflow-hidden shadow-xl relative group">
        <img 
          alt="Friends cooking together" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwbceZXG81TUdMebsJrISiMxAgY2eNWdHExKcJG7ywPTLfc51-b4cW2ouszxP8IlwUUH8b_qojby_YKX0BrgdO3YUVadzHhdEX5le7wRl4fhgJnVFWNyitim72F3t3cJvXxj4EgtiModfYYlOrBuIeav1uvquPzByi36TcGElCSn9LnOt1M60lpirJ8R6nBIbyZf1wZdbhwk7FS3m5zyIfw3JwZH0OAKaEP82ETjQv1Z_khZJCtsL0IHzxNZHG5GiHA8eijnzqjK5O"
        />
        {/* Glassmorphism Badge */}
        <div className="absolute bottom-6 left-6 right-6 p-4 backdrop-blur-xl bg-white/40 rounded-2xl flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-full">
            <span className="material-symbols-outlined text-primary">restaurant_menu</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface">Join the kitchen community</p>
            <p className="text-xs text-on-surface-variant">12k+ active chefs online</p>
          </div>
        </div>
      </div>

      {/* Content & Action Area */}
      <div className="w-full max-w-screen-md flex flex-col items-center text-center mt-12 space-y-6">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface px-4">
          Share the Joy
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          Connect with friends over meal plans and discover what the community is whisking up today.
        </p>

        {/* Progress Indicators */}
        <div className="flex space-x-3 py-4">
          <span className="w-8 h-2 rounded-full bg-secondary"></span>
          <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
          <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
        </div>

        {/* CTA Button */}
        <button 
          onClick={() => navigate('/login')}
          className="w-full max-w-md h-14 bg-primary text-on-primary font-title-md text-title-md rounded-full neumorphic-lift active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Next
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>

        {/* Secondary Action */}
        <button 
          onClick={() => navigate('/login')}
          className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors py-2"
        >
          Skip for now
        </button>
      </div>

      {/* AI Assistant Bubble (Subtle presence even in onboarding) */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <div className="w-14 h-14 rounded-full bg-white/40 backdrop-blur-2xl shadow-lg border border-white/20 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform active:scale-90 group relative">
          <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          {/* Soft Yellow Glow Pulse effect (Static) */}
          <div className="absolute inset-0 rounded-full bg-tertiary-container/20 blur-md -z-10 animate-pulse"></div>
          {/* Tooltip */}
          <div className="absolute bottom-16 right-0 bg-surface text-on-surface-variant px-4 py-2 rounded-xl text-xs font-label-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Need help getting started?
          </div>
        </div>
      </div>
    </section>
  );
}
