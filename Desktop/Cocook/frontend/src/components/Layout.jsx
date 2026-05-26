import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const hideNavPaths = ['/', '/login', '/onboarding'];
  const hideNav = hideNavPaths.includes(location.pathname);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen relative w-full overflow-x-hidden">
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}
