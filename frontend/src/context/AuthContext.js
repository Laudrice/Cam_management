import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import logo from '../assets/imgs/logo.jpg';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                console.log('Decoded Token:', decodedToken);
                console.log('Token Expiration Time (ms):', decodedToken.exp * 1000);
                console.log('Current Time (ms):', Date.now());
                
                if (decodedToken.exp * 1000 > Date.now()) {
                    setIsAuthenticated(true);
                    setUser(decodedToken); 
                    console.log('User information after decoding token:', decodedToken); 
                    console.log('Token is valid, user is authenticated');
                } else {
                    localStorage.removeItem('token');
                    console.log('Token is expired, user is not authenticated');
                }
            } catch (error) {
                localStorage.removeItem('token');
                console.log('Failed to decode token, removing token from storage');
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        console.log('Login called with token:', token);
        localStorage.setItem('token', token);
        const decodedToken = jwtDecode(token);
        setIsAuthenticated(true);
        setUser(decodedToken);
        console.log('User information after login:', decodedToken);
    };

    const logout = () => {
        console.log('Logout called');
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        console.log('User information before logout:', user);
        setUser(null); 

        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => {
            if (response.ok) {
                console.log('Logged out successfully');
            } else {
                console.error('Logout failed');
            }
        }).catch(error => {
            console.error('Error during logout:', error);
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <img src={logo} alt="Logo" className="loading-logo" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;