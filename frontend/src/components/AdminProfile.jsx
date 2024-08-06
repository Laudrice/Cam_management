import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import Modal from 'react-modal';
import {jwtDecode} from 'jwt-decode';


const AdminProfile = () => {
    const [user, setUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || '');

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;
                const response = await axios.get(`/users/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setUser(response.data);
                setEditUser(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des informations utilisateur:', error);
            }
        };
        if (token) {
            fetchUserDetails();
        }
    }, [token]);

    const openEditModal = () => {
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditUser(user);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditUser({ ...editUser, [name]: value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/users/${editUser.id}`, editUser, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUser(editUser);
            closeEditModal();
        } catch (error) {
            console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
        }
    };

    return (
        <div className="p-4 bg-green-50">
            <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '90%', margin: 'auto' }}>
                <h1 className="text-2xl font-bold mb-4">Profil </h1>
                {user ? (
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Nom</label>
                            <p className="mt-1 text-gray-900">{user.user_name}</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-gray-900">{user.user_mail}</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <p className="mt-1 text-gray-900">{user.user_type}</p>
                        </div>
                        <button
                            onClick={openEditModal}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Modifier
                        </button>

                        {/* Edit Modal */}
                        <Modal
                            isOpen={isEditModalOpen}
                            onRequestClose={closeEditModal}
                            className="modal"
                            overlayClassName="overlay"
                        >
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2 className="text-2xl font-bold">Modifier Profil</h2>
                                    <button onClick={closeEditModal} className="close-btn">&times;</button>
                                </div>
                                <hr />
                                <br />
                                {editUser && (
                                    <form onSubmit={handleEditSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700">Nom</label>
                                            <input
                                                type="text"
                                                name="user_name"
                                                value={editUser.user_name}
                                                onChange={handleEditChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                name="user_mail"
                                                value={editUser.user_mail}
                                                onChange={handleEditChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700">Type</label>
                                            <select
                                                name="user_type"
                                                value={editUser.user_type}
                                                onChange={handleEditChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                required
                                            >
                                                <option value="Administrateur">Administrateur</option>
                                                <option value="Opérateur">Opérateur</option>
                                            </select>
                                        </div>
                                        <hr />
                                        <br />
                                        <div className="modal-footer">
                                            <button
                                                type="submit"
                                                className="bg-green-500 text-white px-4 py-2 rounded"
                                            >
                                                Sauvegarder
                                            </button>
                                            <button
                                                onClick={closeEditModal}
                                                className="bg-gray-500 text-white px-4 py-2 rounded"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </Modal>
                    </div>
                ) : (
                    <p>Chargement...</p>
                )}
            </div>
        </div>
    );
};

export default AdminProfile;
