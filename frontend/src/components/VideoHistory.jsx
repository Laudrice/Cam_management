import React, { useState } from 'react';
import moment from 'moment';
import { ThreeDots } from 'react-loader-spinner';

const VideoHistory = ({ channelId }) => {
    const [startTime, setStartTime] = useState(moment().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'));
    const [endTime, setEndTime] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDownloadVideo = async () => {
        setError('');
        setLoading(true);
        if (new Date(startTime) > new Date(endTime)) {
            setError('La date de début ne peut pas être après la date de fin.');
            setLoading(false);
            return;
        }

        const downloadUrl = `http://10.4.105.29:8080/save-video/${channelId}?startTime=${startTime}&endTime=${endTime}`;

        try {
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Échec de la sauvegarde de la vidéo');
            }

            const data = await response.json();
            setVideoUrl(data.path);
            alert('Vidéo sauvegardée avec succès. Vous pouvez la télécharger.');
        } catch (err) {
            console.error('Erreur lors de la sauvegarde de la vidéo:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStreamVideo = async () => {
        setError('');
        setLoading(true);
        if (new Date(startTime) > new Date(endTime)) {
            setError('La date de début ne peut pas être après la date de fin.');
            setLoading(false);
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
        } finally {
            setLoading(false);
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
            <div className="flex gap-4">
                <button
                    onClick={handleStreamVideo}
                    className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                >
                    Voir la vidéo
                </button>
                <button
                    onClick={handleDownloadVideo}
                    className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
                >
                    Enregistrer la vidéo
                </button>
            </div>
            {loading && (
                <div className="flex justify-center items-center mt-4">
                    <ThreeDots color="#15803d" height={80} width={80} />
                </div>
            )}
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