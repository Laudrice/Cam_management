import React, { useState, useEffect } from 'react';
import VideoHistory from './VideoHistory';
import axios from '../axiosConfig';

const VideoHistoryPage = () => {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [cameraName, setCameraName] = useState('');

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

    const handleCameraChange = async (e) => {
        const cameraId = e.target.value;
        setSelectedCamera(cameraId);

        if (cameraId) {
            try {
                const response = await fetch(`http://10.4.105.29:8080/video-history/${cameraId}`);
                const data = await response.json();
                if (data) {
                    setCameraName(data.cameraName);
                }
            } catch (error) {
                console.error('Error fetching camera data:', error);
            }
        } else {
            setCameraName('');
        }
    };

    return (
        <div className="p-4 bg-green-50">
            <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '90%', margin: 'auto' }}>
                <div className="flex" style={{ justifyContent: 'space-between' }}>
                    <h1 className="text-2xl font-bold mb-4">Recherche d'une vidéo</h1>
                </div>
                <br />
                <hr />
                <br />
                <div className="mb-4 flex items-center">
                    <label htmlFor="cameraSelect" className="mr-4">Sélectionner une caméra :</label>
                    <select
                        id="cameraSelect"
                        onChange={handleCameraChange}
                        className="border border-gray-300 p-2 rounded-md"
                    >
                        <option value="">Choisir une caméra</option>
                        {cameras.map((camera) => (
                            <option key={camera.id} value={camera.id}>
                                {camera.nom_}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedCamera && (
                    <div style={{ marginTop: '20px' }}>
                        <VideoHistory
                            key={selectedCamera}
                            channelId={selectedCamera}
                            cameraName={cameraName}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoHistoryPage;
