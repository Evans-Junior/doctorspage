// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientDashboard from './pages/PatientDashboard';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/:id" element={<PatientDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
