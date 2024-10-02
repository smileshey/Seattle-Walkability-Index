import React, { useState, useEffect } from 'react';
import { Box, Switch, Typography, useMediaQuery } from '@mui/material';
import { neighborhoodPopupTemplate, fishnetPopupTemplate } from './popup_template';
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

interface LayerToggleProps {
  view: __esri.MapView;
  webMap: __esri.WebMap;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ view, webMap }) => {
  const [isFishnetLayer, setIsFishnetLayer] = useState(false);

  // Media query to check for small screens
  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width: 601px) and (orientation: portrait)');

  // Check if bottom navigation is visible, in which case don't show the toggle switch here
  const isBottomNavVisible = isMobilePortrait || isMobileLandscape || isTabletPortrait;

  const handleToggleChange = (isFishnet: boolean) => {
    setIsFishnetLayer(isFishnet);

    const baseLayerTitle = isFishnet ? "walkscore_fishnet" : "walkscore_neighborhoods";
    const personalizedLayerTitle = isFishnet ? "Personalized Walkscore" : "Personalized Neighborhood Walkscore";

    // Cast to FeatureLayer to access popupTemplate
    const personalizedLayer = webMap.allLayers.find(layer => layer.title === personalizedLayerTitle) as FeatureLayer;
    const baseLayer = webMap.allLayers.find(layer => layer.title === baseLayerTitle) as FeatureLayer;

    let layerToShow = personalizedLayer || baseLayer;
    const otherLayerTitle = isFishnet ? "walkscore_neighborhoods" : "walkscore_fishnet";
    const otherPersonalizedLayerTitle = isFishnet ? "Personalized Neighborhood Walkscore" : "Personalized Walkscore";

    const otherLayer = webMap.allLayers.find(layer => layer.title === otherPersonalizedLayerTitle) as FeatureLayer || 
                      webMap.allLayers.find(layer => layer.title === otherLayerTitle) as FeatureLayer;

    // Ensure layerToShow exists before assigning popupTemplate
    if (!layerToShow) {
      console.log("Layer to show is undefined, defaulting to neighborhood layer");
      layerToShow = baseLayer;
    }

    if (layerToShow) {
      layerToShow.when(() => {
        // Assign the appropriate popup template
        layerToShow.popupTemplate = isFishnet ? fishnetPopupTemplate : neighborhoodPopupTemplate;
        layerToShow.visible = true;
      });
    }

    // Hide the other layer if defined
    if (otherLayer) {
      otherLayer.visible = false;
    }
  };

  useEffect(() => {
    handleToggleChange(isFishnetLayer);
  }, []);

  if (isBottomNavVisible) {
    // Do not render the toggle switch when the bottom navigation is visible
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
        checked={isFishnetLayer}
        onChange={(event) => handleToggleChange(event.target.checked)}
      />
      <Typography sx={{ fontSize: '10px', marginLeft: 1 }}>
        Fishnet View
      </Typography>
    </Box>
  );
};

export default LayerToggle;

















