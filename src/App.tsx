import { useState } from 'react';
import { getPlayerStats } from './brawlstarsApi';
import D3Chart from './d3plot';
import './App.css';


function App() {
  const [stats, setStats] = useState<any>(null);
  const [playerTag, setPlayerTag] = useState<string>("");

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerTag(e.target.value.toUpperCase());
  };

  const handleGetStats = async () => {
    if (playerTag) {
      const playerStats = await getPlayerStats(playerTag);
      setStats(playerStats);
    } else {
      alert('Please enter a player tag');
    }
  };

  return (
    <div className='parent-container'>
      <h1>Get Your Brawlstars Stats!</h1>
      <div className='tag-container'>
        <p>Enter player tag #</p>
        <input
          className='tag-input'
          type='text'
          value={playerTag}
          onChange={handleTagChange}
        />
        <button className='get-stats-button' onClick={handleGetStats}>Get stats</button>
      </div>
      <div className='data-container'>
        {stats ? (
          <div>
            <h1>{stats.name}'s Stats</h1>
            <p>Trophies: {stats.trophies}</p>
            <D3Chart stats={stats}/>
          </div>
        ) : (
          <div>No player tag or loading...</div>
        )}
      </div>
    </div>
  );
};

export default App
