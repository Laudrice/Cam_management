import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons';


const CameraManagement = () => {
    const [cams, setCams] = useState([]);
    const [selectedCam, setSelectedCam] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [newCam, setNewCam] = useState({
        cam_name: '',
        cam_IP: '',
        cam_canal: '',
        cam_protocol: '',
        cam_port:'',
    });

    useEffect(() => {
        const fetchCams = async () => {
            try {
                const response = await axios.get('/cams/allCams');
                setCams(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchCams();
    }, []);

    const filteredCams = cams.filter(cam =>
        cam.cam_name.toLowerCase().includes(search.toLowerCase()) ||
        cam.user_mail.toLowerCase().includes(search.toLowerCase()) 
    );

    const paginatedCams = filteredCams.slice(
        (currentPage - 1) * entries,
        currentPage * entries
    );

    const totalPages = Math.ceil(filteredCams.length / entries);

    const openEditModal = (cam) => {
        setSelectedCam(cam);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedCam(null);
    };

    const openDeleteModal = (cam) => {
        setSelectedCam(cam);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedCam(null);
    };

    const openAddModal = () => {
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewCam({
            cam_name: '',
            cam_IP: '',
            cam_canal: '',
            cam_protocol: '',
            cam_port:'',
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
        setSelectedCam({ ...selectedCam, [name]: value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/cams/${selectedCam.id}`, selectedCam);
            setCams(cams.map(cam => (cam.id === selectedCam.id ? selectedCam : cam)));
            closeEditModal();
            openSuccessModal();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteSubmit = async () => {
        try {
            await axios.delete(`/cams/${selectedCam.id}`);
            setCams(cams.filter(cam => cam.id !== selectedCam.id));
            closeDeleteModal();
            openSuccessModal();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setNewCam({ ...newCam, [name]: value });
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/cams/addCam', newCam);
            setCams([...cams, response.data]);
            closeAddModal();
            openSuccessModal();
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la camera:', error);
        }
    };
    

    return (
        <div className="p-4 bg-green-50">
            <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '90%', margin: 'auto' }}>
                <div className="flex" style={{justifyContent:'space-between'}}>
                    <h1 className="text-2xl font-bold mb-4">Cameras</h1>
                    
                    <button
                        onClick={openAddModal}
                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                    >
                        Ajouter une camera
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
                        placeholder="Rechercher..."
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
                            <th className="border border-gray-300 p-2">IP</th>
                            <th className="border border-gray-300 p-2">Canal</th>
                            <th className="border border-gray-300 p-2">Protocol</th>
                            <th className="border border-gray-300 p-2">Port</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCams.map(cam => (
                            <tr key={cam.id}>
                                <td className="border border-gray-300 p-2" style={{ width: '75px', textAlign:'center' }}>{cam.id}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '180px', textAlign:'center' }}>{cam.cam_name}</td>
                                <td className="border border-gray-300 p-2">{cam.cam_IP}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '180px', textAlign:'center' }}>{cam.cam_canal}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '180px', textAlign:'center' }}>{cam.cam_protocol}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '180px', textAlign:'center' }}>{cam.cam_port}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '225px' }}>
                                    <button
                                        onClick={() => openEditModal(cam)}
                                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(cam)}
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
                        {selectedCam && (
                            <form onSubmit={handleEditSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                                    <input
                                        type="text"
                                        name="cam_name"
                                        value={selectedCam.cam_name}
                                        onChange={handleEditChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">IP</label>
                                    <input
                                        type="text"
                                        name="cam_IP"
                                        value={selectedCam.cam_IP}
                                        onChange={handleEditChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Canal</label>
                                    <input
                                        type="text"
                                        name="cam_canal"
                                        value={selectedCam.cam_canal}
                                        onChange={handleEditChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Protocol</label>
                                    <input
                                        type="text"
                                        name="cam_protocol"
                                        value={selectedCam.cam_protocol}
                                        onChange={handleEditChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Port</label>
                                    <input
                                        type="text"
                                        name="cam_port"
                                        value={selectedCam.cam_port}
                                        onChange={handleEditChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        required
                                    />
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
                        {selectedCam && (
                            <div className="">
                                <div className="flex" style={{alignItems:'center'}}>
                                    <FontAwesomeIcon icon={faCircleXmark} className="text-red-500 text-6xl mb-4" />
                                    <p className="block text-m font-medium text-gray-700 mb-4 ml-5">
                                        Êtes-vous sûr de vouloir supprimer <b>{selectedCam.cam_name}</b> ?
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
                                    name="cam_name"
                                    value={newCam.cam_name}
                                    onChange={handleAddChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">IP</label>
                                <input
                                    type="text"
                                    name="cam_IP"
                                    value={newCam.cam_IP}
                                    onChange={handleAddChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Canal</label>
                                <input
                                    type="text"
                                    name="cam_canal"
                                    value={newCam.cam_canal}
                                    onChange={handleAddChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Protocol</label>
                                <input
                                    type="text"
                                    name="cam_protocol"
                                    value={newCam.cam_protocol}
                                    onChange={handleAddChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Port</label>
                                <input
                                    type="text"
                                    name="cam_port"
                                    value={newCam.cam_port}
                                    onChange={handleAddChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    required
                                />
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

export default CameraManagement;
