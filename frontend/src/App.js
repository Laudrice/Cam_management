import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './utils/Navbar';
import Profile from './components/Profile';
import Home from './components/Home';
import CameraManagement from './components/CameraManagement';
import EventList from './components/EventList';
import VideoPage from './components/VideoPage';
import CameraList from './components/CameraList';

const App = () => {

    const timeoutRef = useRef(null);

    useEffect(() => {
      const handleUserActivity = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
  
        timeoutRef.current = setTimeout(() => {
          window.location.reload();
        }, 3608000); // 1 heure = 3600000 ms
      };
  
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity);
      //Initialisation
      handleUserActivity();
  
      return () => {
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('click', handleUserActivity);
        window.removeEventListener('scroll', handleUserActivity);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
        <Router>
                <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                {/* Route sécurisé  */}
                <Route path="/users" element={<ProtectedRoute component={UserManagement} />} />
                <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
                <Route path="/cameras" element={<ProtectedRoute component={CameraManagement} />} />
                <Route path="/events" element={<ProtectedRoute component={EventList} />} />
                <Route path="/videos" element={<ProtectedRoute component={CameraList} />} />
                <Route path="/" element={<ProtectedRoute component={Home} />} />
            </Routes>
        </Router>
    );
};

export default App;
