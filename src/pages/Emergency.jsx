// src/pages/Emergency.jsx
import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Phone, AlertTriangle, ChevronLeft, Bot, Map } from 'lucide-react'; // Added Map icon
import { BeatLoader } from 'react-spinners';
import { fetchAuthSession } from 'aws-amplify/auth';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// This assumes your Leaflet images are accessible.
// If markers don't appear, you might need to adjust paths or how your bundler handles these assets.
// Example: import markerIcon from 'leaflet/dist/images/marker-icon.png';
// L.Icon.Default.mergeOptions({ iconUrl: markerIcon, ... });

// Fix for default Leaflet marker icon issue with Webpack/React (ensure paths are correct for your setup)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png', // Use unpkg CDN for reliability
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', // Use unpkg CDN for reliability
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', // Use unpkg CDN for reliability
});

const API_FIND_VETS_URL = "http://localhost:5000/api/find_vets"; // Your Flask backend endpoint

// Small component to recenter the map when vets are found
function ChangeMapView({ coords }) {
    const map = useMap();
    useEffect(() => {
        if(coords && coords.length === 2 && map) { // Ensure coords are valid and map exists
            map.setView(coords, 12); // Recenter map view to user's coordinates with zoom level 12
        }
    }, [coords, map]);
    return null;
}

function EmergencyPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        initialUrgentMessage = "An urgent pet health situation was detected. Please seek veterinary care immediately.",
        aiSagemakerAnalysis,
    } = location.state || {};

    const [userCoords, setUserCoords] = useState(null);
    const [nearbyVets, setNearbyVets] = useState([]);
    const [loadingVets, setLoadingVets] = useState(true);
    const [locationError, setLocationError] = useState('');
    const mapRef = useRef(null); // Ref for the map container to potentially re-render map

    useEffect(() => {
        document.title = "Pet Emergency | PetHealth AI";
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserCoords({ latitude, longitude });
                    fetchNearbyVets(latitude, longitude);
                },
                (error) => {
                    console.error("Error getting geolocation:", error);
                    let errMsg = "Could not get your location. Please enable location services and refresh the page. You may need to search for vets manually.";
                    if (error.code === error.PERMISSION_DENIED) {
                        errMsg = "Location access denied. Please allow location services for this site to find nearby vets.";
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errMsg = "Location information is unavailable.";
                    } else if (error.code === error.TIMEOUT) {
                        errMsg = "Getting your location timed out.";
                    }
                    setLocationError(errMsg);
                    setLoadingVets(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000, // 10 seconds
                    maximumAge: 0 // No cached location
                }
            );
        } else {
            setLocationError("Geolocation is not supported by this browser. Please use a modern browser.");
            setLoadingVets(false);
        }
    }, []);

    // Function to handle fetching vets (needs JWT token from frontend if backend is protected)
    const fetchNearbyVets = async (latitude, longitude) => {
        setLoadingVets(true);
        setLocationError('');
        try {
            // Get the current authenticated user's session
            const { tokens } = await fetchAuthSession();
            const idToken = tokens.idToken.toString();

            const response = await fetch(API_FIND_VETS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // Include JWT token
                },
                body: JSON.stringify({ latitude, longitude }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({error: `Server error: ${response.status}`}));
                throw new Error(errData.error || `Failed to fetch vets: ${response.status}`);
            }
            const data = await response.json();
            setNearbyVets(data.vets || []);
            if (!data.vets || data.vets.length === 0) {
                setLocationError("No veterinary clinics were automatically found near your current location. Please try a manual search.");
            }
        } catch (error) {
            console.error("Error fetching nearby vets:", error);
            let displayError = error.message;
            if (error.name === 'NotSignedInException' || error.message.includes('not authenticated')) {
                 displayError = "You are not logged in or your session has expired. Please log in again.";
                 // Optionally redirect to login here if you want to be extra strict
                 // navigate('/auth', { replace: true });
            }
            setLocationError(displayError);
            setNearbyVets([]);
        } finally {
            setLoadingVets(false);
        }
    };

    const formatMessageForDisplay = (text) => {
        if (typeof text !== 'string') return "";
        return text.split('\n').map((item, key) => (
            <React.Fragment key={key}>{item}{key < text.split('\n').length - 1 && <br />}</React.Fragment>
        ));
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-gray-950 via-red-950 to-black text-white py-8 px-4 sm:px-6 lg:px-8 selection:bg-teal-500 selection:text-white">
            <div className="max-w-6xl mx-auto w-full relative z-10">
                <button onClick={() => navigate('/chat')} className="mb-6 inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-full text-blue-300 bg-blue-800/50 hover:bg-blue-700/50 transition-colors duration-300 transform hover:scale-[1.02] shadow-lg">
                    <ChevronLeft size={20} className="mr-2" /> Back to Chat
                </button>

                <div className="bg-red-900/40 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-red-800 animate-fade-in-down">
                    <div className="flex flex-col sm:flex-row items-center text-red-300 mb-5 pb-5 border-b border-red-700">
                        <AlertTriangle size={48} className="mr-0 sm:mr-4 mb-2 sm:mb-0 flex-shrink-0 text-red-400 animate-pulse-urgent" />
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold">URGENT PET ALERT!</h1>
                            <p className="text-base text-red-200 opacity-90 mt-1">Immediate veterinary attention is highly recommended.</p>
                        </div>
                    </div>

                    {initialUrgentMessage && (
                        <div className="mb-6 p-4 bg-red-800/60 border-l-4 border-red-400 text-red-100 rounded-md shadow-inner animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <p className="font-semibold text-lg mb-1 flex items-center"><Bot size={20} className="mr-2 text-red-200"/> AI Assessment Summary:</p>
                            <div className="whitespace-pre-wrap text-sm opacity-90">{formatMessageForDisplay(initialUrgentMessage)}</div>
                        </div>
                    )}

                    {aiSagemakerAnalysis?.summary && aiSagemakerAnalysis.summary.indexOf("No image") === -1 && (
                        <div className="mb-6 p-4 bg-yellow-900/60 border-l-4 border-yellow-400 text-yellow-100 rounded-md shadow-inner animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-center font-semibold text-lg mb-1">
                                <Map size={22} className="mr-2 text-yellow-200"/> AI Image Analysis Insights:
                            </div>
                            <p className="text-sm whitespace-pre-wrap opacity-90">{aiSagemakerAnalysis.summary}</p>
                            <p className="text-xs mt-2 opacity-80">Note: This AI analysis is preliminary and not a substitute for a veterinarian's diagnosis.</p>
                        </div>
                    )}

                    <div className="mb-8 p-6 bg-gray-800/60 rounded-xl shadow-xl border border-gray-700 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Nearby Emergency Vets</h2>

                        {loadingVets && (
                            <div className="flex flex-col items-center justify-center py-10">
                                <BeatLoader color="#F87171" size={15} /> {/* Adjusted loader color for dark theme */}
                                <p className="text-gray-300 mt-3">Searching for nearby vets based on your location...</p>
                            </div>
                        )}
                        {locationError && <p className="p-3 bg-red-800/60 text-red-200 rounded-md text-sm mb-3 border border-red-700 animate-fade-in">{locationError}</p>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar-light"> {/* Custom scrollbar for dark theme */}
                                {!loadingVets && nearbyVets.map((vet) => (
                                    <div key={vet.id || vet.name} className="p-4 border border-gray-700 rounded-lg bg-gray-900/50 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.01]">
                                        <h3 className="font-semibold text-lg text-blue-400">{vet.name}</h3>
                                        {vet.address && <p className="text-sm text-gray-300 mt-1 flex items-start"><MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0 text-gray-400" /> <span>{vet.address}</span></p>}
                                        {vet.phone && (
                                            <p className="text-sm text-gray-300 mt-1 flex items-center">
                                                <Phone size={16} className="mr-2 flex-shrink-0 text-gray-400" />
                                                <a href={`tel:${vet.phone}`} className="text-blue-400 hover:underline">{vet.phone}</a>
                                            </p>
                                        )}
                                        {vet.rating && <p className="text-sm text-gray-400 mt-1">Rating: {vet.rating}</p>}
                                        {vet.open_now !== undefined && (
                                            <p className={`text-sm mt-1 ${vet.open_now ? 'text-green-400' : 'text-red-400'}`}>
                                                {vet.open_now ? 'Open Now' : 'Closed'}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="h-72 md:h-96 bg-gray-900 rounded-lg shadow-xl overflow-hidden flex items-center justify-center border border-gray-700">
                                {userCoords ? (
                                    <MapContainer
                                        center={[userCoords.latitude, userCoords.longitude]}
                                        zoom={12}
                                        style={{ height: "100%", width: "100%" }}
                                        whenCreated={mapInstance => { mapRef.current = mapInstance; }} // Get map instance
                                    >
                                        <ChangeMapView coords={[userCoords.latitude, userCoords.longitude]} />
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme tiles
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                        />
                                        <Marker position={[userCoords.latitude, userCoords.longitude]}><Popup>Your Location</Popup></Marker>
                                        {nearbyVets.map(vet => vet.latitude && vet.longitude && (
                                            <Marker key={vet.id || vet.name} position={[vet.latitude, vet.longitude]}>
                                                <Popup><b>{vet.name}</b><br />{vet.address}</Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                ) : (
                                    <div className="text-center text-gray-500 p-4">
                                        {loadingVets ? <BeatLoader color="#F87171" size={10} /> : 'Waiting for location to display map...'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Custom Styles */}
            <style>{`
                .min-h-\\[calc\\(100vh-64px\\)\\] {
                    min-height: calc(100vh - 64px); /* Ensures full height minus navbar */
                }
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.7s ease-out forwards; opacity: 0; }

                @keyframes pulse-urgent {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.08); opacity: 0.8; }
                }
                .animate-pulse-urgent { animation: pulse-urgent 1.5s infinite ease-in-out; }

                /* Custom scrollbar for dark theme */
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.4);
                }
            `}</style>
        </div>
    );
}

export default EmergencyPage;