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
        size: "15px",
        outline: {
          color: "black",
          width: 2
        }
      });

      const textSymbol = new TextSymbol({
        text: `${index + 1}`,
        color: "black",
        font: {
          size: 8,
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
    <Box className="top-neighborhoods-list">
      {neighborhoods.map((neighborhood, index) => {
        // Determine the class name based on the ranking
        let rankClass = "rankDefault";
        if (index === 0) rankClass = "rank1";
        else if (index === 1) rankClass = "rank2";
        else if (index === 2) rankClass = "rank3";
  
        return (
          <Box key={index} className="top-neighborhood-row">
            <Box className={rankClass}>
              {index + 1}.
            </Box>
            <Box className={rankClass}>
              {neighborhood.name}
            </Box>
            <Box className={rankClass}>
              {neighborhood.score.toFixed(2)}
            </Box>
          </Box>
        );
        
      })}
    </Box>
  ) : null;  
};

export default TopNeighborhoods;














