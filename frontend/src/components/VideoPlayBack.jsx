import React, { useState, useRef } from 'react';
import moment from 'moment';
import { ThreeDots } from 'react-loader-spinner';

const VideoPlayBack = ({ channelId }) => {
    const [startTime, setStartTime] = useState(moment().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'));
    const [endTime, setEndTime] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentProgress, setCurrentProgress] = useState(0); // Progress in seconds
    const videoRef = useRef(null);

    // Calculate total duration in seconds
    const totalDuration = moment(endTime).diff(moment(startTime), 'seconds');

    const handleStreamVideo = async (newStartTime) => {
        setError('');
        setLoading(true);
    
        const streamStart = newStartTime || startTime;
        const streamUrl = `http://localhost:8080/video-history/${channelId}?startTime=${streamStart}&endTime=${endTime}`;
    
        try {
            const response = await fetch(streamUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Échec de la récupération de la vidéo');
            }
    
            setVideoUrl(streamUrl);
            
            // Attendez que la vidéo soit prête
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.load(); // Recharge la nouvelle source vidéo
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.currentTime = moment(newStartTime).diff(moment(startTime), 'seconds'); // Met à jour la position
                    videoRef.current.play();
                };
            }
        } catch (err) {
            console.error('Erreur lors de la récupération de la vidéo:', err);
            setError(err.message);
            setVideoUrl('');
        } finally {
            setLoading(false);
        }
    };
    

    const handleProgressClick = (e) => {
        const progressBar = e.target;
        const clickPosition = e.nativeEvent.offsetX;
        const progressBarWidth = progressBar.offsetWidth;
        const clickedPercent = clickPosition / progressBarWidth;
        const newTimeInSeconds = Math.floor(clickedPercent * totalDuration);
        const newStartTime = moment(startTime).add(newTimeInSeconds, 'seconds').format('YYYY-MM-DDTHH:mm:ss');
        
        setCurrentProgress(newTimeInSeconds);
    
        // Déclenchez la navigation à la position sélectionnée
        handleStreamVideo(newStartTime);
    };
    
    

    return (
        <div className="video-history-container">
            <h4 className="text-xl font-bold mb-4">Informations</h4>
            <div className="flex" style={{ width: '98%' }}>
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
                <div className="input-group mb-4" style={{ marginLeft: '50px' }}>
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
                    onClick={() => handleStreamVideo()}
                    className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                >
                    Voir la vidéo
                </button>
            </div>
            
            {videoUrl && !error && (
                <div className="video-player mt-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        loop
                        style={{ width: '100%', border: '1px solid grey', backgroundColor: '#525151' }}
                    >
                        <source src={videoUrl} type="video/mp4" />
                        Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                                            
                    <div
                        className="progress-bar mt-4 bg-gray-300 rounded-full h-2 relative cursor-pointer"
                        style={{ width: '100%' }}
                        onClick={handleProgressClick}
                    >
                        <div
                            className="progress bg-blue-500 h-2 rounded-full absolute"
                            style={{ width: `${(currentProgress / totalDuration) * 100}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-sm">
                        {moment(startTime).add(currentProgress, 'seconds').format('YYYY-MM-DD HH:mm:ss')} /{' '}
                        {moment(endTime).format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                </div>
            )}
            {loading && (
                <div className="flex justify-center items-center mt-4">
                    <ThreeDots color="#15803d" height={80} width={80} />
                </div>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
};

export default VideoPlayBack;