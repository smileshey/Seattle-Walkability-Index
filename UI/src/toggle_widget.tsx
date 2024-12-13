import React, { useState, useEffect } from 'react';
import { Box, Switch, Typography, useMediaQuery } from '@mui/material';
import VisibilityState from './visibility_state'; // Import the VisibilityState class

interface LayerToggleProps {
  view: __esri.MapView;
  webMap: __esri.WebMap;
  visibilityState: VisibilityState; // Add VisibilityState as a prop
}

const LayerToggle: React.FC<LayerToggleProps> = ({ view, webMap, visibilityState }) => {
  const [isHeatmapView, setIsHeatmapView] = useState(true);

  // Media query to check for small screens
  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width: 601px) and (orientation: portrait)');

  // Check if bottom navigation is visible, in which case don't show the toggle switch here
  const isBottomNavVisible = isMobilePortrait || isMobileLandscape || isTabletPortrait;

  // Sync toggle state with currently visible layer
  const syncToggleStateWithLayer = () => {
    const visibleLayer = visibilityState.getCurrentVisibleLayer();

    // Determine layer state based on whether recalculation has occurred
    if (visibilityState.recalculateClicked) {
      // Toggle between personalized heatmap and personalized neighborhood layers
      if (visibleLayer === 'Personalized Heatmap') {
        setIsHeatmapView(true);
      } else if (visibleLayer === 'Personalized Neighborhood Walkscore') {
        setIsHeatmapView(false);
      }
    } else {
      // Toggle between base heatmap and neighborhood layers
      if (visibleLayer === 'walkscore_fishnet_points') {
        setIsHeatmapView(true);
      } else if (visibleLayer === 'walkscore_neighborhoods') {
        setIsHeatmapView(false);
      }
    }
  };

  // Handle toggle change for heatmap vs. neighborhood layers
  const handleToggleChange = (isHeatmap: boolean) => {
    setIsHeatmapView(isHeatmap);
    // console.log('Handling layer toggle. Toggle state (isHeatmapView):', isHeatmap);
  
    // Update visibility based on whether recalculation has occurred
    if (visibilityState.recalculateClicked) {
      // Toggle between personalized heatmap and personalized neighborhood walkscore layers
      visibilityState.setHeatmapLayerVisibility(isHeatmap ? 'personalizedHeatmap' : 'personalizedNeighborhood');
    } else {
      // Toggle between base heatmap and base neighborhood walkscore layers
      visibilityState.setHeatmapLayerVisibility(isHeatmap ? 'baseHeatmap' : 'baseNeighborhood');
    }
  
    // Re-sync toggle state with currently visible layer
    syncToggleStateWithLayer();
    
    // Log after changing the layer visibility
    const currentVisibleLayer = visibilityState.getCurrentVisibleLayer();
    // console.log('After toggle, currently visible layer:', currentVisibleLayer);
  };

  // Ensure synchronization of state with visible layer when the component mounts
  useEffect(() => {
    syncToggleStateWithLayer(); // Sync toggle state with layer visibility on load
  }, [webMap]);

  // Do not show this component if the bottom navigation is visible
  if (isBottomNavVisible) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1,
        background: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 3,
        boxShadow: 20,
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      <Switch
        checked={isHeatmapView}
        onChange={(event) => handleToggleChange(event.target.checked)}
      />
      <Typography sx={{ fontSize: '10px', marginLeft: 1 }}>
        {visibilityState.recalculateClicked ? 'Personalized Heatmap View' : 'Heatmap View'}
      </Typography>
    </Box>
  );
};

export default LayerToggle;



























