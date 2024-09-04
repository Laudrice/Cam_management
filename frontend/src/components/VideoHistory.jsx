import React, { useState } from 'react';
import moment from 'moment';

const VideoHistory = ({ channelId }) => {
    const [startTime, setStartTime] = useState(moment().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss'));
    const [endTime, setEndTime] = useState(moment().format('YYYY-MM-DDTHH:mm:ss'));
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');

    const handleStreamVideo = async () => {
        setError('');
        const streamUrl = `http://10.4.105.29:8080/video-history/${channelId}?startTime=${startTime}&endTime=${endTime}`;
        
        try {
            const response = await fetch(streamUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch video');
            }
            setVideoUrl(streamUrl);
        } catch (err) {
            console.error('Error fetching video:', err);
            setError(err.message);
            setVideoUrl('');
        }
    };

    return (
        <div>
            <h4>Video History</h4>
            <div>
                <label>Start Time: </label>
                <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                />
            </div>
            <div>
                <label>End Time: </label>
                <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                />
            </div>
            <button onClick={handleStreamVideo}>Stream Video</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {videoUrl && !error && (
                <div>
                    <h5>Video Player</h5>
                    <video controls width="600">
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
        </div>
    );
};

export default VideoHistory;