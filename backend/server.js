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
        .outputOptions('-preset', 'ultrafast')
        .outputOptions('-threads', '4')
        .outputOptions('-tune', 'zerolatency')
        .outputOptions('-an')
        .outputOptions('-movflags', '+faststart')
        .outputOptions('-t', durationInSeconds)
        .outputOptions('-s', '1366x768')
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

        // Vérifier que le fichier existe et est accessible
        await promisify(fs.access)(outputFilePath, fs.constants.R_OK);

        // Ouvrir le fichier vidéo avec VLC à une vitesse de lecture de 32x
        const vlcPath = 'C:/Program Files/VideoLAN/VLC/vlc.exe';
        const vlcArgs = [
            outputFilePath,
            '--rate=32'
        ];
        spawn(vlcPath, vlcArgs, { detached: true, stdio: 'ignore' });

        res.status(200).json({ message: 'Vidéo sauvegardée avec succès', path: outputFilePath });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde ou de l\'accès au fichier:', error);
        res.status(500).json({ error: 'Échec de la sauvegarde de la vidéo' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur actif sur le port ${PORT}`);
});

