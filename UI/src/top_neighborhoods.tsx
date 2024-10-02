import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import Point from "@arcgis/core/geometry/Point";
import { Neighborhood } from './neighborhood_utils';
import { useMediaQuery } from '@mui/material';

export interface TopNeighborhoodsProps {
  neighborhoods: Neighborhood[];
  onNeighborhoodsLoaded?: (neighborhoods: Neighborhood[]) => void;
  view: __esri.MapView;
  webMap: __esri.WebMap;
  recalculateTriggered?: boolean;
  showTextList?: boolean;
}

const TopNeighborhoods: React.FC<TopNeighborhoodsProps> = ({ neighborhoods, view, webMap, onNeighborhoodsLoaded, showTextList = true }) => {
  const isMobileLandscape = useMediaQuery('(min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');

  useEffect(() => {
    console.log("TopNeighborhoods component mounted");
    if (neighborhoods && neighborhoods.length > 0 && onNeighborhoodsLoaded) {
      onNeighborhoodsLoaded(neighborhoods);
      renderNeighborhoodsOnMap(neighborhoods);
    }
  }, [neighborhoods, onNeighborhoodsLoaded]);

  const renderNeighborhoodsOnMap = (neighborhoods: Neighborhood[]) => {
    console.log("Rendering neighborhoods on the map");
    const existingLayer = webMap.findLayerById("neighborhoodMarkers");
    if (existingLayer) {
      webMap.remove(existingLayer);
    }

    const graphicsLayer = new GraphicsLayer({
      id: "neighborhoodMarkers",
    });
    webMap.add(graphicsLayer);

    neighborhoods.slice(0, 5).forEach((neighborhood, index) => {
      const point = new Point({
        longitude: neighborhood.longitude,
        latitude: neighborhood.latitude
      });

      const circleSymbol = new SimpleMarkerSymbol({
        style: "circle",
        color: "transparent",
        size: "12px",
        outline: {
          color: "white",
          width: 2
        }
      });

      const textSymbol = new TextSymbol({
        text: `${index + 1}`,
        color: "white",
        font: {
          size: 6,
          weight: "bold"
        },
        yoffset: -1,
        backgroundColor: "transparent",
        haloColor: "transparent",
        haloSize: "0px"
      });

      const circleGraphic = new Graphic({
        geometry: point,
        symbol: circleSymbol
      });

      const textGraphic = new Graphic({
        geometry: point,
        symbol: textSymbol
      });

      graphicsLayer.add(circleGraphic);
      graphicsLayer.add(textGraphic);
    });

    webMap.reorder(graphicsLayer, webMap.layers.length - 1);
  };

  return showTextList ? (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobileLandscape ? .25 : 1,
      }}
    >
      {neighborhoods.map((neighborhood, index) => {
        // Determine the styling based on the ranking
        let fontSize = '0.65rem'; // Default font size for ranks 4-5
        let fontWeight = 'normal';
        let color = 'black';

        // Adjust font size for mobile landscape
        if (isMobileLandscape) {
          fontSize = '0.7rem'; // Smaller font size for mobile landscape
        }

        if (index === 0) {
          fontSize = isMobileLandscape ? '0.7rem' : '.89rem'; // Largest font for rank 1
          fontWeight = 'bold';
          color = 'black'; // Accent color for rank 1
        } else if (index === 1) {
          fontSize = isMobileLandscape ? '0.65rem' : '.85rem'; // Slightly smaller for rank 2
          fontWeight = 'bold';
          color = 'black'; // Accent color for rank 2
        } else if (index === 2) {
          fontSize = isMobileLandscape ? '0.65rem' : '0.8rem'; // Slightly larger for rank 3
          fontWeight = 'bold';
          color = 'black'; // Accent color for rank 3
        }

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: isMobileLandscape ? '2px 0' : '4px 0', // Adjust padding based on mobile landscape
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: fontWeight, fontSize: fontSize, color: color }}>
              {index + 1}.
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: fontWeight, fontSize: fontSize, color: color }}>
              {neighborhood.name}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: fontWeight, fontSize: fontSize, color: color }}>
              {neighborhood.score.toFixed(2)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  ) : null;
};

export default TopNeighborhoods;














