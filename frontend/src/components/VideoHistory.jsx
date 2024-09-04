import React, { useState } from 'react';
import moment from 'moment';

const VideoHistory = ({ channelId }) => {
    const [startTime, setStartTime] = useState(moment().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss'));
    const [endTime, setEndTime] = useState(moment().format('YYYY-MM-DDTHH:mm:ss'));
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');

    const handleStreamVideo = async () => {
        setError('');
        if (new Date(startTime) > new Date(endTime)) {
            setError('La date de début ne peut pas être après la date de fin.');
            return;
        }

        const streamUrl = `http://10.4.105.29:8080/video-history/${channelId}?startTime=${startTime}&endTime=${endTime}`;

        try {
            const response = await fetch(streamUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Échec de la récupération de la vidéo');
            }
            setVideoUrl(streamUrl);
        } catch (err) {
            console.error('Erreur lors de la récupération de la vidéo:', err);
            setError(err.message);
            setVideoUrl('');
        }
    };

    return (
        <div className="video-history-container">
            <h4 className="text-xl font-bold mb-4">Informations</h4>
                <div className="flex" style={{width:'98%',}}>
            <div className="input-group mb-4">
                <label htmlFor="startTime" className="block mb-2">Heure de début:</label>
                <input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md w-full"
                />
            </div>
            <div className="input-group mb-4" style={{marginLeft:'50px'}}>
                <label htmlFor="endTime" className="block mb-2">Heure de fin:</label>
                <input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md w-full"
                />
            </div>
                </div>
            <button
                onClick={handleStreamVideo}
                className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
                Voir la vidéo
            </button>
            <br />
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {videoUrl && !error && (
                <div className="video-player mt-4">
                    <br />
                    <hr />
                    <br />
                    <video controls style={{ width: '100%', borderRadius:'1rem', border:'1px solid grey' }}>
                        <source src={videoUrl} type="video/mp4" />
                        Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                </div>
            )}
        </div>
    );
};

export default VideoHistory;
