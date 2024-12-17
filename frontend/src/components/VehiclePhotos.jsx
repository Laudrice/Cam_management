import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from '../axiosConfig';
import './../assets/css/VehiclePhotos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';


const VehiclePhotos = () => {
    const [cameras, setCameras] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState('');
    const [loading, setLoading] = useState(false);

    const formatDate = (dateString) => {
        const regex = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;
        const match = dateString.match(regex);

        if (match) {
            const year = match[1];
            const month = match[2];
            const day = match[3];
            const hour = match[4];
            const minute = match[5];

            return { date: `${day}-${month}-${year}`, time: `${hour}:${minute}` };
        } else {
            return { date: dateString, time: '' };
        }
    };

    useEffect(() => {
        const fetchCameras = async () => {
            try {
                const response = await axios.get('/cams/allCams');
                setCameras(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des caméras', error);
            }
        };

        fetchCameras();
    }, []);

    const searchPhotos = async () => {
        if (!selectedCamera || !startTime || !endTime) {
            alert('Veuillez sélectionner une caméra et spécifier les dates');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const url = `http://localhost:8080/api/photos/vehicle?cameraId=${selectedCamera}&startTime=${startTime}&endTime=${endTime}`;
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            setPhotos(response.data.photos);
        } catch (error) {
            console.error('Erreur lors de la recherche des photos', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (imageURL) => {
        setCurrentImage(imageURL);
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 bg-green-50">
        <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '90%', margin: 'auto' }}>
            <div className="flex" style={{ justifyContent: 'space-between' }}>
                <h1 className="text-2xl font-bold mb-4">Photos Véhicule</h1>
            </div>
            <br />
            <hr />
            <br />
            <div className="search-controls">
            <label htmlFor="cameraSelect" className="mr-4">Sélectionner une caméra :</label>
                <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md"
                >
                    <option value="">Sélectionner une caméra</option>
                    {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                            {camera.nom_}
                        </option>
                    ))}
                </select>
                <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                />
                <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                />
                <button onClick={searchPhotos} disabled={loading}>
                    {loading ? 'Chargement...' : 'Rechercher'}
                </button>
            </div>
            <hr />
            <br />
            <div className="photos-grid">
                {photos.length === 0 ? (
                    <p>Aucune photo trouvée</p>
                ) : (
                    photos.map((photo, index) => {
                        const { date, time } = formatDate(photo.startTime);
                        return (
                            <div key={index} className="photo-card">
                                <img
                                    src={photo.imageURL}
                                    className="photo-thumbnail"
                                    onClick={() => openModal(photo.imageURL)}
                                    style={{'borderBottom':'2px solid #0f3675'}}
                                />
                                <div className="photo-info">    
                                    <div className="photo-date">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2"/> <b>{date}</b>
                                    </div>
                                    <div className="photo-time">
                                    <FontAwesomeIcon icon={faClock} className="mr-2"/> <b>{time}</b>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="modal-content">
                <img
                    src={currentImage}
                    title="Détection de voiture en mouvement"
                    className="modal-iframe"
                    style={{ width: '100%', border: 'none' }}
                ></img>
                <button onClick={() => setIsModalOpen(false)} className="close-modal-button">X</button>
            </Modal>
            <br />
        </div>
        </div>
    );
};

export default VehiclePhotos;
