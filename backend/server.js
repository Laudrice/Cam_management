require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { authenticateToken, loginUser } = require('./controllers/userController');
const { syncNVRWithDatabase, formatRTSPDate, getVideoDuration } = require('./controllers/camController');
const axiosDigestAuth = require('@mhoc/axios-digest-auth').default;
const xml2js = require('xml2js');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const moment = require('moment');
const { promisify } = require('util');
const axios = require('axios');

const app = express();

// Configuration des options CORS
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const digestAuth = new axiosDigestAuth({
    username: process.env.RTSP_USERNAME,
    password: process.env.RTSP_PASSWORD
});

// Route login
app.post('/api/users/login', loginUser);

// Router pour les utilisateurs (authentification requise)
const user_router = require('./routes/userRouter.js');
app.use('/api/users', authenticateToken, user_router);

// Router pour les caméras (authentification requise)
const cam_router = require('./routes/camRouter.js');
app.use('/api/cams', cam_router);

// Test API
app.get('/', (req, res) => {
    res.json({ message: 'Test API' });
});
syncNVRWithDatabase();

// PORT serveur
const PORT = process.env.PORT || 8080;

// Récupération de tous les caméras 
app.get('/cameras', async (req, res) => {
    try {
        const response = await digestAuth.request({
            url: `http://${process.env.RTSP_HOST}:80/ISAPI/Streaming/channels`,
            method: 'GET'
        });

        console.log('Response data:', response.data);

        xml2js.parseString(response.data, (err, result) => {
            if (err) {
                console.error('XML Parsing Error:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to parse XML'
                });
            }
            const streamingChannels = result['StreamingChannelList'] && result['StreamingChannelList']['StreamingChannel'];
            
            if (Array.isArray(streamingChannels)) {
                const uniqueCameras = new Map();

                streamingChannels.forEach(channel => {
                    const id = channel.id[0];
                    const baseId = id.slice(0, -1);

                    if (!uniqueCameras.has(baseId)) {
                        uniqueCameras.set(baseId, {
                            id: id,
                            name: channel.channelName[0],
                            enabled: channel.enabled[0] === 'true',
                            transport: channel.Transport[0].ControlProtocolList[0].ControlProtocol[0].streamingTransport[0]
                        });
                    }
                });
                return res.json({
                    status: 'success',
                    data: Array.from(uniqueCameras.values())
                });
            } else {
                return res.json({
                    status: 'success',
                    data: []
                });
            }
        });

    } catch (error) {
        console.error('Error fetching cameras:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Route pour le streaming en basse qualité
app.get('/stream-lowest/:channelId', (req, res) => {
    const channelId = req.params.channelId;
    const rtspUrl = `rtsp://${process.env.RTSP_USERNAME}:${process.env.RTSP_PASSWORD}@${process.env.RTSP_HOST}:${process.env.RTSP_PORT}/ISAPI/Streaming/channels/${channelId}`;

    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-f', 'mp4',
        '-vcodec', 'libx264',
        '-crf', '35',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-acodec', 'aac',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-bufsize', '500k',
        '-vf', 'scale=480:270',
        '-f', 'mp4',
        '-'
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });

    req.on('close', () => {
        ffmpegProcess.kill('SIGINT');
    });
});

// Route pour le streaming de haute qualité
app.get('/stream-high/:channelId', (req, res) => {
    const channelId = req.params.channelId;
    const rtspUrl = `rtsp://${process.env.RTSP_USERNAME}:${process.env.RTSP_PASSWORD}@${process.env.RTSP_HOST}:${process.env.RTSP_PORT}/ISAPI/Streaming/channels/${channelId}`;

    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-fflags', '+genpts',
        '-i', rtspUrl,
        '-f', 'mp4',
        '-vcodec', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-acodec', 'aac',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-bufsize', '500k',
        '-f', 'mp4',
        '-'
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });

    req.on('close', () => {
        ffmpegProcess.kill('SIGINT');
    });
});

// Récupération résolution d'un caméra pour le streaming
async function getVideoResolution(rtspUrl) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(rtspUrl, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                if (videoStream) {
                    resolve({
                        width: videoStream.width,
                        height: videoStream.height
                    });
                } else {
                    reject(new Error('Aucun stream détécté'));
                }
            }
        });
    });
}

app.get('/video-history/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Date obligatoire' });
    }

    const adjustedStartTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000);
    const adjustedEndTime = new Date(new Date(endTime).getTime() + 2 * 60 * 60 * 1000);

    const formattedStartTime = formatRTSPDate(adjustedStartTime);
    const formattedEndTime = formatRTSPDate(adjustedEndTime);

    const rtspUrl = `rtsp://${process.env.RTSP_USERNAME}:${process.env.RTSP_PASSWORD}@${process.env.RTSP_HOST}:${process.env.RTSP_PORT}/ISAPI/streaming/tracks/${channelId}?starttime=${formattedStartTime}&endtime=${formattedEndTime}`;
    console.log(`Requête: ${rtspUrl}`);

    try {
        const duration = await getVideoDuration(rtspUrl);
        console.log(`Durée de la vidéo: ${duration} seconds`);
    } catch (error) {
        console.error(`Cidéo introuvable: ${error.message}`);
        return res.status(500).json({ error: 'Vidéo introuvable' });
    }

    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-fflags', '+genpts',
        '-i', rtspUrl,
        '-f', 'mp4',
        '-vcodec', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-an',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-bufsize', '500k',
        '-f', 'mp4',
        '-'
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('error', (err) => {
        console.error(`FFmpeg process error: ${err.message}`);
        res.status(500).end();
    });

    req.on('close', () => {
        ffmpegProcess.kill('SIGINT');
    });
});


app.get('/save-video/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Date obligatoire' });
    }

    const adjustedStartTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000);
    const adjustedEndTime = new Date(new Date(endTime).getTime() + 2 * 60 * 60 * 1000);

    const formattedStartTime = formatRTSPDate(adjustedStartTime);
    const formattedEndTime = formatRTSPDate(adjustedEndTime);

    const durationInSeconds = (adjustedEndTime.getTime() - adjustedStartTime.getTime()) / 1000;

    const rtspUrl = `rtsp://${process.env.RTSP_USERNAME}:${process.env.RTSP_PASSWORD}@${process.env.RTSP_HOST}:${process.env.RTSP_PORT}/ISAPI/streaming/tracks/${channelId}?starttime=${formattedStartTime}&endtime=${formattedEndTime}`;
    console.log(`Requête: ${rtspUrl}`);

    const outputDir = path.join('C:', 'Users', 'Freddy', 'Downloads', 'Vidéo de surveillance');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `video_${channelId}_${formattedStartTime}_${formattedEndTime}.mp4`);

    const ffmpegProcess = ffmpeg(rtspUrl)
        .setFfmpegPath(ffmpegPath)
        .outputOptions('-c:v', 'libx264')
        .outputOptions('-preset', 'veryfast')
        .outputOptions('-threads', '0')
        .outputOptions('-tune', 'zerolatency')
        .outputOptions('-an')
        .outputOptions('-movflags', '+faststart')
        .outputOptions('-t', durationInSeconds)
        .outputOptions('-s', '1366x768')
        .outputOptions('-g', '50')
        .outputOptions('-b:v', '2M')
        .outputOptions('-maxrate', '2.5M')
        .outputOptions('-bufsize', '5M')
        .save(outputFilePath);

    const waitForEnd = () => new Promise((resolve, reject) => {
        ffmpegProcess
            .on('end', () => {
                console.log('Vidéo enregistrée avec succès');
                resolve();
            })
            .on('stderr', (stderrLine) => {
                console.error('FFmpeg stderr:', stderrLine);
            })
            .on('error', (err) => {
                console.error('Erreur lors de la sauvegarde de la vidéo:', err.message);
                reject(err);
            });
    });

    try {
        await waitForEnd();

        // Accessibilité du fichier 
        await promisify(fs.access)(outputFilePath, fs.constants.R_OK);

        // Ouverture de l'explorateur de fichier
        const openExplorer = spawn('explorer', ['/select,', outputFilePath], { detached: true, stdio: 'ignore' });

        res.status(200).json({ message: 'Vidéo sauvegardée avec succès', path: outputFilePath });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde ou de l\'accès au fichier:', error);
        res.status(500).json({ error: 'Échec de la sauvegarde de la vidéo' });
    }
});

app.get('/video/:channelId/hls', async (req, res) => {
    const { channelId } = req.params;
    const { startTime, endTime } = req.query;

    // Générer le flux HLS à partir du RTSP
    const outputDir = path.join(__dirname, 'hls', channelId);
    const playlistPath = path.join(outputDir, 'playlist.m3u8');

    // Lancer le processus FFmpeg si les fichiers HLS n'existent pas déjà
    if (!fs.existsSync(playlistPath)) {
        const rtspUrl = `rtsp://${process.env.RTSP_USERNAME}:${process.env.RTSP_PASSWORD}@${process.env.RTSP_HOST}:${process.env.RTSP_PORT}/ISAPI/streaming/tracks/${channelId}?starttime=${startTime}&endtime=${endTime}`;
        ffmpeg(rtspUrl)
            .outputOptions('-c:v', 'libx264')
            .outputOptions('-f', 'hls')
            .outputOptions('-hls_time', '10')
            .outputOptions('-hls_playlist_type', 'event')
            .output(path.join(outputDir, 'playlist.m3u8'))
            .run();
    }

    res.sendFile(playlistPath);
});












// Récupération des vidéos par détection de véhicules
app.get('/api/videos/vehicle', async (req, res) => {
    try {
        const { cameraId, startTime, endTime } = req.query;

        if (!cameraId || !startTime || !endTime) {
            return res.status(400).json({ error: 'Les paramètres cameraId, startTime et endTime sont requis' });
        }

        const searchXml = `
        <?xml version="1.0" encoding="utf-8"?>
        <CMSearchDescription>
            <searchID>C77384AD-66A0-0001-E7C2-1151F04F90B0</searchID>
            <trackIDList>
                <trackID>${cameraId}</trackID>
            </trackIDList>
            <timeSpanList>
                <timeSpan>
                    <startTime>${startTime}</startTime>
                    <endTime>${endTime}</endTime>
                </timeSpan>
            </timeSpanList>
            <maxResults>1000000</maxResults>
            <searchResultPostion>0</searchResultPostion>
            <metadataList>
                <metadataDescriptor>//metadata.vehicleDetection</metadataDescriptor>
            </metadataList>
        </CMSearchDescription>`;

        const response = await digestAuth.request({
            url: `http://${process.env.RTSP_HOST}:80/ISAPI/ContentMgmt/search`,
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            data: searchXml
        });

        xml2js.parseString(response.data, (err, result) => {
            if (err) {
                console.error('Erreur de parsing XML:', err);
                return res.status(500).json({ error: 'Erreur de traitement des données' });
            }

            const matches = result['CMSearchResult']?.matchList?.[0]?.searchMatchItem;
            const videos = matches ? matches.map(match => ({
                sourceID: match.sourceID[0],
                trackID: match.trackID[0],
                startTime: match.timeSpan[0].startTime[0],
                endTime: match.timeSpan[0].endTime[0],
                playbackURI: match.mediaSegmentDescriptor[0].playbackURI[0],
                eventType: 'Vehicle Detection'
            })) : [];

            console.log('Résultats des vidéos:', videos); // Afficher le résultat avant de renvoyer
            res.json(videos);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des vidéos:', error);
        res.status(500).json({ error: 'Erreur de récupération des vidéos' });
    }
});




// Récupération des vidéos par détection de mouvement
app.get('/api/videos/motion', async (req, res) => {
    console.log('motion')
    try {
        const { cameraId, startTime, endTime } = req.query;

        if (!cameraId || !startTime || !endTime) {
            return res.status(400).json({ error: 'Les paramètres cameraId, startTime et endTime sont requis' });
        }
        const searchId = `C77384AD-66A0-0001-E7C2-${Math.floor(Math.random() * 1000000)}`; // Générer un identifiant unique
        const searchXml = `
            <CMSearchDescription>
                <searchID>${searchId}</searchID>
                <trackList><trackID>${cameraId}</trackID></trackList>
                <timeSpan>
                    <startTime>${startTime}</startTime>
                    <endTime>${endTime}</endTime>
                </timeSpan>
                <eventTypeList><eventType>VMD</eventType></eventTypeList>
                <maxResults>100000</maxResults>
                <searchResultPostion>0</searchResultPostion>
            </CMSearchDescription>
        `;

        const response = await digestAuth.request({
            url: `http://${process.env.RTSP_HOST}:80/ISAPI/ContentMgmt/search`,
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            data: searchXml
        });

        xml2js.parseString(response.data, (err, result) => {
            if (err) {
                console.error('Erreur de parsing XML:', err);
                return res.status(500).json({ error: 'Erreur de traitement des données' });
            }

            const matches = result['CMSearchResult'] && result['CMSearchResult']['matchList'] && result['CMSearchResult']['matchList'][0]['searchMatchItem'];
            const videos = matches ? matches.map(match => ({
                fileName: match.mediaSegmentDescriptor[0].fileName[0],
                startTime: match.mediaSegmentDescriptor[0].startTime[0],
                endTime: match.mediaSegmentDescriptor[0].endTime[0],
                eventType: 'Motion Detection'
            })) : [];

            res.json(videos);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des vidéos:', error);
        res.status(500).json({ error: 'Erreur de récupération des vidéos' });
    }
});


app.get('/video-event/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Date obligatoire' });
    }

    const adjustedStartTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000);
    const adjustedEndTime = new Date(new Date(endTime).getTime() + 2 * 60 * 60 * 1000);

    const formattedStartTime = formatRTSPDate(adjustedStartTime);
    const formattedEndTime = formatRTSPDate(adjustedEndTime);

    const rtspUrl = `rtsp://${process.env.RTSP_USERNAME}:${process.env.RTSP_PASSWORD}@${process.env.RTSP_HOST}:${process.env.RTSP_PORT}/ISAPI/streaming/tracks/${channelId}?starttime=${formattedStartTime}&endtime=${formattedEndTime}`;
    
    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-fflags', '+genpts',
        '-i', rtspUrl,
        '-vf', 'scale=1280:720', // Réduction à 720p
        '-b:v', '2500k', // Ajustez le bitrate selon vos besoins
        '-vcodec', 'libx264',
        '-preset', 'superfast',
        '-tune', 'zerolatency',
        '-an',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-f', 'mp4',
        '-'
    ];
    

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('error', (err) => {
        console.error(`FFmpeg process error: ${err.message}`);
        res.status(500).end();
    });

    req.on('close', () => {
        ffmpegProcess.kill('SIGINT');
    });
});









// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur actif sur le port ${PORT}`);
});