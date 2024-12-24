import React, { useState } from 'react';
import axios from 'axios';

const VehicleVideosPage = () => {
    const [cameraId, setCameraId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [videos, setVideos] = useState([]); // Array to store the video data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Function to fetch videos from the API
    const fetchVideos = async () => {
        if (!cameraId || !startTime || !endTime) {
            setError('Tous les champs sont requis.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log("Paramètres envoyés : ", { cameraId, startTime, endTime });

            const response = await axios.get('http://localhost:8080/api/videos/vehicle', {
                params: { cameraId, startTime, endTime },
            });

            console.log('Réponse API :', response.data);

            // Vérification et extraction des données pertinentes
            if (response.data && Array.isArray(response.data)) {
                const videoData = response.data.map(video => ({
                    trackID: video.trackID,
                    startTime: video.startTime,
                    endTime: video.endTime,
                    playbackURI: video.playbackURI,
                }));
                setVideos(videoData);
            } else {
                console.log('Erreur : réponse API non conforme');
                setVideos([]); // Si pas de vidéos
                setError('Aucune vidéo trouvée pour les paramètres spécifiés.');
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des vidéos :', err);
            setError('Impossible de récupérer les vidéos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vehicle-videos-page">
            <h1>Recherche de Vidéos de Véhicules</h1>

            <div className="filters">
                <label>
                    ID de la caméra :
                    <input
                        type="text"
                        value={cameraId}
                        onChange={(e) => setCameraId(e.target.value)}
                    />
                </label>

                <label>
                    Heure de début :
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </label>

                <label>
                    Heure de fin :
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </label>

                <button onClick={fetchVideos} disabled={loading}>
                    {loading ? 'Chargement...' : 'Rechercher'}
                </button>
            </div>

            {error && <p className="error">{error}</p>}

            {/* Grille avec affichage sécurisé */}
            <div className="videos-grid">
                {loading ? (
                    <p>Chargement des vidéos...</p>
                ) : (
                    <div className="video-list">
                        {videos.length > 0 ? (
                            videos.map((video, index) => (
                                <div key={index} className="video-card">
                                    <p><b>Track ID :</b> {video.trackID}</p>
                                    <p><b>Date de début :</b> {new Date(video.startTime).toLocaleString()}</p>
                                    <p><b>Date de fin :</b> {new Date(video.endTime).toLocaleString()}</p>
                                    <a
                                        href={video.playbackURI}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="play-button"
                                        style={{'alignItems':'center', 'margin-left':'30%'}}
                                    >
                                        Lire la Vidéo
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p>Aucune vidéo trouvée pour les paramètres spécifiés.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleVideosPage;
