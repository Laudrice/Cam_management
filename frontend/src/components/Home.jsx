import React, { useEffect } from 'react';
import image from './image.png'; // Importer l'image depuis le même dossier

const Home = () => {
    useEffect(() => {
        // Désactiver le scroll en ajoutant un style
        document.body.style.overflow = 'hidden';

        // Réactiver le scroll lorsqu'on quitte le composant
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);
    return (
        <div
            style={{
                backgroundImage: `url(${image})`, // Utiliser l'image importée
                backgroundSize: 'cover', // L'image couvre tout le conteneur
                backgroundPosition: 'center', // Centrer l'image
                backgroundRepeat: 'no-repeat', // Empêcher la répétition
                height: '100vh', // Hauteur de la vue complète
                width: '100%', // Largeur de la page
            }}
        >
            {/* Contenu de la page */}
            {/* <div
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Overlay sombre
                    color: 'white', // Texte blanc pour contraste
                    padding: '20px',
                    textAlign: 'center',
                }}
            >
                <h1>Bienvenue sur la page d'accueil</h1>
                <p>Profitez de notre interface moderne et intuitive.</p>
            </div> */}
        </div>
    );
};

export default Home;
