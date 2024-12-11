console.log('main.tsx is being accessed correctly');

import React, { useState, useEffect } from "react";
import { createRoot, Root } from 'react-dom/client';
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SliderWidget from "./slider_widget";
import LegendWidget from './legend_widget';
import LayerToggle from './toggle_widget';
import { getTopNeighborhoods } from './neighborhood_utils';
import TopNeighborhoods from "./top_neighborhoods";
import BasicMenu from './navBar';
import { useMediaQuery, BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import ToggleIcon from '@mui/icons-material/ToggleOn';
import LegendIcon from '@mui/icons-material/Map';
import VisibilityState from './visibility_state';
import '../dist/styles/styles.mobile.css';

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
  zoom: 11,
  ui: {
    components: ["attribution"],
  },
  constraints: {
    maxZoom: 17,
    minZoom: 10, 
  },
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
  const [isLegendActive, setIsLegendActive] = useState(false);

  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(max-height: 600px) and (orientation: landscape)');
  const isDesktop = useMediaQuery('(min-width: 601px) and (min-height: 601px)');

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
        const sliderContainer = document.querySelector("#sliderContainer") as HTMLElement;
        sliderRoot = createRoot(sliderContainer);
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
      }

      if (!legendRoot) {
        const legendDiv = document.querySelector(".legend-container") as HTMLElement;
        legendRoot = createRoot(legendDiv);
        legendRoot.render(<LegendWidget isActive={true} />);
      }
    } else {
      visibilityState.resetAllWidgets();
    }
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
    } else if (isDesktop) {
      forceRenderWidgets();
    }
  }, [isMobilePortrait, isDesktop]);

  useEffect(() => {
    view.when(() => {
      const toggleDiv = document.querySelector("#layerToggleDiv");
      if (toggleDiv) {
        if (!toggleRoot) {
          toggleRoot = createRoot(toggleDiv);
        }
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
      fetchAndRenderNeighborhoods();
      // Update visibility after recalculation is triggered
      visibilityState.handlePostRecalculateVisibility();
      setRecalculateTriggered(false);
    }
  }, [recalculateTriggered]);

  const handleBottomNavChange = (newValue: 'slider' | 'legend' | 'toggle') => {
    if (newValue === 'toggle') {
      const newIsHeatmapLayer = !isFishnetLayer;
      setIsFishnetLayer(newIsHeatmapLayer);
      visibilityState.toggleLayerVisibility(newIsHeatmapLayer);
    } else if (selectedWidget === newValue) {
      if (newValue === 'slider') {
        unmountWidget('slider');
      } else if (newValue === 'legend') {
        visibilityState.toggleLegendVisibility(false);
        unmountWidget('legend');
        setIsLegendActive(false);
      }
      setSelectedWidget(null);
    } else {
      if (newValue === 'slider') {
        visibilityState.setWidgetVisible('sliderDiv', true);
        const sliderContainer = document.querySelector("#sliderContainer") as HTMLElement;
        if (!sliderRoot) {
          sliderRoot = createRoot(sliderContainer);
        }
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
      } else if (newValue === 'legend') {
        visibilityState.toggleLegendVisibility(true);
        visibilityState.setWidgetVisible('legend-container', true);
        const legendDiv = document.querySelector(".legend-container") as HTMLElement;
        if (!legendRoot) {
          legendRoot = createRoot(legendDiv);
        }
        legendRoot.render(<LegendWidget isActive={true} />);
        setIsLegendActive(true);
      }
      setSelectedWidget(newValue);
    }
  };

  return (
    <div id="appRoot">
      {/* Rotate Screen Notification */}
      {isMobileLandscape && (
        <Box className="rotate-screen-notification">
          <Box className="rotate-icon">🔄</Box>
          <Box className="rotate-text">Rotate Screen</Box>
        </Box>
      )}
  
      <BasicMenu />
  
      {/* Slider Container */}
      <div id="sliderContainer">
        <div id="sliderDiv"></div>
      </div>
      <div className={`legend-container ${isLegendActive ? 'active' : ''}`}>
        <LegendWidget isActive={isLegendActive} />
      </div>
  
      {/* Bottom Navigation Bar */}
      {isMobilePortrait && (
        <Box className="bottom-nav-container">
          <BottomNavigation
            value={selectedWidget}
            onChange={(event, newValue) => handleBottomNavChange(newValue as 'slider' | 'legend' | 'toggle')}
            className="bottom-nav"
          >
            <BottomNavigationAction
              label="Personalize"
              icon={<InfoIcon />}
              value="slider"
              className="bottom-nav-action"
            />
            <BottomNavigationAction
              label="Heatmap Toggle"
              icon={<ToggleIcon />}
              value="toggle"
              className="bottom-nav-action"
            />
            <BottomNavigationAction
              label="Legend"
              icon={<LegendIcon />}
              value="legend"
              className="bottom-nav-action"
            />
          </BottomNavigation>
        </Box>
        
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














