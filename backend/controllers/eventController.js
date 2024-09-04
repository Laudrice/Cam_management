const axiosDigestAuth = require('@mhoc/axios-digest-auth').default;
const xml2js = require('xml2js');
const digestAuth = new axiosDigestAuth({
    username: 'admin', // Remplace par tes identifiants
    password: 'CamAdmin2023'
});

// Fonction pour obtenir la liste des événements
const getEventList = async (req, res) => {
    try {
        const response = await digestAuth.request({
            url: 'http://10.4.105.108:80/ISAPI/Event/triggers',
            method: 'GET'
        });

        xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
            if (err) {
                return res.status(500).send({ error: 'Failed to parse XML' });
            }

            const events = result.EventTriggerList.EventTrigger.map(event => ({
                id: event.id || event.ID || "Inconnu",
                type: event.eventType || "Inconnu",
                port: event.inputIOPortID || "Inconnu",
            }));

            res.status(200).send(events);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to fetch events' });
    }
};

// Fonction pour obtenir les vidéos d'un événement
const getEventVideos = async (req, res) => {
    const { eventId } = req.params;
    try {
        const response = await digestAuth.request({
            url: `http://10.4.105.108:80/ISAPI/ContentMgmt/search?eventId=${eventId}`, // URL pour récupérer les vidéos
            method: 'GET'
        });

        xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
            if (err) {
                return res.status(500).send({ error: 'Failed to parse XML' });
            }

            const videos = result.ContentList.Content.map(video => ({
                id: video.id || "Inconnu",
                name: video.name || "Inconnu",
                date: video.timeSpan.startTime || "Inconnu",
                type: video.type || "Inconnu",
                previewUrl: video.url.previewUrl || "Inconnu", // URL pour la prévisualisation
                downloadUrl: video.url.downloadUrl || "Inconnu" // URL pour le téléchargement
            }));

            res.status(200).send(videos);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to fetch videos' });
    }
};

module.exports = {
    getEventList,
    getEventVideos
};
