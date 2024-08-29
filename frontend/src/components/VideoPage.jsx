import React, { useState, useEffect } from 'react';
import VideoStream from './VideoStream';
import Modal from 'react-modal';

const VideoPage = () => {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);

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

    const handleCameraClick = (cameraId) => {
        setSelectedCamera(cameraId);
    };

    const handleCloseModal = () => {
        setSelectedCamera(null);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Camera</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {cameras.map(camera => (
                    <div key={camera.id} style={{ position: 'relative' }}>
                        <VideoStream 
                            channelId={camera.id} 
                            quality="low" 
                            onClick={() => handleCameraClick(camera.id)} 
                        />
                    </div>
                ))}
            </div>

            {selectedCamera && (
                <Modal
                    isOpen={!!selectedCamera}
                    onRequestClose={handleCloseModal}
                    contentLabel="High Quality Camera Stream"
                    style={{
                        content: {
                            top: '50%',
                            left: '50%',
                            right: 'auto',
                            bottom: 'auto',
                            margin: 'auto',
                            transform: 'translate(-50%, -50%)',
                            width: 'calc(100% - 20px)', 
                            height: 'calc(100% - 20px)',
                            padding: '0',
                        }
                    }}
                >
                    <VideoStream 
                        channelId={selectedCamera} 
                        quality="high" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <button 
                        onClick={handleCloseModal} 
                        style={{ 
                            position: 'absolute', 
                            top: '20px', 
                            right: '20px', 
                            background: 'red', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '50%', 
                            width: '30px', 
                            height: '30px', 
                            textAlign: 'center', 
                            lineHeight: '30px', 
                            cursor: 'pointer' 
                        }}
                    >
                        X
                    </button>
                </Modal>
            )}
        </div>
    );
};

export default VideoPage;
