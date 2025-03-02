import axios from 'axios';

export const getPlayerStats = async (playerTag: string) => {
  const apiKey = import.meta.env.VITE_BRAWL_API_KEY;
  
  try {
    const response = await axios.get(`/api/v1/players/%23${playerTag}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    return response.data;
  } catch (error) {
    alert("Operation failed, check console for error and ensure your API key is set up");
    console.error("Error fetching player data:", error);
    return null;
  }
};
