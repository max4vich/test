import './Map.css';
import {useEffect, useRef, useState} from "react";
import mapboxgl, {Map as MapboxMap, Marker} from "mapbox-gl";
import {point} from '@turf/turf';
import {initializeApp} from "firebase/app";
import {getDatabase, ref, push, set, remove} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAGiodBuxDekim11R0MdI5myW32IQpDEik",
    authDomain: "test-task-14ee9.firebaseapp.com",
    projectId: "test-task-14ee9",
    storageBucket: "test-task-14ee9.appspot.com",
    messagingSenderId: "417674020316",
    appId: "1:417674020316:web:674b137374fc1e842fbb19",
    measurementId: "G-6WPSJZMYF7",
    databaseURL: "https://test-task-14ee9-default-rtdb.firebaseio.com/"
};

mapboxgl.accessToken = 'pk.eyJ1IjoibWF4NHZpY2giLCJhIjoiY2x3MjEwcTY0MGdkcDJqbXFuNGg3czdrbSJ9.LN5GbH_-_mk4HA9CElyQTg';

interface Quest {
    id: number;
    location?: { lat: number; lng: number; };
    timestamp?: string;
    next?: number | null;
}

function MapBox() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<MapboxMap | null>(null);
    const [quests, setQuests] = useState<Quest[]>([]);
    const markers = useRef<{ [key: number]: Marker }>({});
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const questsRef = ref(database, 'quests');

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
            const newId = quests.length > 0 ? quests[quests.length - 1].id + 1 : 1;
            const newQuest: Quest = {
                id: newId,
                location: {lat, lng},
                timestamp: new Date().toString(),
                next: null,
            };
            addQuest(newQuest);
            saveQuestToDatabase(newQuest);
        });
    }, []);

    useEffect(() => {
        quests.forEach(quest => {
            if (quest.location) {
                const markerElement = document.createElement('div');
                markerElement.className = 'marker';
                markerElement.innerText = String(quest.id);

                const marker = new mapboxgl.Marker(markerElement)
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
            const newId = updatedQuests.length > 0 ? updatedQuests[updatedQuests.length - 1].id + 1 : 1;

            if (updatedQuests.length > 0) {
                const lastQuestIndex = updatedQuests.length - 1;
                updatedQuests[lastQuestIndex].next = newId;
                setQuestInDatabase(updatedQuests[lastQuestIndex].id, updatedQuests[lastQuestIndex]);
            }

            return [...updatedQuests, {...newQuest, id: newId}];
        });
    }

    const removeQuest = (id: number) => {
        const questToRemove = quests.find(q => q.id === id);
        const nextQuestId = questToRemove?.next;
        const questRef = ref(database, `/quests/quest${id}`);
        remove(questRef);
        setQuests(prevQuests =>
            prevQuests.map(quest => {
                if (quest.next === id) {
                    return {...quest, next: nextQuestId};
                } else if (quest.next && quest.next > id) {
                    return {...quest, next: quest.next - 1};
                }
                return quest;
            })
        );

        markers.current[id]?.remove();
        delete markers.current[id];

        setQuests(prevQuests =>
            prevQuests.filter(quest => quest.id !== id)
        );
    }


    const removeAll = () => {
        const questsRef = ref(database, 'quests');
        remove(questsRef);

        Object.values(markers.current).forEach(marker => marker.remove());
        markers.current = {};
        setQuests([]);
    }

    const setQuestInDatabase = (id: number, quest: Quest) => {
        const questRef = ref(database, `/quests/quest${id}`);
        set(questRef, quest);
    }

    const saveQuestToDatabase = (quest: Quest) => {
        const questRef = ref(database, `/quests/quest${quest.id}`);
        push(questRef, quest);
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
                            {quest.next && (
                                <div>
                                    Next: {quests.find(q => q.id === quest.next)?.id}
                                </div>
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
