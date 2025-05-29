import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        console.log("Manifest loaded, video can be played.");
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = videoUrl;
    }
  }, [videoUrl]);

  return (
    <video ref={videoRef} controls>
      Votre navigateur ne supporte pas la balise vidéo.
    </video>
  );
};

export default VideoPlayer;
