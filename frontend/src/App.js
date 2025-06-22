import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [apodData, setApodData] = useState(null);
  const [neoData, setNeoData] = useState(null);
  const [marsData, setMarsData] = useState(null);
  const [activeTab, setActiveTab] = useState('apod');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const photosPerPage = 12;
  const API_URL = process.env.REACT_APP_API_URL || '';


  // Load APOD data on first load
  useEffect(() => {
    fetchAPOD();
  }, []);

  const fetchAPOD = async () => {
    if (apodData) return; // Don't reload if already have data

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/apod`);
      setApodData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch astronomy picture');
    } finally {
      setLoading(false);
    }
  };

  const fetchNEO = async () => {
    if (neoData) return; // Don't reload if already have data

    try {
      setLoading(true);
      const response = await axios.get('/api/neo');
      setNeoData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch Near Earth Objects');
    } finally {
      setLoading(false);
    }
  };

  const fetchMars = async () => {
    if (marsData) return; // Don't reload if already have data

    try {
      setLoading(true);
      const response = await axios.get('/api/mars-photos');
      setMarsData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch Mars rover photos');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'neo' && !neoData) {
      fetchNEO();
    }
    if (tab === 'mars' && !marsData) {
      fetchMars();
      setCurrentPage(1); // Reset to first page
    }
  };

  const renderAPOD = () => (
    <main className="apod-container">
      <h2>{apodData.title}</h2>
      <p className="date">{apodData.date}</p>

      {apodData.media_type === 'image' ? (
        <img
          src={apodData.url}
          alt={apodData.title}
          className="apod-image"
        />
      ) : (
        <iframe
          src={apodData.url}
          title={apodData.title}
          className="apod-video"
        />
      )}

      {apodData.hdurl && (
        <a
          href={apodData.hdurl}
          target="_blank"
          rel="noopener noreferrer"
          className="hd-link"
        >
          View HD Version
        </a>
      )}

      <p className="explanation">{apodData.explanation}</p>
    </main >
  );



  const renderNEO = () => {
    if (!neoData) return <div className="loading">Loading asteroid data...</div>;

    const today = new Date().toISOString().split('T')[0];
    const todayObjects = neoData.near_earth_objects[today] || [];

    const totalObjects = neoData.element_count;
    const hazardousObjects = todayObjects.filter(obj => obj.is_potentially_hazardous_asteroid);

    return (
      <main className="neo-container">
        <h2>Near Earth Objects Today</h2>
        <p className="date">{today}</p>

        <div className="neo-stats">
          <div className="stat-card">
            <h3>{totalObjects}</h3>
            <p>Total Objects</p>
          </div>
          <div className="stat-card">
            <h3>{todayObjects.length}</h3>
            <p>Objects Today</p>
          </div>
          <div className="stat-card hazardous">
            <h3>{hazardousObjects.length}</h3>
            <p>Potentially Hazardous</p>
          </div>
        </div>

        <div className="neo-list">
          <h3>Today's Asteroids</h3>
          {todayObjects.slice(0, 10).map((neo) => (
            <div key={neo.id} className={`neo-item ${neo.is_potentially_hazardous_asteroid ? 'hazardous' : ''}`}>
              <div className="neo-info">
                <h4>{neo.name}</h4>
                <p>Diameter: {Math.round(neo.estimated_diameter.meters.estimated_diameter_min)} - {Math.round(neo.estimated_diameter.meters.estimated_diameter_max)} meters</p>
                <p>Distance: {Math.round(parseFloat(neo.close_approach_data[0].miss_distance.kilometers)).toLocaleString()} km</p>
                <p>Speed: {Math.round(parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour)).toLocaleString()} km/h</p>
                {neo.is_potentially_hazardous_asteroid && <span className="hazard-badge">⚠️ Potentially Hazardous</span>}
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  };

  const renderMars = () => {
    if (!marsData) return <div className="loading">Loading Mars photos...</div>;

    const photos = marsData.photos || [];

    if (photos.length === 0) {
      return <div className="error">No photos found for this sol (Martian day)</div>;
    }

    // Pagination logic
    const totalPages = Math.ceil(photos.length / photosPerPage);
    const startIndex = (currentPage - 1) * photosPerPage;
    const endIndex = startIndex + photosPerPage;
    const currentPhotos = photos.slice(startIndex, endIndex);

    const goToNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };

    const goToPrevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    const openModal = (photo) => {
      setSelectedPhoto(photo);
    };

    const closeModal = () => {
      setSelectedPhoto(null);
    };

    return (
      <main className="mars-container">
        <h2>🔴 Mars Rover Photos</h2>
        <p className="mars-info">
          Rover: <strong>{photos[0]?.rover?.name}</strong> •
          Earth Date: <strong>{photos[0]?.earth_date}</strong> •
          Total Photos: <strong>{photos.length}</strong>
        </p>

        {/* Pagination Info */}
        <div className="pagination-info">
          <p>Page {currentPage} of {totalPages} • Showing {currentPhotos.length} photos • Click photos to enlarge</p>
        </div>

        {/* Pagination Controls - Top */}
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <span className="page-numbers">
            {currentPage} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>

        <div className="mars-gallery">
          {currentPhotos.map((photo) => (
            <div key={photo.id} className="mars-photo-card" onClick={() => openModal(photo)}>
              <img
                src={photo.img_src}
                alt={`Mars photo by ${photo.rover.name}`}
                className="mars-photo"
              />
              <div className="mars-photo-info">
                <p><strong>{photo.camera.full_name}</strong></p>
                <p>Earth Date: {photo.earth_date}</p>
                <p>Sol {photo.sol}</p>
              </div>
              <div className="photo-overlay">
                <span>🔍 Click to enlarge</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls - Bottom */}
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <span className="page-numbers">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>

        {/* Photo Modal */}
        {selectedPhoto && (
          <div className="photo-modal" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={closeModal}>✕</button>
              <img
                src={selectedPhoto.img_src}
                alt={`Mars photo by ${selectedPhoto.rover.name}`}
                className="modal-image"
              />
              <div className="modal-info">
                <h3>{selectedPhoto.camera.full_name}</h3>
                <p><strong>Rover:</strong> {selectedPhoto.rover.name}</p>
                <p><strong>Earth Date:</strong> {selectedPhoto.earth_date}</p>
                <p><strong>Sol:</strong> {selectedPhoto.sol}</p>
                <p><strong>Camera:</strong> {selectedPhoto.camera.name}</p>
                <a
                  href={selectedPhoto.img_src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="full-res-link"
                >
                  🔗 Open Full Resolution
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  };

  if (loading && !apodData && !neoData && !marsData) return <div className="loading">Loading...</div>;
  if (error && !apodData && !neoData && !marsData) return <div className="error">{error}</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 NASA Data Explorer</h1>
        <p>Discover the cosmos with NASA's open data</p>

        <nav className="nav-tabs">
          <button
            className={activeTab === 'apod' ? 'active' : ''}
            onClick={() => handleTabChange('apod')}
          >
            🌌 Picture of the Day
          </button>
          <button
            className={activeTab === 'neo' ? 'active' : ''}
            onClick={() => handleTabChange('neo')}
          >
            🌍 Near Earth Objects
          </button>
          <button
            className={activeTab === 'mars' ? 'active' : ''}
            onClick={() => handleTabChange('mars')}
          >
            🔴 Mars Photos
          </button>
        </nav>
      </header>

      {activeTab === 'apod' && apodData && renderAPOD()}
      {activeTab === 'neo' && renderNEO()}
      {activeTab === 'mars' && renderMars()}
    </div>
  );
}

export default App;