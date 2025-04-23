//layout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import {
  Menu,
  X,
  Home,
  Users,
  Bell,
  FileText,
  LogOut,
} from 'lucide-react';
import Notifications from './Notifications';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';


function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { doctor, logout } = useAuthStore();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const doctorId =  doctor?.uid;
  console.log('doctorId', doctor?.uid);
  const doctorImage = user?.imageUrl;
 

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <img
                src={doctor?.imageUrl || doctorImage}
                alt={doctor?.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h2 className="font-semibold">{doctor?.name}</h2>
                <p className="text-sm text-gray-600">{doctor?.specialization}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4">
          <Link
              to="/"
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded "
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/patients"
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded "
            >
              <Users size={20} />
              <span>Patients</span>
            </Link>
            <Link
              to="/prescriptions"
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded "
            >
              <FileText size={20} />
              <span>Prescriptions</span>
            </Link>
            
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 p-2 w-full hover:bg-gray-100 rounded"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center space-x-4">
              <button 
                className="relative p-2"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={24} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <Notifications onClose={() => setShowNotifications(false)} doctorUid={doctorId} />
      )}
    </div>
  );
}

export default Layout;