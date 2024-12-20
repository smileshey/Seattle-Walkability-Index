// console.log('main.tsx is being accessed correctly');

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
import { neighborhoodPopupTemplate, fishnetPopupTemplate } from './popup_template';
// import '../dist/styles/styles.mobile.css';
// import '../dist/styles/styles.desktop.css';
// import '../dist/styles/styles.tablet.css';


const webMap = new WebMap({
  portalItem: {
    id: '31c2468b645744df9b01a40a206455df'
  }
});

console.log('webmap loaded');

const view = new MapView({
  container: "viewDiv",
  map: webMap,
  center: [-122.3321, 47.6062],
  zoom: 12,
  ui: {
    components: ["attribution"],
  },
  constraints: {
    maxZoom: 17,
    minZoom: 12, 
  },
});

const BASE_LAYERS = {
  FISHNET: "walkscore_fishnet",
  NEIGHBORHOODS: "walkscore_neighborhoods",
};

const PERSONALIZED_LAYERS = {
  FISHNET: "personalized_walkscore_fishnet",
  NEIGHBORHOODS: "personalized_neighborhood_walkscore",
};
const visibilityState = new VisibilityState({ webMap });

// Persistent roots outside of the component to prevent re-creation during re-renders
let sliderRoot: Root | null = null;
let legendRoot: Root | null = null;
let toggleRoot: Root | null = null;
let topNeighborhoodsRoot: Root | null = null;


const MainComponent = () => {
  const [recalculateTriggered, setRecalculateTriggered] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<null | 'slider' | 'legend'>(null);
  const [isFishnetLayer, setIsFishnetLayer] = useState(true);
  const [isLegendActive, setIsLegendActive] = useState(false);

  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(max-height: 600px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width: 601px) and (max-width: 1000px) and (orientation: portrait)');
  const isDesktop = useMediaQuery('(min-width: 1001px)'); // Desktop starts from width > 1000px
  
  // Call default visibility setup when app loads
  useEffect(() => {
    view.when(() => {
      visibilityState.initializeDefaultVisibility();

      // Apply popup templates
      const fishnetLayer = webMap.allLayers.find(layer => layer.title === BASE_LAYERS.FISHNET) as FeatureLayer;
      const neighborhoodLayer = webMap.allLayers.find(layer => layer.title === BASE_LAYERS.NEIGHBORHOODS) as FeatureLayer;

      if (fishnetLayer) {
        fishnetLayer.popupTemplate = fishnetPopupTemplate;
      }
      if (neighborhoodLayer) {
        neighborhoodLayer.popupTemplate = neighborhoodPopupTemplate;
      }
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
    console.log(isMobilePortrait)
    console.log(isTabletPortrait)
    console.log(isDesktop)
    console.log(isMobileLandscape)
    if (isMobilePortrait || isTabletPortrait) {
      // For mobile and tablet portrait, reset and ensure widgets are not rendered initially
      visibilityState.resetAllWidgets();
    } else if (isDesktop || isMobileLandscape) {
      // For desktop and mobile landscape, force widgets to render
      forceRenderWidgets();
    }
  }, [isMobilePortrait, isTabletPortrait, isDesktop, isMobileLandscape]);
  

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
    const personalizedLayer = webMap.allLayers.find(
      layer => layer.title === PERSONALIZED_LAYERS.NEIGHBORHOODS
    ) as FeatureLayer;
    const baseLayer = webMap.allLayers.find(
      layer => layer.title === BASE_LAYERS.NEIGHBORHOODS
    ) as FeatureLayer;
  
    let layerToUse = baseLayer;
    let fieldToUse = "rank_normalized_walk_score";
  
    if (personalizedLayer) {
      layerToUse = personalizedLayer;
      fieldToUse = "personalized_walkscore";
    }
  
    const fetchedNeighborhoods = await getTopNeighborhoods(layerToUse, fieldToUse);
  
    const topNeighborhoodsDiv = document.querySelector("#topNeighborhoodsDiv") as HTMLElement;
    if (topNeighborhoodsDiv) {
      if (!topNeighborhoodsRoot) {
        // Initialize the root only once
        topNeighborhoodsRoot = createRoot(topNeighborhoodsDiv);
      }
      // Use the existing root to render
      topNeighborhoodsRoot.render(
        <TopNeighborhoods
          neighborhoods={fetchedNeighborhoods}
          view={view}
          webMap={webMap}
          onNeighborhoodsLoaded={(neighborhoods) =>
            console.log("Neighborhoods loaded:", neighborhoods)
          }
          showTextList={false}
        />
      );
    }
  };

  useEffect(() => {
    if (recalculateTriggered) {
      fetchAndRenderNeighborhoods();
      visibilityState.handlePostRecalculateVisibility();
      setRecalculateTriggered(false);
    }
  }, [recalculateTriggered]);

  const handleBottomNavChange = (newValue: 'slider' | 'legend' | 'toggle') => {
    // Handle toggling layers
    if (newValue === 'toggle') {
        const newIsFishnetLayer = !isFishnetLayer;
        setIsFishnetLayer(newIsFishnetLayer);

        const layerToShow = visibilityState.recalculateClicked
            ? newIsFishnetLayer
                ? PERSONALIZED_LAYERS.FISHNET
                : PERSONALIZED_LAYERS.NEIGHBORHOODS
            : newIsFishnetLayer
            ? BASE_LAYERS.FISHNET
            : BASE_LAYERS.NEIGHBORHOODS;

        visibilityState.toggleLayerVisibility(layerToShow);

        console.log(
            `Toggle clicked. Recalculate flag: ${visibilityState.recalculateClicked}, Layer to show: ${layerToShow}`
        );
        return;
    }

    // If the same button is clicked again, unmount the active widget
    if (selectedWidget === newValue) {
        if (newValue === 'slider') {
            unmountWidget('slider');
        } else if (newValue === 'legend') {
            unmountWidget('legend');
            setIsLegendActive(false);
        }
        setSelectedWidget(null);
        return;
    }

    // Hide any currently active widget if switching
    if (selectedWidget === 'slider' && newValue !== 'slider') {
        unmountWidget('slider');
    }
    if (selectedWidget === 'legend' && newValue !== 'legend') {
        unmountWidget('legend');
        setIsLegendActive(false);
    }

    // Mount and display the new widget
    if (newValue === 'slider') {
        visibilityState.setWidgetVisible('sliderDiv', true);
        const sliderContainer = document.querySelector("#sliderContainer") as HTMLElement;
        if (!sliderRoot) {
            sliderRoot = createRoot(sliderContainer);
        }
        sliderRoot.render(
            <SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />
        );
    } else if (newValue === 'legend') {
        visibilityState.setWidgetVisible('legend-container', true);
        const legendDiv = document.querySelector(".legend-container") as HTMLElement;
        if (!legendRoot) {
            legendRoot = createRoot(legendDiv);
        }
        legendRoot.render(<LegendWidget isActive={true} />);
        setIsLegendActive(true);
    }

    // Update the selected widget
    setSelectedWidget(newValue);
};

  return (
    <div id="appRoot">
      {isMobileLandscape && (
        <Box className="rotate-screen-notification">
          <Box className="rotate-icon">🔄</Box>
          <Box className="rotate-text">Rotate Screen</Box>
        </Box>
      )}
  
      <BasicMenu />
  
      <div id="sliderContainer">
        <div id="sliderDiv"></div>
      </div>
      <div className={`legend-container ${isLegendActive ? 'active' : ''}`}>
        <LegendWidget isActive={isLegendActive} />
      </div>
  
      {isMobilePortrait || isTabletPortrait ? (
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
            label="Toggle"
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
    ) : null}

    </div>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  // Use a static variable to store the root instance
  if (rootElement) {
    if (!(window as any)._rootInstance) {
      (window as any)._rootInstance = createRoot(rootElement); // Store root instance globally
    }
    const root = (window as any)._rootInstance;
    root.render(<MainComponent />);
  }
});

export default MainComponent;















