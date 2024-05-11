import './Map.css';
import { useEffect, useRef, useState } from "react";
import mapboxgl, { Map as MapboxMap, Marker } from "mapbox-gl";
import { point } from '@turf/turf';

mapboxgl.accessToken = 'pk.eyJ1IjoibWF4NHZpY2giLCJhIjoiY2x3MjEwcTY0MGdkcDJqbXFuNGg3czdrbSJ9.LN5GbH_-_mk4HA9CElyQTg';

interface Quest {
    id: number;
    location?: { lat: number; lng: number; };
    timestamp?: string;
    next?: Quest | null; // Next quest can be null or another quest
}

function MapBox() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<MapboxMap | null>(null);
    const [quests, setQuests] = useState<Quest[]>([]);
    const markers = useRef<{ [key: number]: Marker }>({});
    let [nextId] = useState<number>(1)

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [24.0333, 49.8420],
            zoom: 13
        });

        map.current.on('click', (e) => {
            const {lng, lat} = e.lngLat;
            const newQuest: Quest = {
                id: nextId--,
                location: {lat, lng},
                timestamp: new Date().toString(),
                next: null,
            };
            addQuest(newQuest);
        });
    }, []);

    useEffect(() => {
        quests.forEach(quest => {
            if (quest.location) {
                const marker = new mapboxgl.Marker()
                    .setLngLat([quest.location.lng, quest.location.lat])
                    .addTo(map.current!);
                markers.current[quest.id] = marker;
            }
        });

        return () => {
            Object.values(markers.current).forEach(marker => marker.remove());
        };
    }, [quests]);

    const addQuest = (newQuest: Quest) => {
        setQuests(prevQuests => {
            const updatedQuests = [...prevQuests];
            const lastQuest = updatedQuests[updatedQuests.length-1];
            if (lastQuest) {
                lastQuest.next = {...newQuest};
            }
            return [...updatedQuests, {...newQuest, id: nextId++}];
        });
    }

    const removeQuest = (id: number) => {
        markers.current[id]?.remove();
        delete markers.current[id];
        setQuests(prevQuests =>
            prevQuests.filter(quest => quest.id !== id))
    }

    const removeAll = () => {
        Object.values(markers.current).forEach(marker=>marker.remove());
        markers.current= {};
        setQuests([]);
    }

    return (
        <>
            <div ref={mapContainer} className="map-container"/>
            <div className='list'>
                <ul>
                    <h2>Quests:</h2>
                    {quests.map((quest) => (
                        <li key={quest.id}>
                            <div>Location: <br/>
                                Lat: {quest.location?.lat} <br/>
                                Long: {quest.location?.lng}</div>
                            <div>Timestamp: {quest.timestamp}</div>
                            {quest.next && ( // Render Next information if available
                                <div>Next: {quest.next.id}</div>
                            )}
                            <button onClick={() => removeQuest(quest.id)}>Remove</button>
                        </li>
                    ))}
                    {quests.length !== 0 && (<button onClick={removeAll}>Remove all quests</button>)}
                </ul>

            </div>
        </>
    )
}

export default MapBox;
