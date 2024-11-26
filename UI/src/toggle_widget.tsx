import React, { useState, useEffect } from 'react';
import { Box, Switch, Typography, useMediaQuery } from '@mui/material';
import { neighborhoodPopupTemplate, fishnetPopupTemplate } from './popup_template';
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

interface LayerToggleProps {
  view: __esri.MapView;
  webMap: __esri.WebMap;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ view, webMap }) => {
  const [isHeatmapView, setIsHeatmapView] = useState(true);

  // Media query to check for small screens
  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width: 601px) and (orientation: portrait)');

  // Check if bottom navigation is visible, in which case don't show the toggle switch here
  const isBottomNavVisible = isMobilePortrait || isMobileLandscape || isTabletPortrait;

  const syncToggleStateWithLayer = () => {
    const baseHeatmapLayerTitle = "walkscore_fishnet_points";
    const personalizedHeatmapLayerTitle = "Personalized Heatmap";
    const baseNeighborhoodLayerTitle = "walkscore_neighborhoods";
    const personalizedNeighborhoodLayerTitle = "Personalized Neighborhood Walkscore";

    const baseHeatmapLayer = webMap.allLayers.find(layer => layer.title === baseHeatmapLayerTitle) as FeatureLayer;
    const personalizedHeatmapLayer = webMap.allLayers.find(layer => layer.title === personalizedHeatmapLayerTitle) as FeatureLayer;
    const baseNeighborhoodLayer = webMap.allLayers.find(layer => layer.title === baseNeighborhoodLayerTitle) as FeatureLayer;
    const personalizedNeighborhoodLayer = webMap.allLayers.find(layer => layer.title === personalizedNeighborhoodLayerTitle) as FeatureLayer;

    // Determine if the heatmap is currently visible
    if ((baseHeatmapLayer && baseHeatmapLayer.visible) || (personalizedHeatmapLayer && personalizedHeatmapLayer.visible)) {
      setIsHeatmapView(true);
    } else if ((baseNeighborhoodLayer && baseNeighborhoodLayer.visible) || (personalizedNeighborhoodLayer && personalizedNeighborhoodLayer.visible)) {
      setIsHeatmapView(false);
    }
  };

  const handleToggleChange = (isHeatmap: boolean) => {
    setIsHeatmapView(isHeatmap);
    console.log("Handling layer toggle. Toggle state (isHeatmapView):", isHeatmap);
  
    // Define layer titles
    const baseHeatmapLayerTitle = "walkscore_fishnet_points";
    const personalizedHeatmapLayerTitle = "Personalized Heatmap";
    const baseNeighborhoodLayerTitle = "walkscore_neighborhoods";
    const personalizedNeighborhoodLayerTitle = "Personalized Neighborhood Walkscore";
  
    // Get layers by title
    const baseHeatmapLayer = webMap.allLayers.find(layer => layer.title === baseHeatmapLayerTitle) as FeatureLayer;
    const personalizedHeatmapLayer = webMap.allLayers.find(layer => layer.title === personalizedHeatmapLayerTitle) as FeatureLayer;
    const baseNeighborhoodLayer = webMap.allLayers.find(layer => layer.title === baseNeighborhoodLayerTitle) as FeatureLayer;
    const personalizedNeighborhoodLayer = webMap.allLayers.find(layer => layer.title === personalizedNeighborhoodLayerTitle) as FeatureLayer;
  
    // Set visibility based on the toggle state
    if (isHeatmap) {
      if (personalizedHeatmapLayer && !personalizedHeatmapLayer.visible) {
        personalizedHeatmapLayer.visible = true;
        console.log(`Setting visibility to true for: ${personalizedHeatmapLayer.title}`);
      } else if (baseHeatmapLayer && !baseHeatmapLayer.visible) {
        baseHeatmapLayer.visible = true;
        console.log(`Setting visibility to true for: ${baseHeatmapLayer.title}`);
      }
  
      // Hide both neighborhood layers if they are visible
      if (baseNeighborhoodLayer && baseNeighborhoodLayer.visible) {
        baseNeighborhoodLayer.visible = false;
        console.log(`Setting visibility to false for: ${baseNeighborhoodLayer.title}`);
      }
      if (personalizedNeighborhoodLayer && personalizedNeighborhoodLayer.visible) {
        personalizedNeighborhoodLayer.visible = false;
        console.log(`Setting visibility to false for: ${personalizedNeighborhoodLayer.title}`);
      }
    } else {
      if (personalizedNeighborhoodLayer && !personalizedNeighborhoodLayer.visible) {
        personalizedNeighborhoodLayer.visible = true;
        console.log(`Setting visibility to true for: ${personalizedNeighborhoodLayer.title}`);
      } else if (baseNeighborhoodLayer && !baseNeighborhoodLayer.visible) {
        baseNeighborhoodLayer.visible = true;
        console.log(`Setting visibility to true for: ${baseNeighborhoodLayer.title}`);
      }
  
      // Hide both heatmap layers if they are visible
      if (baseHeatmapLayer && baseHeatmapLayer.visible) {
        baseHeatmapLayer.visible = false;
        console.log(`Setting visibility to false for: ${baseHeatmapLayer.title}`);
      }
      if (personalizedHeatmapLayer && personalizedHeatmapLayer.visible) {
        personalizedHeatmapLayer.visible = false;
        console.log(`Setting visibility to false for: ${personalizedHeatmapLayer.title}`);
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






















