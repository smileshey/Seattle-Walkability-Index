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
  NEIGHBORHOODS: "personalized_walkscore_neighborhoodscore",
};

const LayerToggle: React.FC<LayerToggleProps> = ({ view, webMap, visibilityState }) => {
  const [isFishnetView, setIsFishnetView] = useState(true);

  // Media query to check for different screen sizes
  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(max-height: 600px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width: 601px) and (max-width: 1000px) and (orientation: portrait)');
  const isDesktop = useMediaQuery('(min-width: 1001px)');
  
  // Treat tablet portrait like mobile portrait
  const isBottomNavVisible = isMobilePortrait || isMobileLandscape || isTabletPortrait;

  const syncToggleStateWithLayer = () => {
    const visibleLayer = visibilityState.getCurrentVisibleLayer();

    if (!visibleLayer) {
      console.warn("No visible layer found. Defaulting to fishnet view.");
      setIsFishnetView(true);
      return;
    }

    if (visibilityState.recalculateClicked) {
      setIsFishnetView(visibleLayer === PERSONALIZED_LAYERS.FISHNET);
    } else {
      setIsFishnetView(visibleLayer === BASE_LAYERS.FISHNET);
    }
  };

  const handleToggleChange = (isFishnet: boolean) => {
    setIsFishnetView(isFishnet);

    // Determine the correct layer to show
    const recalculationState = visibilityState.recalculateClicked; // Always check current state
    const layerToShow = recalculationState
      ? isFishnet
        ? PERSONALIZED_LAYERS.FISHNET
        : PERSONALIZED_LAYERS.NEIGHBORHOODS
      : isFishnet
      ? BASE_LAYERS.FISHNET
      : BASE_LAYERS.NEIGHBORHOODS;

    const excludedLayers = [
      "World Hillshade",
      "World Terrain Base",
      "World Terrain Reference",
      "citylimits",
    ]; // Layers that should not be toggled.

    // Update visibility while preserving excluded layers
    const targetLayer = webMap.allLayers.find((layer) => layer.title === layerToShow);

    if (targetLayer) {
      webMap.allLayers.forEach((layer) => {
        if (excludedLayers.includes(layer.title)) return;
        layer.visible = layer.title === layerToShow;
      });
      console.log(`Layer to show: ${layerToShow}`);
    } else {
      console.warn(`Layer not found: ${layerToShow}. Falling back to default visibility.`);
      visibilityState.initializeDefaultVisibility(); // Use default visibility logic
      setIsFishnetView(true); // Reset toggle state
    }
  };

  // Ensure synchronization of state with visible layer when the component mounts
  useEffect(() => {
    syncToggleStateWithLayer(); // Sync toggle state whenever recalculation state or map changes
  }, [visibilityState.recalculateClicked, webMap]);

  // Do not show this component if the bottom navigation is visible (mobile or tablet portrait)
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
        {visibilityState.recalculateClicked ? 'Personalized Fishnet' : 'Base Fishnet'}
      </Typography>
    </Box>
  );
};

export default LayerToggle;






























