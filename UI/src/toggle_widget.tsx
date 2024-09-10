import React, { useState, useEffect } from 'react';
import { Box, Switch, Typography } from '@mui/material';

interface LayerToggleProps {
  view: __esri.MapView;
  webMap: __esri.WebMap;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ view, webMap }) => {
  const [isFishnetLayer, setIsFishnetLayer] = useState(false);

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isFishnet = event.target.checked;
    setIsFishnetLayer(isFishnet);

    // Determine the appropriate layer titles based on the toggle state
    const baseLayerTitle = isFishnet ? "walkscore_fishnet" : "walkscore_neighborhoods";
    const personalizedLayerTitle = isFishnet ? "Personalized Walkscore" : "Personalized Neighborhood Walkscore";

    // Check for the existence of personalized layers
    const personalizedLayer = webMap.allLayers.find(layer => layer.title === personalizedLayerTitle);
    const baseLayer = webMap.allLayers.find(layer => layer.title === baseLayerTitle);

    // If personalized layers exist, use them; otherwise, use base layers
    const layerToShow = personalizedLayer || baseLayer;
    const otherLayerTitle = isFishnet ? "walkscore_neighborhoods" : "walkscore_fishnet";
    const otherPersonalizedLayerTitle = isFishnet ? "Personalized Neighborhood Walkscore" : "Personalized Walkscore";
    
    const otherLayer = webMap.allLayers.find(layer => layer.title === otherPersonalizedLayerTitle) || 
                        webMap.allLayers.find(layer => layer.title === otherLayerTitle);

    // Show the selected layer
    if (layerToShow) layerToShow.visible = true;

    // Hide the unselected layer
    if (otherLayer) otherLayer.visible = false;
  };

  useEffect(() => {
    // Initialize the visibility based on the current state
    handleToggleChange({ target: { checked: isFishnetLayer } } as React.ChangeEvent<HTMLInputElement>);
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', padding: 1, background: 'transparent', borderRadius: 3, boxShadow: 20 }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', marginRight: 1 , fontSize: '12px'}}>
        Neighborhood View
      </Typography>
      <Switch checked={isFishnetLayer} onChange={handleToggleChange} />
      <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '12px' }}>
        Fishnet View
      </Typography>
    </Box>
  );
};

export default LayerToggle;








