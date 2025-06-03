import { useState } from 'react';
import './App.css';
import { EAppMode } from './lib/types';
import VideoPlayer from './video/client/VideoPlayer';
import PolygonDrawer from './PolygonDrawer';

function App() {
  const [mode, setMode] = useState<EAppMode>(EAppMode.Video);

  return (
    <div style={{ width: '70vw', height: '70vh' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setMode(EAppMode.Video)}
          style={{
            backgroundColor: mode === EAppMode.Video ? '#007bff' : '#e0e0e0',
            color: mode === EAppMode.Video ? 'white' : 'black'
          }}>
          Video Mode
        </button>
        <button
          onClick={() => setMode(EAppMode.Polygon)}
          style={{
            backgroundColor: mode === EAppMode.Polygon ? '#007bff' : '#e0e0e0',
            color: mode === EAppMode.Polygon ? 'white' : 'black',
						marginLeft: '1rem'
          }}>
          Polygon Mode
        </button>
      </div>
      {mode === EAppMode.Video && <VideoPlayer />}
      {mode === EAppMode.Polygon && <PolygonDrawer />}
    </div>
  );
}

export default App;
