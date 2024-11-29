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
import VisibilityState from './visibility_state'; // Import VisibilityState class

const webMap = new WebMap({
  portalItem: {
    id: 'd50d84100894480ca401a350ae85c60a'
  }
});

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

const visibilityState = new VisibilityState({ webMap });

// Persistent roots outside of the component to prevent re-creation during re-renders
let sliderRoot: Root | null = null;
let legendRoot: Root | null = null;
let toggleRoot: Root | null = null;

const MainComponent = () => {
  const [recalculateTriggered, setRecalculateTriggered] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<null | 'slider' | 'legend'>(null);
  const [isFishnetLayer, setIsFishnetLayer] = useState(true); // Set to true initially as the heatmap layer is visible first

  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width: 601px) and (orientation: portrait)');
  const isTabletLandscape = useMediaQuery('(min-width: 601px) and (orientation: landscape)');
  const isDesktop = useMediaQuery('(min-width: 1001px)');

    // Call default visibility setup when app loads
    useEffect(() => {
      view.when(() => {
        visibilityState.initializeDefaultVisibility();
      });
    }, [view]);

  const forceRenderWidgets = () => {
    if (isDesktop) {
      visibilityState.setWidgetVisible('sliderDiv', true);
      visibilityState.setWidgetVisible('legend-container', true);

      if (!sliderRoot) {
        const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
        sliderRoot = createRoot(sliderDiv);
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
      }

      if (!legendRoot) {
        const legendDiv = document.querySelector(".legend-container") as HTMLElement;
        legendRoot = createRoot(legendDiv);
        legendRoot.render(<LegendWidget />);
      }
    } else {
      visibilityState.resetAllWidgets();
    }
  };

  const resetWidgets = () => {
    visibilityState.resetAllWidgets();
    setSelectedWidget(null);
  };

  const unmountWidget = (widget: 'slider' | 'legend') => {
    if (widget === 'slider' && sliderRoot) {
      sliderRoot.unmount();
      visibilityState.setWidgetVisible('sliderDiv', false);
      sliderRoot = null;
    }

    if (widget === 'legend' && legendRoot) {
      legendRoot.unmount();
      visibilityState.setWidgetVisible('legend-container', false);
      legendRoot = null;
    }
  };

  useEffect(() => {
    if (isMobilePortrait) {
      visibilityState.resetAllWidgets();
    } else if (isDesktop || isMobileLandscape) {
      forceRenderWidgets();
    }
  }, [isMobilePortrait, isDesktop, isMobileLandscape]);

  useEffect(() => {
    view.when(() => {
      const toggleDiv = document.querySelector("#layerToggleDiv");
      if (toggleDiv) {
        if (!toggleRoot) {
          toggleRoot = createRoot(toggleDiv);
        }
        // Pass visibilityState as a prop to LayerToggle
        toggleRoot.render(<LayerToggle view={view} webMap={webMap} visibilityState={visibilityState} />);
      }
      forceRenderWidgets();
    });
  }, []);

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

  useEffect(() => {
    if (recalculateTriggered) {
      console.log("Recalculating neighborhoods...");
      fetchAndRenderNeighborhoods();
      
      // Update visibility after recalculation is triggered
      visibilityState.handlePostRecalculateVisibility();
  
      setRecalculateTriggered(false);
    }
  }, [recalculateTriggered]);

  const handleBottomNavChange = (newValue: 'slider' | 'legend' | 'toggle') => {
    if (newValue === 'toggle') {
      console.log("Toggling layers via bottom navigation...");
      const newIsHeatmapLayer = !isFishnetLayer;
      setIsFishnetLayer(newIsHeatmapLayer);
  
      // Use VisibilityState to toggle layers instead of handleLayerToggle
      visibilityState.toggleLayerVisibility(newIsHeatmapLayer);
    } else if (selectedWidget === newValue) {
      // If the same widget is selected, we should unmount it
      if (newValue === 'slider') {
        unmountWidget('slider');
      } else if (newValue === 'legend') {
        unmountWidget('legend');
      }
      setSelectedWidget(null);
    } else {
      // Mount the selected widget
      if (newValue === 'slider') {
        visibilityState.setWidgetVisible('sliderDiv', true);
        const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
        if (!sliderRoot) {
          sliderRoot = createRoot(sliderDiv);
        }
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
      } else if (newValue === 'legend') {
        visibilityState.setWidgetVisible('legend-container', true);
        const legendDiv = document.querySelector(".legend-container") as HTMLElement;
        if (!legendRoot) {
          legendRoot = createRoot(legendDiv);
        }
        legendRoot.render(<LegendWidget />);
      }
      setSelectedWidget(newValue);
    }
  };
  
  return (
    <div id="appRoot">
      <BasicMenu />

      <div className="widget-container" id="sliderDiv"></div>
      <div className="legend-container"></div>

      {(isMobilePortrait || isTabletPortrait) && (
        <div>
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              left: '10%',
              right: '10%',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '2px solid rgba(0, 0, 0, 0.4)',
              padding: '10px',
              boxShadow: '0px -1px 6px rgba(0, 0, 0, 0.1)',
              borderRadius: '80px 80px 80px 80px',
              maxWidth: '400px',
              margin: '0 auto',
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
                label="Heatmap Toggle"
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

      {isMobileLandscape && (
        <div>
          <Box
            sx={{
              position: 'fixed',
              top: '5px',
              right: '5px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '0px',
              borderRadius: '15px',
              border: '2px solid rgba(0, 0, 0, 0.4)',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              minWidth: '80px',
              maxWidth: '100px',
              minHeight: '200px',
              width: 'auto',
              height: 'auto',
              maxHeight: '250px',
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












