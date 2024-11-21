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

    if (isHeatmap) {
      // Show the personalized heatmap if it exists, otherwise show the base heatmap
      if (personalizedHeatmapLayer) {
        personalizedHeatmapLayer.visible = true;
        console.log("Showing Personalized Heatmap Layer:", personalizedHeatmapLayer.title);
      } else if (baseHeatmapLayer) {
        baseHeatmapLayer.visible = true;
        console.log("Showing Base Heatmap Layer:", baseHeatmapLayer.title);
      }

      // Hide both neighborhood layers
      if (baseNeighborhoodLayer) {
        baseNeighborhoodLayer.visible = false;
        console.log("Hiding Base Neighborhood Layer:", baseNeighborhoodLayer.title);
      }
      if (personalizedNeighborhoodLayer) {
        personalizedNeighborhoodLayer.visible = false;
        console.log("Hiding Personalized Neighborhood Layer:", personalizedNeighborhoodLayer.title);
      }
    } else {
      // Show the personalized neighborhood layer if it exists, otherwise show the base neighborhood layer
      if (personalizedNeighborhoodLayer) {
        personalizedNeighborhoodLayer.visible = true;
        console.log("Showing Personalized Neighborhood Layer:", personalizedNeighborhoodLayer.title);
      } else if (baseNeighborhoodLayer) {
        baseNeighborhoodLayer.visible = true;
        console.log("Showing Base Neighborhood Layer:", baseNeighborhoodLayer.title);
      }

      // Hide both heatmap layers
      if (baseHeatmapLayer) {
        baseHeatmapLayer.visible = false;
        console.log("Hiding Base Heatmap Layer:", baseHeatmapLayer.title);
      }
      if (personalizedHeatmapLayer) {
        personalizedHeatmapLayer.visible = false;
        console.log("Hiding Personalized Heatmap Layer:", personalizedHeatmapLayer.title);
      }
    }
    
    console.log(`Visibility status after toggling: 
      Base Heatmap Layer (${baseHeatmapLayerTitle}): ${baseHeatmapLayer ? baseHeatmapLayer.visible : "not found"},
      Personalized Heatmap Layer (${personalizedHeatmapLayerTitle}): ${personalizedHeatmapLayer ? personalizedHeatmapLayer.visible : "not found"},
      Base Neighborhood Layer (${baseNeighborhoodLayerTitle}): ${baseNeighborhoodLayer ? baseNeighborhoodLayer.visible : "not found"},
      Personalized Neighborhood Layer (${personalizedNeighborhoodLayerTitle}): ${personalizedNeighborhoodLayer ? personalizedNeighborhoodLayer.visible : "not found"}
    `);
  };

  useEffect(() => {
    handleToggleChange(true); // Set to show personalized heatmap by default after recalculation
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



















