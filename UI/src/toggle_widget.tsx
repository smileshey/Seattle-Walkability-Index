import React, { useState, useEffect } from 'react';
import { Box, Switch, Typography, useMediaQuery } from '@mui/material';
import VisibilityState from './visibility_state'; // Import the VisibilityState class

interface LayerToggleProps {
  view: __esri.MapView;
  webMap: __esri.WebMap;
  visibilityState: VisibilityState; // Add VisibilityState as a prop
}
const BASE_LAYERS = {
  FISHNET: "walkscore_fishnet",
  NEIGHBORHOODS: "walkscore_neighborhoods",
};

const PERSONALIZED_LAYERS = {
  FISHNET: "personalized_walkscore_fishnet",
  NEIGHBORHOODS: "personalized_neighborhood_walkscore",
};

const LayerToggle: React.FC<LayerToggleProps> = ({ view, webMap, visibilityState }) => {
  const [isFishnetView, setIsFishnetView] = useState(true);

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
      // Toggle between personalized walkscore and personalized fishnet layers
      if (visibleLayer === 'Personalized Walkscore') {
        setIsFishnetView(false);
      } else if (visibleLayer === 'Personalized Walkscore') {
        setIsFishnetView(true);
      }
    } else {
      // Toggle between base neighborhood and base fishnet layers
      if (visibleLayer === 'walkscore_neighborhoods') {
        setIsFishnetView(false);
      } else if (visibleLayer === 'walkscore_fishnet') {
        setIsFishnetView(true);
      }
    }
  };

// Handle toggle change for fishnet vs. neighborhood layers
const handleToggleChange = (isFishnet: boolean) => {
  setIsFishnetView(isFishnet);

  // Update visibility based on whether recalculation has occurred
  if (visibilityState.recalculateClicked) {
    // Toggle between personalized layers
    const personalizedLayer = isFishnet
      ? PERSONALIZED_LAYERS.FISHNET
      : PERSONALIZED_LAYERS.NEIGHBORHOODS;
    visibilityState.setLayerVisible(personalizedLayer);
  } else {
    // Toggle between base layers
    const baseLayer = isFishnet ? BASE_LAYERS.FISHNET : BASE_LAYERS.NEIGHBORHOODS;
    visibilityState.setLayerVisible(baseLayer);
  }

  // Re-sync toggle state with currently visible layer
  syncToggleStateWithLayer();
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
        checked={isFishnetView}
        onChange={(event) => handleToggleChange(event.target.checked)}
      />
      <Typography sx={{ fontSize: '10px', marginLeft: 1 }}>
        {visibilityState.recalculateClicked ? 'Personalized Fishnet View' : 'Fishnet View'}
      </Typography>
    </Box>
  );
};

export default LayerToggle;




























