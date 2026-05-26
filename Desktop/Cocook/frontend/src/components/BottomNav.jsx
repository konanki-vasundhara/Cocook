import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { id: 'feed', path: '/feed', icon: 'style', label: 'Feed' },
  { id: 'assistant', path: '/assistant', icon: 'smart_toy', label: 'Assistant' },
  { id: 'create', path: '/create', icon: 'add_circle', label: 'Create' },
  { id: 'community', path: '/community', icon: 'group', label: 'Community' },
  { id: 'profile', path: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface/40 dark:bg-surface-dim/40 backdrop-blur-xl rounded-t-xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)] h-20 px-4 pb-safe flex justify-around items-center border-t border-outline-variant/20 left-0 right-0">
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
              isActive
                ? 'text-primary bg-primary-container/30 rounded-full px-4 py-1'
                : 'text-on-surface-variant hover:text-primary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span 
                className="material-symbols-outlined text-[24px]" 
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-label-md text-label-md mt-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
