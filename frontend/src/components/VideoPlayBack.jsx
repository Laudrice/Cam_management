import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import { Link } from 'react-router-dom';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import moment from 'moment';

const VideoPlayBack = ({ channelId }) => {
    const [startTime, setStartTime] = useState(moment().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'));
    const [endTime, setEndTime] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const videoRef = useRef(null);
    const timelineRef = useRef(null);
    const timelineInstance = useRef(null); // Stockage de l'instance de la timeline

    useEffect(() => {
        if (showTimeline) {
            const container = timelineRef.current;

            // Détruire l'ancienne timeline si elle existe
            if (timelineInstance.current) {
                timelineInstance.current.destroy();
                timelineInstance.current = null;
            }

            const items = new DataSet([
                {
                    id: 1,
                    content: 'Début',
                    start: moment(startTime).toISOString(),
                },
                {
                    id: 2,
                    content: 'Fin',
                    start: moment(endTime).toISOString(),
                },
            ]);

            // Configurez les options de la timeline
            const options = {
                start: moment(startTime).toISOString(),
                end: moment(endTime).toISOString(),
                min: moment(startTime).toISOString(),
                max: moment(endTime).toISOString(), // Limite de scroll maximale
                zoomMin: 1000 * 60 * 5,
                zoomMax: 1000 * 60 * 60 * 24, // Zoom maximum (1 jour)
                selectable: true,
                editable: false,
                margin: { item: 10 },
                format: {
                    minorLabels: {
                        minute: 'HH:mm',
                    },
                    majorLabels: {
                        hour: 'YYYY-MM-DD HH:mm',
                    },
                },
            };

            // Initialisez la nouvelle timeline
            if (container) {
                timelineInstance.current = new Timeline(container, items, options);

                // Gérer les clics sur la timeline
                timelineInstance.current.on('click', (event) => {
                    if (event.time) {
                        // Récupérez le timestamp cliqué
                        const selectedTime = moment(event.time).format('YYYY-MM-DDTHH:mm:ss');
                        console.log('Temps sélectionné:', selectedTime);

                        // Requêter la vidéo à partir de ce moment
                        handleStreamVideo(selectedTime);
                    }
                });
            }
        }
    }, [showTimeline, startTime, endTime]);

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

            // Configurez la vidéo avec la position sélectionnée
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.load();
                videoRef.current.onloadedmetadata = () => {
                    const timeInSeconds = moment(newStartTime).diff(moment(startTime), 'seconds');
                    videoRef.current.currentTime = timeInSeconds;
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

    const handleSearch = () => {
        setShowTimeline(true); // Afficher la timeline après la recherche
        handleStreamVideo();
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
                    onClick={handleSearch}
                    className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                >
                    Rechercher vidéo
                </button>
            </div>

            {videoUrl && !error && (
                <div className="video-player mt-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        loop
                        playsinline
                        style={{ width: '100%', border: '1px solid grey', backgroundColor: '#525151' }}
                    >
                        <source src={videoUrl} type="video/mp4" />
                        Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                </div>
            )}

            {showTimeline && (
                <div className="timeline-container mt-4">
                    <h4 className="text-lg font-bold">Progression</h4>
                    <div
                        ref={timelineRef}
                        style={{ height: '100px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}
                    ></div>
                </div>
            )}
            {loading && (
                <div className="flex justify-center items-center mt-4">
                    <p>Chargement...</p>
                </div>
            )}
            <br />
            {error && <p className="text-red-500 mt-4">{error}</p>}
            <br />
        </div>
    );
};

export default VideoPlayBack;
