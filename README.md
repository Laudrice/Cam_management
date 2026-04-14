Un système simple de gestion et de visualisation de caméras IP (NVR) permettant :
- la synchronisation des caméras avec une base de données,
- l'authentification des utilisateurs,
- la lecture en direct (RTSP -> MP4 / HLS),
- la lecture d'archives (par intervalle de temps) et l'enregistrement local.

Structure du projet

- `backend/` : API Express qui gère l'authentification, la communication avec le NVR via RTSP et ISAPI, la génération de flux HLS, l'interfaçage avec ffmpeg et les routes REST.
- `frontend/` : Pour l'interface utilisateur (connexion, gestion des caméras, lecture vidéo, historique, recherche).
- `start.bat` : script Windows pour lancer frontend et backend.

Dépendances clés

- Node.js
- npm
- ffmpeg 

Variables d'environnement (backend)

Créez un fichier `.env` dans `backend/` contenant au minimum :

- `RTSP_HOST` (adresse du NVR)
- `RTSP_PORT` (port RTSP)
- `RTSP_USERNAME`
- `RTSP_PASSWORD`
- `PORT` (port du serveur backend)

Fonctionnalités et endpoints important

- POST `/api/users/login` : authentification
- GET `/cameras` : récupère la liste depuis le NVR (ISAPI)
- GET `/stream-lowest/:channelId` et `/stream-high/:channelId` : streaming en direct via ffmpeg
- GET `/video-history/:channelId` : lire une plage horaire (RTSP with start/end)
- GET `/save-video/:channelId` : sauvegarder un extrait localement
- GET `/video/:channelId/hls` : générer/servir un playlist HLS
