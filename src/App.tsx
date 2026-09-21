import { useState } from 'react';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';

export type UserRole = 'patient' | 'professional' | 'admin' | null;

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);

  if (userRole) {
    return <Dashboard role={userRole} onLogout={() => setUserRole(null)} />;
  }

  return <LandingPage onLogin={(role: UserRole) => setUserRole(role)} />;
}

export default App;
