// EventList.jsx
import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get('/events/allEvents');
                setEvents(response.data);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            }
        };

        fetchEvents();
    }, []);

    const handleEventClick = async (eventId) => {
        try {
            const response = await axios.get(`/events/videos/${eventId}`);
            setSelectedEvent(eventId);
            setVideos(response.data);
        } catch (error) {
            console.error('Failed to fetch videos:', error);
        }
    };

    return (
        <div>
            <h1>Liste des Événements</h1>
            <ul>
                {events.map(event => (
                    <li key={event.id}>
                        <button onClick={() => handleEventClick(event.id)}>Voir vidéos</button>
                    </li>
                ))}
            </ul>
            {selectedEvent && (
                <div>
                    <h2>Vidéos pour l'événement {selectedEvent}</h2>
                    <ul>
                        {videos.map(video => (
                            <li key={video.id}>
                                <a href={video.url} target="_blank" rel="noopener noreferrer">Voir la vidéo</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EventList;
