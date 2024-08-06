import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons';


const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [newUser, setNewUser] = useState({
        user_name: '',
        user_mail: '',
        user_type: 'Opérateur',
        user_pwd: '123'
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/users/allUsers');
                setUsers(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.user_name.toLowerCase().includes(search.toLowerCase()) ||
        user.user_mail.toLowerCase().includes(search.toLowerCase())
    );

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * entries,
        currentPage * entries
    );

    const totalPages = Math.ceil(filteredUsers.length / entries);

    const openEditModal = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
    };

    const openAddModal = () => {
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewUser({
            user_name: '',
            user_mail: '',
            user_type: 'Opérateur',
            user_pwd: '123'
        });
    };

    const openSuccessModal = () =>{
        setIsSuccessModalOpen(true);
    }

    const closeSuccessModal = () =>{
        setIsSuccessModalOpen(false);
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedUser({ ...selectedUser, [name]: value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/users/${selectedUser.id}`, selectedUser);
            setUsers(users.map(user => (user.id === selectedUser.id ? selectedUser : user)));
            closeEditModal();
            openSuccessModal();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteSubmit = async () => {
        try {
            await axios.delete(`/users/${selectedUser.id}`);
            setUsers(users.filter(user => user.id !== selectedUser.id));
            closeDeleteModal();
            openSuccessModal();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setNewUser({ ...newUser, [name]: value });
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/users/addUser', newUser);
            setUsers([...users, response.data]);
            closeAddModal();
            openSuccessModal();
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
        }
    };
    

    return (
        <div className="p-4 bg-green-50">
            <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '90%', margin: 'auto' }}>
                <div className="flex" style={{justifyContent:'space-between'}}>
                    <h1 className="text-2xl font-bold mb-4">Utilisateurs</h1>
                    
                    <button
                        onClick={openAddModal}
                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                    >
                        Ajouter un utilisateur
                    </button>
                </div>
                <br />
                <hr />    
                <br />
                <div className="mb-4 flex items-center">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher . . ."
                        className="border border-gray-300 rounded-md p-2 w-full"
                    />
                    <select
                        value={entries}
                        onChange={(e) => setEntries(Number(e.target.value))}
                        className="ml-4 border border-gray-300 rounded-md p-2"
                    >
                        {[10, 25, 50].map((num) => (
                            <option key={num} value={num}>
                                Afficher {num}
                            </option>
                        ))}
                    </select>
                </div>
                
                <table className="w-full border-collapse border border-gray-200">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">ID</th>
                            <th className="border border-gray-300 p-2">Nom</th>
                            <th className="border border-gray-300 p-2">Email</th>
                            <th className="border border-gray-300 p-2" style={{ width: '180px' }}>Type</th>
                            <th className="border border-gray-300 p-2" style={{ width: '225px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr key={user.id}>
                                <td className="border border-gray-300 p-2" style={{ width: '75px', textAlign:'center' }}>{user.id}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '180px', textAlign:'center' }}>{user.user_name}</td>
                                <td className="border border-gray-300 p-2">{user.user_mail}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '180px', textAlign:'center' }}>{user.user_type}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '225px' }}>
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(user)}
                                        className="bg-red-500 text-white px-4 py-2 rounded"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-between items-center mt-4">
                    <div>
                        <span>Page {currentPage} sur {totalPages}</span>
                    </div>
                    <div className="flex">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                        >
                            Suivant
                        </button>
                    </div>
                </div>

                {/* Edit Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onRequestClose={closeEditModal}
                    className="modal"
                    overlayClassName="overlay"
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="text-2xl font-bold">Modifier</h2>
                            <button onClick={closeEditModal} className="close-btn" style={{fontWeight:'800', color:'red'}}>&times;</button>
                        </div>
                        <hr />
                        <br />
                        {selectedUser && (
                            <form onSubmit={handleEditSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                                    <input
                                        type="text"
                                        name="user_name"
                                        value={selectedUser.user_name}
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
                                        value={selectedUser.user_mail}
                                        onChange={handleEditChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        name="user_type"
                                        value={selectedUser.user_type}
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

                {/* Delete Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onRequestClose={closeDeleteModal}
                    className="modal"
                    overlayClassName="overlay"
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="text-2xl font-bold">Supprimer</h2>
                            <button onClick={closeDeleteModal} className="close-btn" style={{fontWeight:'800', color:'red'}}>&times;</button>
                        </div>
                        <hr />
                        <br />
                        {selectedUser && (
                            <div className="">
                                <div className="flex" style={{alignItems:'center'}}>
                                    <FontAwesomeIcon icon={faCircleXmark} className="text-red-500 text-6xl mb-4" />
                                    <p className="block text-m font-medium text-gray-700 mb-4 ml-5">
                                        Êtes-vous sûr de vouloir supprimer <b>{selectedUser.user_name}</b> ?
                                    </p>
                                </div>
                                <hr />
                                <br />
                                <button
                                    onClick={handleDeleteSubmit}
                                    className="bg-red-500 text-white px-4 py-2 rounded mr-2 float-end"
                                >
                                    Supprimer
                                </button>
                                <button
                                    onClick={closeDeleteModal}
                                    className="bg-gray-500 text-white px-4 py-2 rounded float-right mr-2"
                                >
                                    Annuler
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Add Modal */}
                <Modal
                    isOpen={isAddModalOpen}
                    onRequestClose={closeAddModal}
                    className="modal"
                    overlayClassName="overlay"
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="text-2xl font-bold text-center">Ajout</h2>
                            <button onClick={closeAddModal} className="close-btn" style={{fontWeight:'800', color:'red'}}>&times;</button>
                        </div>
                        <hr />
                        <br />
                        <form onSubmit={handleAddSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Nom</label>
                                <input
                                    type="text"
                                    name="user_name"
                                    value={newUser.user_name}
                                    onChange={handleAddChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="user_mail"
                                    value={newUser.user_mail}
                                    onChange={handleAddChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    name="user_type"
                                    value={newUser.user_type}
                                    onChange={handleAddChange}
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
                                    Ajouter
                                </button>
                                <button
                                    onClick={closeAddModal}
                                    className="bg-gray-500 text-white px-4 py-2 rounded"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Success Modal */}
                <Modal
                    isOpen={isSuccessModalOpen}
                    onRequestClose={closeSuccessModal}
                    className="modal"
                    overlayClassName="overlay"
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="text-2xl font-bold">Information</h2>
                            <button onClick={closeDeleteModal} className="close-btn" style={{fontWeight:'800', color:'red'}} >&times;</button>
                        </div>
                        <hr />
                        <br />
                            <div className="">
                                <div className="flex" style={{alignItems:'center'}}>
                                    <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-6xl mb-4" />
                                    <p className="block text-m font-medium text-gray-700 mb-4 ml-5">
                                        Opération réussi
                                    </p>
                                </div>
                                <hr />
                                <br />
                                <button
                                    onClick={closeSuccessModal}
                                    className="bg-blue-500 text-white px-4 py-2 rounded float-right mr-2"
                                >
                                    Fermer
                                </button>
                            </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default UserManagement;
