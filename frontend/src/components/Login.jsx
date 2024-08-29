import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import AuthContext from '../context/AuthContext'; 

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/users/login', { user_mail: email, user_pwd: password });
            login(response.data.token);
            navigate('/users');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                window.alert('Email ou mot de passe incorrect');
            } else {
                console.error('Login failed:', error);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-green-50">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">Connexion</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-gray-700">Email</label>
                        <input 
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Entrez votre email"
                            className="w-full p-3 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-700">Mot de passe</label>
                        <input 
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Entrez votre mot de passe"
                            className="w-full p-3 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700"
                    >
                        Connexion
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <a href="/forgot-password" className="text-green-600 hover:underline">Mot de passe oublié ?</a>
                    <h1 className='' style={{color:'red',fontWeight:'800'}}>WAMP</h1>
                </div>
            </div>
        </div>
    );
};

export default Login;
