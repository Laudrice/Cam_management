import React, { useState, useEffect } from 'react';
import VideoHistory from './VideoHistory';

const VideoHistoryPage = () => {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [cameraName, setCameraName] = useState('');

    useEffect(() => {
        fetchCameras();
    }, []);

    const fetchCameras = async () => {
        try {
            const response = await fetch('http://10.4.105.29:8080/cameras');
            const data = await response.json();
            if (data.status === 'success') {
                setCameras(data.data);
            }
        } catch (error) {
            console.error('Error fetching cameras:', error);
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
        <div>
            <h1>Surveillance Camera Streams</h1>
            <div>
                <label htmlFor="cameraSelect">Sélectionner une caméra :</label>
                <select id="cameraSelect" onChange={handleCameraChange}>
                    <option value="">Choisir une caméra</option>
                    {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                            {camera.name}
                        </option>
                    ))}
                </select>
            </div>
            {selectedCamera && (
                <div style={{ marginTop: '20px' }}>
                    <VideoHistory channelId={selectedCamera} cameraName={cameraName} />
                </div>
            )}
        </div>
    );
};

export default VideoHistoryPage;
