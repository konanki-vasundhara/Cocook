import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Assistant from './pages/Assistant';
import Community from './pages/Community';
import Profile from './pages/Profile';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Splash />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="login" element={<Login />} />
            <Route path="feed" element={<Feed />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="community" element={<Community />} />
            <Route path="profile" element={<Profile />} />
            <Route path="create" element={<Navigate to="/feed" />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
