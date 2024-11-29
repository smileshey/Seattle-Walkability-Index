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

  const syncToggleStateWithLayer = () => {
    // Use VisibilityState to determine which layer is currently visible and update the state accordingly
    const visibleLayer = visibilityState.getCurrentVisibleLayer();
    if (visibleLayer === "walkscore_fishnet_points" || visibleLayer === "Personalized Heatmap") {
      setIsHeatmapView(true);
    } else if (visibleLayer === "walkscore_neighborhoods" || visibleLayer === "Personalized Neighborhood Walkscore") {
      setIsHeatmapView(false);
    }
  };

  const handleToggleChange = (isHeatmap: boolean) => {
    setIsHeatmapView(isHeatmap);
    console.log("Handling layer toggle. Toggle state (isHeatmapView):", isHeatmap);

    // Use VisibilityState to update the visibility based on the toggle
    if (isHeatmap) {
      if (visibilityState.isPersonalizedLayerAvailable("Personalized Heatmap")) {
        visibilityState.setVisibilityForLayerType("personalizedHeatmap");
      } else {
        visibilityState.setVisibilityForLayerType("baseHeatmap");
      }
    } else {
      if (visibilityState.isPersonalizedLayerAvailable("Personalized Neighborhood Walkscore")) {
        visibilityState.setVisibilityForLayerType("personalizedNeighborhood");
      } else {
        visibilityState.setVisibilityForLayerType("neighborhood");
      }
    }

    // Sync the state again after handling the toggle
    syncToggleStateWithLayer();
  };

  useEffect(() => {
    syncToggleStateWithLayer(); // Sync toggle state with layer visibility on load
  }, [webMap]);

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
        Heatmap View
      </Typography>
    </Box>
  );
};

export default LayerToggle;

























