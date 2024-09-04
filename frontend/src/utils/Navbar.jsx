import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faTimes, faBars,faVideo } from '@fortawesome/free-solid-svg-icons';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const { isAuthenticated, logout } = useContext(AuthContext);

    const toggleMenu = () => {
        setIsMenuOpen(prev => !prev);
        if (isProfileMenuOpen) setIsProfileMenuOpen(false);
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(prev => !prev);
        if (isMenuOpen) setIsMenuOpen(false);
    };

    return (
        <header className="bg-green-700 text-white p-3">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo à gauche */}
                <div className="text-2xl font-bold flex" style={{alignContent:'center', alignItems:'center'}}>
                    <p className='mr-4'>Camera</p>
                    <FontAwesomeIcon icon={faVideo} className='mt-1' />
                </div>

                {/* Liste de menu au centre */}
                <nav className={`hidden md:flex space-x-4`}>
                    <Link to="/" className="hover:bg-green-600 px-3 py-2 rounded">Accueil</Link>
                    <Link to="/users" className="hover:bg-green-600 px-3 py-2 rounded">Utilisateurs</Link>
                    <Link to="/cameras" className="hover:bg-green-600 px-3 py-2 rounded">Caméras</Link>
                    <Link to="/history" className="hover:bg-green-600 px-3 py-2 rounded">Vidéos</Link>
                    <Link to="/videos" className="hover:bg-green-600 px-3 py-2 rounded">Stream</Link>
                </nav>

                {/* Logo de profil à droite */}
                {isAuthenticated && (
                    <div className="relative hidden md:block">
                        <button className="flex items-center space-x-2" onClick={toggleProfileMenu}>
                            <FontAwesomeIcon icon={faUser} className="text-lg" />
                        </button>
                        {/* Dropdown menu */}
                        <div className={`absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg ${isProfileMenuOpen ? 'block' : 'hidden'}`}>
                            <Link to="/profile" className="block px-4 py-2 hover:bg-green-100">Voir le profil</Link>
                            <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-green-100" style={{ color: 'red' }}>
                                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                                Déconnexion
                            </button>
                        </div>
                    </div>
                )}

                {/* Menu hamburger pour mobile */}
                <button className="md:hidden text-xl" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faBars} />
                </button>
            </div>

            {/* Menu mobile */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-green-800 bg-opacity-90 z-50 flex flex-col items-end p-4">
                    <button className="text-white text-2xl" onClick={() => setIsMenuOpen(false)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                    <nav className="mt-4 space-y-2">
                        <Link to="/" className="block text-white hover:bg-green-600 px-4 py-2 rounded">Accueil</Link>
                        <Link to="/users" className="block text-white hover:bg-green-600 px-4 py-2 rounded">Utilisateurs</Link>
                        <Link to="/cameras" className="block text-white hover:bg-green-600 px-4 py-2 rounded">Caméras</Link>
                        <Link to="/history" className="block text-white hover:bg-green-600 px-4 py-2 rounded">Vidéos</Link>
                        <Link to="/videos" className="block text-white hover:bg-green-600 px-4 py-2 rounded">Stream</Link>
                        <hr />
                        {isAuthenticated && (
                            <div className="mt-4">
                                <Link to="/profile" className="block text-white hover:bg-blue-600 px-4 py-2 rounded">Voir le profile</Link>
                                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-white text-left hover:bg-red-600 px-4 py-2 rounded">
                                    Déconnexion
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Navbar;
