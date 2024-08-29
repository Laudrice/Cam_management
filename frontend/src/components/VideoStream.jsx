import React, { useRef, useEffect } from 'react';

const VideoStream = ({ channelId, quality = 'low', onClick }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            const qualityEndpoint = quality === 'high' ? 'stream-high' : quality === 'low' ? 'stream-lowest' : 'stream';
            videoElement.src = `http://10.4.105.29:8080/${qualityEndpoint}/${channelId}`;
            videoElement.play().catch(e => console.error('Error playing video:', e));
        }

        return () => {
            if (videoElement) {
                videoElement.pause();
                videoElement.src = '';
            }
        };
    }, [channelId, quality]);

    return (
        <video 
            ref={videoRef} 
            muted
            style={{ width: '100%', maxWidth: '1150px',minHeight:'195px' ,cursor: 'pointer',backgroundColor:'#525151' }}
            onClick={onClick}
        />
    );
};

export default VideoStream;
