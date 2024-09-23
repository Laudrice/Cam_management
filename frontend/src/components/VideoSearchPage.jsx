import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import Modal from 'react-modal';
import moment from 'moment';
import { ThreeDots } from 'react-loader-spinner';

const VideoSearchPage = () => {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [startTime, setStartTime] = useState(moment().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'));
    const [endTime, setEndTime] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [detectionType, setDetectionType] = useState('');
    const [videos, setVideos] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [ffmpegProcess, setFfmpegProcess] = useState(null); // Nouvel état pour le processus FFmpeg

    useEffect(() => {
        fetchCameras();
    }, []);

    const fetchCameras = async () => {
        try {
            const response = await axios.get('/cams/allCams');
            setCameras(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = async () => {
        if (!selectedCamera || !startTime || !endTime || !detectionType) {
            alert('Veuillez remplir tous les champs.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const apiUrl = detectionType === 'motion' 
                ? `/videos/motion?cameraId=${selectedCamera}&startTime=${startTime}&endTime=${endTime}`
                : `/videos/vehicle?cameraId=${selectedCamera}&startTime=${startTime}&endTime=${endTime}`;

            const response = await axios.get(apiUrl);
            setVideos(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des vidéos:', error);
            setError('Erreur lors de la récupération des vidéos.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = async (videoData) => {
        setError('');
        const streamUrl = `http://10.4.105.29:8080/video-event/${selectedCamera}?startTime=${videoData.startTime}&endTime=${videoData.endTime}`;
        
        try {
            const response = await fetch(streamUrl);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération de la vidéo.');
            }
            setVideoUrl(streamUrl);
            setIsModalOpen(true);
            // Vous pouvez également lancer ici un processus FFmpeg si nécessaire
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    const handleDownloadVideo = async (videoData) => {
        const downloadUrl = `http://10.4.105.29:8080/save-video/${selectedCamera}?startTime=${videoData.startTime}&endTime=${videoData.endTime}`;
        
        try {
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Échec de la sauvegarde de la vidéo');
            }
            alert('Vidéo sauvegardée avec succès.');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la vidéo:', error);
            setError('Erreur lors de la sauvegarde de la vidéo.');
        }
    };

    const closeModal = async () => {
        setIsModalOpen(false);
        setVideoUrl('');
        
        // Appel à l'API pour arrêter le flux vidéo
        if (selectedCamera) {
            await axios.post(`/stop-video/${selectedCamera}`);
        }
    };

    return (
        <div className="container">
            <h1>Recherche de vidéos</h1>
            <div>
                <label>Caméra</label>
                <select value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)}>
                    <option value="">Sélectionnez une caméra</option>
                    {cameras.map(camera => (
                        <option key={camera.id} value={camera.id}>{camera.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label>Date de début</label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
                <label>Date de fin</label>
                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            <div>
                <label>Type de détection</label>
                <select value={detectionType} onChange={e => setDetectionType(e.target.value)}>
                    <option value="">Sélectionnez le type de détection</option>
                    <option value="motion">Détection de mouvement</option>
                    <option value="vehicle">Détection de véhicule</option>
                </select>
            </div>
            <button onClick={handleSearch}>Rechercher</button>

            <div className="video-results">
                {loading && <ThreeDots color="#15803d" height={80} width={80} />}
                {error && <p className="text-red-500">{error}</p>}
                {videos.length > 0 ? (
                    videos.map((video, index) => (
                        <div key={index}>
                            <p>{video.startTime} - {video.eventType}</p>
                            <button onClick={() => openModal(video)}>Voir la vidéo</button>
                            <button onClick={() => handleDownloadVideo(video)}>Télécharger</button>
                        </div>
                    ))
                ) : (
                    !loading && <p>Aucune vidéo trouvée.</p>
                )}
            </div>

            <Modal isOpen={isModalOpen} onRequestClose={closeModal}>
                <h2>Vidéo</h2>
                <video controls style={{ width: '80%' }}>
                    <source src={videoUrl} type="video/mp4" />
                    Votre navigateur ne supporte pas la balise vidéo.
                </video>
                <button onClick={closeModal}>Fermer</button>
            </Modal>
        </div>
    );
};

export default VideoSearchPage;
