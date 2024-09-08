import React, { useState, useEffect } from 'react';
import VideoStream from './VideoStream';
import Modal from 'react-modal';

Modal.setAppElement('#root'); 

const CameraList = () => {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [streamsActive, setStreamsActive] = useState(true);

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
        setStreamsActive(false);
    };

    const handleCloseModal = () => {
        setSelectedCamera(null);
        setStreamsActive(true);
    };

    return (

        <div className="p-4 bg-green-50">
            <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '90%', margin: 'auto' }}>
                <div className="flex" style={{justifyContent:'space-between'}}>
                    <h1 className="text-2xl font-bold mb-4">Live</h1>
                </div>
                <hr />    
                <br />
                <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}>
                {cameras.map(camera => (
                    <div key={camera.id} style={{ position: 'relative' }}>
                        {streamsActive && (
                            <VideoStream 
                                channelId={camera.id} 
                                quality="low" 
                                onClick={() => handleCameraClick(camera.id)} 
                                style={{ cursor: 'pointer' }}
                            />
                        )}
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
                            paddingLeft: '50px',
                            transform: 'translate(-50%, -50%)',
                            width: 'calc(100% - 20px)', 
                            height: 'calc(100% - 20px)',
                            padding: '0',
                            
                        }
                    }}
                >
                    <h1 className="text-2xl font-bold mb-4">Live</h1>
                    <VideoStream 
                        channelId={selectedCamera} 
                        quality="high" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <button onClick={handleCloseModal} style={{ position: 'absolute', top: '20px', right: '20px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', textAlign: 'center', lineHeight: '30px', cursor: 'pointer' }}>X</button>
                </Modal>
            )}
        </div>
            </div>
        </div>
    );
};

export default CameraList;
