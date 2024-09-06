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
        name: '',
        enabled: true,
        transport: '',
        nom_: '',
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
        cam.name.toLowerCase().includes(search.toLowerCase()) ||
        cam.nom_.toLowerCase().includes(search.toLowerCase())
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
            name: '',
            enabled: true,
            transport: '',
            nom_: '',
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
                        style={{display:'none'}}
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
                            <th className="border border-gray-300 p-2">Transport</th>
                            <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCams.map(cam => (
                            <tr key={cam.id}>
                                <td className="border border-gray-300 p-2" style={{ width: '75px', textAlign:'center' }}>{cam.id}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '300px', textAlign:'center' }}>{cam.nom_}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '180px', textAlign:'center' }}>{cam.transport}</td>
                                <td className="border border-gray-300 p-2" style={{ width: '275px' }}>
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
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium">Identifiant dans le NVR:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={selectedCam?.name || ''}
                                    onChange={handleEditChange}
                                    className="border border-gray-300 rounded-md p-2 w-full"
                                    readOnly
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="nom_" className="block text-sm font-medium">Nom Alternative:</label>
                                <input
                                    type="text"
                                    id="nom_"
                                    name="nom_"
                                    value={selectedCam?.nom_ || ''}
                                    onChange={handleEditChange}
                                    className="border border-gray-300 rounded-md p-2 w-full"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="transport" className="block text-sm font-medium">Transport:</label>
                                <input
                                    type="text"
                                    id="transport"
                                    name="transport"
                                    value={selectedCam?.transport || ''}
                                    onChange={handleEditChange}
                                    className="border border-gray-300 rounded-md p-2 w-full"
                                    readOnly
                                />
                            </div>
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Sauvegarder</button>
                            <button onClick={closeEditModal} className="bg-gray-500 text-white px-4 py-2 rounded">Annuler</button>
                        </form>
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
                        <p>Êtes-vous sûr de vouloir supprimer la caméra <strong>{selectedCam?.name}</strong> ?</p>
                        <button onClick={handleDeleteSubmit} className="bg-red-500 text-white px-4 py-2 rounded mr-2">Supprimer</button>
                        <button onClick={closeDeleteModal} className="bg-gray-500 text-white px-4 py-2 rounded">Annuler</button>
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
                            <h2 className="text-2xl font-bold">Ajouter</h2>
                            <button onClick={closeAddModal} className="close-btn" style={{fontWeight:'800', color:'red'}}>&times;</button>
                        </div>
                        <hr />
                        <br />
                        <form onSubmit={handleAddSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium">Nom:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={newCam.name}
                                    onChange={handleAddChange}
                                    className="border border-gray-300 rounded-md p-2 w-full"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="nom_" className="block text-sm font-medium">Nom Alternative:</label>
                                <input
                                    type="text"
                                    id="nom_"
                                    name="nom_"
                                    value={newCam.nom_}
                                    onChange={handleAddChange}
                                    className="border border-gray-300 rounded-md p-2 w-full"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="transport" className="block text-sm font-medium">Transport:</label>
                                <input
                                    type="text"
                                    id="transport"
                                    name="transport"
                                    value={newCam.transport}
                                    onChange={handleAddChange}
                                    className="border border-gray-300 rounded-md p-2 w-full"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="enabled" className="block text-sm font-medium">Enabled:</label>
                                <select
                                    id="enabled"
                                    name="enabled"
                                    value={newCam.enabled ? 'true' : 'false'}
                                    onChange={handleAddChange}
                                    className="border border-gray-300 rounded-md p-2 w-full"
                                    required
                                >
                                    <option value="true">Oui</option>
                                    <option value="false">Non</option>
                                </select>
                            </div>
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Ajouter</button>
                            <button onClick={closeAddModal} className="bg-gray-500 text-white px-4 py-2 rounded">Annuler</button>
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
                            <button onClick={closeSuccessModal} className="close-btn" style={{fontWeight:'800', color:'red'}} >&times;</button>
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
