import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './utils/Navbar';
import AdminProfile from './components/AdminProfile';
import Home from './components/Home';
import CameraManagement from './components/CameraManagement';

const App = () => {
    return (
        <Router>
                <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/user-management" element={<ProtectedRoute component={UserManagement} />} />
                <Route path="/profile" element={<ProtectedRoute component={AdminProfile} />} />
                <Route path="/cameras" element={<ProtectedRoute component={CameraManagement} />} />
                <Route path="/" element={<ProtectedRoute component={Home} />} />
            </Routes>
        </Router>
    );
};

export default App;
