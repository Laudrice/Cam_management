import React, { useEffect, useState } from 'react';

const Home = () => {
    const [cameras, setCameras] = useState([]);

    useEffect(() => {
        // Fetch cameras data from backend
        fetch('/api/cameras')
            .then(response => response.json())
            .then(data => setCameras(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cameras.map((camera, index) => (
                    <div key={index} className="bg-black p-2 rounded-lg shadow-lg">
                        <h2 className="text-white text-center mb-2">{camera.cam_name}</h2>
                        <div className="relative h-0" style={{ paddingBottom: '56.25%' }}>
                            {/* Placeholder pour la vidéo. Remplacez src par l'URL réelle du flux */}
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://${camera.cam_IP}:${camera.cam_port}/live`}
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                title={camera.cam_name}
                            ></iframe>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
