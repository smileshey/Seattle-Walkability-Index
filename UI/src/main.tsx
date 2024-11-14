console.log('main.tsx is being accessed correctly');

import React, { useState, useEffect, useRef } from "react";
import { createRoot, Root } from 'react-dom/client';
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SliderWidget from "./slider_widget";
import LegendWidget from './legend_widget';
import LayerToggle from './toggle_widget'; // Import the LayerToggle component
import { getTopNeighborhoods } from './neighborhood_utils';
import TopNeighborhoods from "./top_neighborhoods";
import BasicMenu from './navBar';
import { useMediaQuery, BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import ToggleIcon from '@mui/icons-material/ToggleOn';
import LegendIcon from '@mui/icons-material/Map';
import { neighborhoodPopupTemplate, fishnetPopupTemplate } from './popup_template'; // Import templates


const webMap = new WebMap({
  portalItem: {
    id: 'aa699890d4f449d5b528b6a09366329c'
  } 
},
);
console.log('webmap loaded');

const view = new MapView({
  container: "viewDiv",
  map: webMap,
  center: [-122.3321, 47.6062],
  zoom: 13,
  ui: {
    components: ["attribution"]
  }
});

// Persistent roots outside of the component to prevent re-creation during re-renders
let sliderRoot: Root | null = null;
let legendRoot: Root | null = null;
let toggleRoot: Root | null = null;


const MainComponent = () => {
  const [recalculateTriggered, setRecalculateTriggered] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<null | 'slider' | 'legend'>(null);
  const [isFishnetLayer, setIsFishnetLayer] = useState(false);

  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width: 601px) and (orientation: portrait)');
  const isTabletLandscape = useMediaQuery('(min-width: 601px) and (orientation: landscape)');

  const isDesktop = useMediaQuery('(min-width: 1001px)');

  const prevIsMobilePortrait = useRef(isMobilePortrait);
  const prevIsMobileLandscape = useRef(isMobileLandscape);
  const prevIsDesktop = useRef(isDesktop);

  // Track visibility for all widgets
  const [sliderVisible, setSliderVisible] = useState(!isMobilePortrait && !isTabletPortrait); 
  const [legendVisible, setLegendVisible] = useState(!isMobilePortrait && !isTabletPortrait); 
  const [toggleVisible, setToggleVisible] = useState(!isMobilePortrait && !isTabletPortrait); 
  

  const forceRenderWidgets = () => {
    const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
    const legendDiv = document.querySelector(".legend-container") as HTMLElement;
    const toggleDiv = document.querySelector("#layerToggleDiv") as HTMLElement;

    // Render the slider and legend widgets only in desktop mode
    if (isDesktop) {
        setSliderVisible(true);
        setLegendVisible(true);

        // Render the slider widget
        if (!sliderRoot || sliderDiv.style.visibility === 'hidden') {
            sliderRoot = createRoot(sliderDiv);
            sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
        }
        sliderDiv.style.visibility = 'visible';

        // Render the legend widget
        if (!legendRoot || legendDiv.style.visibility === 'hidden') {
            if (!legendRoot) {
                legendRoot = createRoot(legendDiv);
            }
            legendRoot.render(<LegendWidget />);
        }
        legendDiv.style.visibility = 'visible';
    } else if (isMobileLandscape) {
        // Do not render the widgets by default in mobile landscape mode
        setSliderVisible(false);
        setLegendVisible(false);

        // Hide the slider and legend widgets
        if (sliderDiv) sliderDiv.style.visibility = 'hidden';
        if (legendDiv) legendDiv.style.visibility = 'hidden';
    } else {
        // Hide the widgets in mobile portrait
        if (sliderDiv) sliderDiv.style.visibility = 'hidden';
        if (legendDiv) legendDiv.style.visibility = 'hidden';
    }
};

  const resetWidgets = () => {
    setTimeout(() => {
      const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
      const legendDiv = document.querySelector(".legend-container") as HTMLElement;
  
      if (sliderDiv) {
        sliderDiv.style.visibility = 'hidden'; // Hide the slider in portrait mode
      }
  
      if (legendDiv) {
        legendDiv.style.visibility = 'hidden'; // Hide the legend in portrait mode
      }
  
      setSelectedWidget(null); // Reset the selected widget
    }, 0);
  };
  

  const unmountWidget = (widget: 'slider' | 'legend') => {
    setTimeout(() => {
      const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
      const legendDiv = document.querySelector(".legend-container") as HTMLElement;
  
      if (widget === 'slider' && sliderRoot && sliderDiv) {
        console.log("Hiding slider widget");
        sliderDiv.style.visibility = 'hidden'; // Hide but don't unmount
      }
  
      if (widget === 'legend' && legendRoot && legendDiv) {
        console.log("Hiding legend widget");
        legendDiv.style.visibility = 'hidden'; // Hide but don't unmount
      }
    }, 0);
  };
  

  const fetchAndRenderNeighborhoods = async () => {
    const personalizedLayer = webMap.allLayers.find(layer => layer.title === "Personalized Neighborhood Walkscore") as FeatureLayer;
    const baseLayer = webMap.allLayers.find(layer => layer.title === "walkscore_neighborhoods") as FeatureLayer;

    let layerToUse = baseLayer;
    let fieldToUse = "rank_normalized_walk_score";

    if (personalizedLayer) {
      layerToUse = personalizedLayer;
      fieldToUse = "personalized_walkscore";
    }

    const fetchedNeighborhoods = await getTopNeighborhoods(layerToUse, fieldToUse);

    const topNeighborhoodsDiv = document.querySelector("#topNeighborhoodsDiv");
    if (topNeighborhoodsDiv && topNeighborhoodsDiv.id !== "root") {
      createRoot(topNeighborhoodsDiv).render(
        <TopNeighborhoods
          neighborhoods={fetchedNeighborhoods}
          view={view}
          webMap={webMap}
          onNeighborhoodsLoaded={(neighborhoods) => console.log("Neighborhoods loaded:", neighborhoods)}
          showTextList={false}
        />
      );
    }
  };

  const handleLayerToggle = (isFishnet: boolean) => {
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
    if (isMobilePortrait) {
      resetWidgets(); // Reset and hide widgets when switching to mobile portrait
    } else if (isDesktop || isMobileLandscape) {
      forceRenderWidgets(); // Force rendering widgets in landscape/desktop
    }
  }, [isMobilePortrait, isDesktop, isMobileLandscape]);
  

  useEffect(() => {
    // Wait for the map view to be ready before rendering any widgets
    view.when(() => {
      const toggleDiv = document.querySelector("#layerToggleDiv");
      if (toggleDiv) {
        if (!toggleRoot) { // Check if toggleRoot has not been initialized
          toggleRoot = createRoot(toggleDiv); // Create root only if it doesn't exist
        }
        toggleRoot.render(<LayerToggle view={view} webMap={webMap} />);
      }
      forceRenderWidgets();

    });
  }, []);
  
  useEffect(() => {
    if (prevIsMobilePortrait.current === false && (isMobilePortrait || isTabletPortrait || isMobileLandscape)) {
      console.log("Switched to mobile mode, resetting widgets...");
      resetWidgets();
    }
  
    if ((!isMobilePortrait && !isTabletPortrait && (isDesktop)) || (prevIsMobilePortrait.current === true && !isMobilePortrait && !isTabletPortrait)) {
      console.log("Switched to desktop mode, force rendering widgets...");
      setTimeout(() => forceRenderWidgets(), 0);
    }
  
    prevIsMobilePortrait.current = isMobilePortrait;
    prevIsMobileLandscape.current = isMobileLandscape;
    prevIsDesktop.current = isDesktop;
  }, [isMobilePortrait, isMobileLandscape, isDesktop]);

  useEffect(() => {
    if (recalculateTriggered) {
      console.log("Recalculating neighborhoods...");
      fetchAndRenderNeighborhoods();
      setRecalculateTriggered(false);
    }
  }, [recalculateTriggered]);

  useEffect(() => {
    if (selectedWidget === 'slider') {
      const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
  
      if (sliderDiv) {
        sliderDiv.style.visibility = 'visible';
        if (!sliderRoot) {
          console.log("Rendering slider widget for the first time");
          sliderRoot = createRoot(sliderDiv); // Create root only if it doesn't exist
        }
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
      }
    }
  }, [selectedWidget]);

  useEffect(() => {
    if (selectedWidget === 'slider') {
      const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;

      if (sliderDiv) {
        sliderDiv.style.visibility = 'visible';
      }

      if (sliderDiv && !sliderRoot) {
        console.log("Rendering slider widget for the first time");
        if (sliderDiv) {
          if (!sliderRoot) {
            sliderRoot = createRoot(sliderDiv); // Only create if not initialized
          }
          sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
        }
      } else if (sliderRoot) {
        console.log("Re-rendering slider widget");
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
      }
    }
  }, [selectedWidget]);

  // Fix for the Bottom Navigation handling of 'toggle'
  const handleBottomNavChange = (newValue: 'slider' | 'legend' | 'toggle') => {
    if (newValue === 'toggle') {
      console.log("Toggling layers via bottom navigation...");
      setIsFishnetLayer(prev => !prev); // Toggle the fishnet layer state
      handleLayerToggle(!isFishnetLayer); // Pass the updated layer state to the toggle handler
    } else if (selectedWidget === newValue) {
      if (newValue === 'slider') {
        unmountWidget('slider');
      } else if (newValue === 'legend') {
        unmountWidget('legend');
      }
      setSelectedWidget(null);
    } else {
      if (newValue === 'slider') {
        setSliderVisible(true);
        const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
        if (sliderDiv) sliderDiv.style.visibility = 'visible';
      } else if (newValue === 'legend') {
        setLegendVisible(true);
        const legendDiv = document.querySelector(".legend-container") as HTMLElement;

        // Ensure the legend widget is rendered when the button is clicked
        if (!legendRoot && legendDiv) {
          legendRoot = createRoot(legendDiv);
          legendRoot.render(<LegendWidget />); // Render the LegendWidget if not already initialized
        }

        if (legendDiv) {
          legendDiv.style.visibility = 'visible'; // Make sure the legend is visible
        }
      }
      setSelectedWidget(newValue);
    }
  };

  return (
    <div id="appRoot">
      {/* Render BasicMenu (navBar) at the top of the application */}
      <BasicMenu />

      <div className="widget-container" id="sliderDiv"></div>
      <div className="legend-container"></div>

      {/* Mobile-specific Bottom Navigation */}
      {(isMobilePortrait || isTabletPortrait) && (
        <div>
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              left: '10%',  // Reduce the width by shifting it away from the left
              right: '10%', // Reduce the width by shifting it away from the right
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',  // Semi-transparent background
              border: '2px solid rgba(0, 0, 0, 0.4)',  // Subtle border
              padding: '10px',
              boxShadow: '0px -1px 6px rgba(0, 0, 0, 0.1)',
              borderRadius: '80px 80px 80px 80px',
              maxWidth: '400px',  // Set the maximum width for the container
              margin: '0 auto',  // Center the container if width exceeds maxWidth
            }}
          >
            <BottomNavigation
              value={selectedWidget}
              onChange={(event, newValue) => handleBottomNavChange(newValue as 'slider' | 'legend' | 'toggle')}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: 'transparent',
                width: '100%',
              }}
              showLabels
            >
              <BottomNavigationAction 
                label="Custom Walkscore" 
                icon={<InfoIcon />} 
                value="slider" 
                sx={{ 
                  justifyContent: 'center', 
                  padding: '8px',
                  whiteSpace: 'normal', 
                  textAlign: 'center',
                  lineHeight: 1.2, 
                  maxWidth: '80px'
                }}
              />
              <BottomNavigationAction 
                label="View Toggle" 
                icon={<ToggleIcon />} 
                value="toggle" 
                sx={{ 
                  justifyContent: 'center', 
                  padding: '8px',
                  whiteSpace: 'normal', 
                  textAlign: 'center',
                  lineHeight: 1.2, 
                  maxWidth: '80px'
                }}
              />
              <BottomNavigationAction 
                label="Legend" 
                icon={<LegendIcon />} 
                value="legend" 
                sx={{ 
                  justifyContent: 'center', 
                  padding: '8px',
                  whiteSpace: 'normal', 
                  textAlign: 'center',
                  lineHeight: 1.2, 
                  maxWidth: '80px'
                }}
              />
            </BottomNavigation>
          </Box>
        </div>
      )}

      {/* // Mobile Landscape Layout */}
      {isMobileLandscape && (
        <div>
          <Box
            sx={{
              position: 'fixed',  // Keep the container fixed
              top: '5px',        // Offset from the top
              right: '5px',      // Offset from the right
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',  // Center buttons vertically within the container
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',  // Semi-transparent background
              padding: '0px',  // Add padding for spacing around the button group
              borderRadius: '15px',  // Adjusted for slightly rounded corners
              border: '2px solid rgba(0, 0, 0, 0.4)',  // Subtle border
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',  // Light shadow for depth
              minWidth: '80px',  // Set a minimum width for the container
              maxWidth: '100px',  // Set a max width for the container to make it responsive
              minHeight: '200px',  // Set a minimum height for the container
              width: 'auto',  // Allow width to auto-adjust based on content
              height: 'auto',  // Allow height to auto-adjust based on content
              maxHeight: '250px',  // Limit maximum height to maintain a responsive design
            }}
          >
            <BottomNavigation
              value={selectedWidget}
              onChange={(event, newValue) => handleBottomNavChange(newValue as 'slider' | 'legend' | 'toggle')}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                backgroundColor: 'transparent',
                width: 'auto',
              }}
              showLabels
            >
              <BottomNavigationAction 
                label="Custom Walkscore" 
                icon={<InfoIcon />} 
                value="slider" 
                sx={{ 
                  justifyContent: 'center', 
                  padding: '8px',
                  whiteSpace: 'normal', 
                  textAlign: 'center',
                  lineHeight: 1.2, 
                  maxWidth: '80px'
                }}
              />
              <BottomNavigationAction 
                label="View Toggle" 
                icon={<ToggleIcon />} 
                value="toggle" 
                sx={{ 
                  justifyContent: 'center', 
                  padding: '8px',
                  whiteSpace: 'normal', 
                  textAlign: 'center',
                  lineHeight: 1.2, 
                  maxWidth: '80px'
                }}
              />
              <BottomNavigationAction 
                label="Legend" 
                icon={<LegendIcon />} 
                value="legend" 
                sx={{ 
                  justifyContent: 'center', 
                  padding: '8px',
                  whiteSpace: 'normal', 
                  textAlign: 'center',
                  lineHeight: 1.2, 
                  maxWidth: '80px'
                }}
              />
            </BottomNavigation>
          </Box>
        </div>
      )}
    </div>
  );
};
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<MainComponent />);
  }
});

export default MainComponent;
