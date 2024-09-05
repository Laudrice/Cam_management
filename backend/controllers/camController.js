require('dotenv').config();  
const axiosDigestAuth = require('@mhoc/axios-digest-auth').default;
const xml2js = require('xml2js');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');
const db = require('../models/index');

// Création d'une instance pour l'authentification Digest
const digestAuth = new axiosDigestAuth({
    username: process.env.RTSP_USERNAME,
    password: process.env.RTSP_PASSWORD
});

// Modèle Cam
const Cam = db.cams;

// Synchronisation des caméras du NVR avec la base de données
const syncNVRWithDatabase = async () => {
    try {
        const response = await digestAuth.request({
            url: `http://${process.env.RTSP_HOST}:80/ISAPI/Streaming/channels`,
            method: 'GET'
        });

        xml2js.parseString(response.data, async (err, result) => {
            if (err) {
                console.error('parse XML erreur:', err);
                return;
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

                const t = await db.sequelize.transaction();
                try {
                    // Mettre toutes les caméras sur inactif
                    await db.cams.update({ enabled: 'false' }, { where: {}, transaction: t });

                    const existingCams = await db.cams.findAll({ transaction: t });
                    const existingCamIds = new Set(existingCams.map(cam => cam.id));

                    for (let [baseId, camera] of uniqueCameras) {
                        if (existingCamIds.has(camera.id)) {
                            await db.cams.update({
                                name: camera.name,
                                enabled: camera.enabled.toString(),
                                transport: camera.transport,
                            }, {
                                where: { id: camera.id },
                                transaction: t
                            });
                        } else {
                            await db.cams.create({
                                id: camera.id,
                                name: camera.name,
                                enabled: camera.enabled.toString(),
                                transport: camera.transport,
                                nom_: null
                            }, { transaction: t });
                        }
                    }

                    await t.commit();
                    console.log('Synchronisation à la base réussi');
                } catch (dbError) {
                    await t.rollback();
                    console.error('Erreur de synchronisation:', dbError);
                }
            } else {
                console.log('Aucun stream détécté');
            }
        });

    } catch (error) {
        console.error('Erreur de la récupération depuis le NVR:', error);
    }
};


// Récupérer toutes les caméras
const getAllCams = async (req, res) => {
    try {
        syncNVRWithDatabase
        let cams = await Cam.findAll({});
        res.status(200).send(cams);
    } catch (error) {
        res.status(500).send({ error: 'Erreur lors de la récupération des caméras' });
    }
};

// Récupérer une caméra par ID
const getOneCam = async (req, res) => {
    try {
        let id = req.params.id;
        let cam = await Cam.findOne({ where: { id: id } });
        if (cam) {
            res.status(200).send(cam);
        } else {
            res.status(404).send({ error: 'Caméra non trouvée' });
        }
    } catch (error) {
        res.status(500).send({ error: 'Erreur lors de la récupération de la caméra' });
    }
};

// Mettre à jour une caméra
const updateCam = async (req, res) => {
    try {
        let id = req.params.id;
        const [updated] = await Cam.update(req.body, { where: { id: id } });
        if (updated) {
            res.status(200).send('Caméra mise à jour');
        } else {
            res.status(404).send({ error: 'Caméra non trouvée' });
        }
    } catch (error) {
        res.status(500).send({ error: 'Erreur lors de la mise à jour de la caméra' });
    }
};

// Supprimer une caméra
const deleteCam = async (req, res) => {
    try {
        let id = req.params.id;
        const deleted = await Cam.destroy({ where: { id: id } });
        if (deleted) {
            res.status(200).send('Caméra supprimée');
            syncNVRWithDatabase();
        } else {
            res.status(404).send({ error: 'Caméra non trouvée' });
        }
    } catch (error) {
        res.status(500).send({ error: 'Erreur lors de la suppression de la caméra' });
    }
};

// Streaming de la vidéo (low quality)
const streamLowQuality = (req, res) => {
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
};

// Streaming de la vidéo (high quality)
const streamHighQuality = (req, res) => {
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
};

// Conversion de la date pour qu'elle soit du format accépté par le NVR
function formatRTSPDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

// Récupération de la résolution d'un vidéo d'un caméra
async function getVideoResolution(rtspUrl) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(rtspUrl, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                resolve({
                    width: videoStream.width,
                    height: videoStream.height
                });
            }
        });
    });
}


// Récupération de la durrée de vidéo entre deux dates
function getVideoDuration(rtspUrl) {
    return new Promise((resolve, reject) => {
        const ffprobeProcess = spawn('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            '-rtsp_transport', 'tcp',
            rtspUrl
        ]);

        let output = '';
        ffprobeProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobeProcess.on('close', (code) => {
            if (code === 0) {
                const duration = parseFloat(output.trim());
                resolve(duration);
            } else {
                reject(new Error(`ffprobe process exited with code ${code}`));
            }
        });

        ffprobeProcess.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = {
    getAllCams,
    getOneCam,
    updateCam,
    deleteCam,
    syncNVRWithDatabase,
    streamLowQuality,
    streamHighQuality,
    formatRTSPDate,
    getVideoResolution,
    getVideoDuration
};
