import React, { useState, useRef } from 'react';
import moment from 'moment';
import { ThreeDots } from 'react-loader-spinner';

const VideoHistory = ({ channelId }) => {
    const [startTime, setStartTime] = useState(moment().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'));
    const [endTime, setEndTime] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [localVideo, setLocalVideo] = useState(null); // Gérer la vidéo locale
    const [playbackRate, setPlaybackRate] = useState(1); // Gérer la vitesse de lecture

    const videoRef = useRef(null); // Référence pour accéder à la vidéo

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const videoURL = URL.createObjectURL(file);
            setLocalVideo(videoURL);
            setVideoUrl(videoURL); // Remplacer par la vidéo locale
        }
    };

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

    // Gérer le changement de vitesse de lecture
    const handlePlaybackRateChange = (e) => {
        const rate = parseFloat(e.target.value);
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate; // Appliquer la vitesse au lecteur
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

            {/* Input pour sélectionner une vidéo locale */}
            <div className="mt-4">
                <label htmlFor="localVideo" className="block mb-2">Ou sélectionner une vidéo locale:</label>
                <input
                    id="localVideo"
                    type="file"
                    accept="video/mp4/mkv"
                    onChange={handleFileChange}
                    className="border border-gray-300 p-2 rounded-md"
                />
            </div>

            {/* Sélection de la vitesse de lecture */}
            <div className="mt-4">
                <label htmlFor="playbackRate" className="block mb-2">Vitesse de lecture:</label>
                <select
                    id="playbackRate"
                    value={playbackRate}
                    onChange={handlePlaybackRateChange}
                    className="border border-gray-300 p-2 rounded-md"
                >
                    <option value="0.25">0.25x</option>
                    <option value="0.5">0.5x</option>
                    <option value="1">1x (normal)</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                    <option value="8">8x</option>
                    <option value="16">16x</option>
                    {/* <option value="32">32x</option>
                    <option value="64">64x</option> */}
                </select>
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
                    <video ref={videoRef} controls style={{ width: '100%', borderRadius:'1rem', border:'1px solid grey' }}>
                        <source src={videoUrl} type="video/mp4" />
                        Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                </div>
            )}
        </div>
    );
};

export default VideoHistory;
