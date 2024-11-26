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
import { handleRecalculate } from './walkscore_calculator';


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

// Log all initial layers and their visibility states
view.when(async () => {
  console.log("Initial load: Checking all layer visibility.");
  webMap.allLayers.forEach(layer => {
    console.log(`Layer: ${layer.title}, Visibility: ${layer.visible}`);
  });

  // Explicitly set visibility for all non-basemap layers
  const layersToHide = ["walkscore_fishnet_points", "Personalized Heatmap", "walkscore_neighborhoods", "Personalized Neighborhood Walkscore"];
  webMap.allLayers.forEach(layer => {
    if (layersToHide.includes(layer.title)) {
      layer.visible = false;
      console.log(`Setting visibility to false for layer: ${layer.title}`);
    }
  });

  // Trigger the recalculation to generate the personalized heatmap on load
  try {
    console.log("Initial load: Triggering recalculation to generate personalized heatmap.");
    const userSliderValues = { slope: 2, streets: 2, amenity: 2, crime: 2 };
    await handleRecalculate(view, webMap, userSliderValues);
    console.log("Initial recalculation completed successfully.");
  } catch (error) {
    console.error("Error during initial recalculation for personalized heatmap:", error);
  }
});


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

    if (isDesktop) {
      setSliderVisible(true);
      setLegendVisible(true);

      if (!sliderRoot || sliderDiv.style.visibility === 'hidden') {
        sliderRoot = createRoot(sliderDiv);
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
      }
      sliderDiv.style.visibility = 'visible';

      if (!legendRoot || legendDiv.style.visibility === 'hidden') {
        if (!legendRoot) {
          legendRoot = createRoot(legendDiv);
        }
        legendRoot.render(<LegendWidget />);
      }
      legendDiv.style.visibility = 'visible';
    } else if (isMobileLandscape) {
      setSliderVisible(false);
      setLegendVisible(false);

      if (sliderDiv) sliderDiv.style.visibility = 'hidden';
      if (legendDiv) legendDiv.style.visibility = 'hidden';
    } else {
      if (sliderDiv) sliderDiv.style.visibility = 'hidden';
      if (legendDiv) legendDiv.style.visibility = 'hidden';
    }
  };

  const resetWidgets = () => {
    setTimeout(() => {
      const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
      const legendDiv = document.querySelector(".legend-container") as HTMLElement;

      if (sliderDiv) {
        sliderDiv.style.visibility = 'hidden';
      }

      if (legendDiv) {
        legendDiv.style.visibility = 'hidden';
      }

      setSelectedWidget(null);
    }, 0);
  };

  const unmountWidget = (widget: 'slider' | 'legend') => {
    const sliderDiv = document.querySelector("#sliderDiv") as HTMLElement;
    const legendDiv = document.querySelector(".legend-container") as HTMLElement;

    if (widget === 'slider' && sliderRoot && sliderDiv) {
      sliderRoot.unmount();  // Unmount the slider completely
      sliderDiv.style.visibility = 'hidden';
      sliderRoot = null;  // Reset the slider root to allow proper re-rendering
    }

    if (widget === 'legend' && legendRoot && legendDiv) {
      legendRoot.unmount();  // Unmount the legend completely
      legendDiv.style.visibility = 'hidden';
      legendRoot = null;  // Reset the legend root to allow proper re-rendering
    }
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

  const handleLayerToggle = (isHeatmap: boolean) => {
    console.log("Handling layer toggle. Toggle state:", isHeatmap);
  
    const heatmapLayerTitle = "Personalized Heatmap";
    const baseHeatmapLayerTitle = "walkscore_fishnet_points";
    const neighborhoodLayerTitle = "walkscore_neighborhoods";
    const personalizedNeighborhoodLayerTitle = "Personalized Neighborhood Walkscore";
  
    const heatmapLayer = webMap.allLayers.find(layer => layer.title === heatmapLayerTitle) as FeatureLayer;
    const baseHeatmapLayer = webMap.allLayers.find(layer => layer.title === baseHeatmapLayerTitle) as FeatureLayer;
    const neighborhoodLayer = webMap.allLayers.find(layer => layer.title === neighborhoodLayerTitle) as FeatureLayer;
    const personalizedNeighborhoodLayer = webMap.allLayers.find(layer => layer.title === personalizedNeighborhoodLayerTitle) as FeatureLayer;
  
    // Ensure all layers are hidden first
    [heatmapLayer, baseHeatmapLayer, neighborhoodLayer, personalizedNeighborhoodLayer].forEach(layer => {
      if (layer) {
        layer.visible = false;
        console.log(`Setting visibility to false for: ${layer.title}`);
      }
    });
  
    // Show the appropriate layer based on the toggle state
    if (isHeatmap) {
      if (heatmapLayer) {
        heatmapLayer.visible = true;
        console.log(`Setting visibility to true for: ${heatmapLayer.title}`);
      } else if (baseHeatmapLayer) {
        baseHeatmapLayer.visible = true;
        console.log(`Setting visibility to true for: ${baseHeatmapLayer.title}`);
      }
    } else {
      if (personalizedNeighborhoodLayer) {
        personalizedNeighborhoodLayer.visible = true;
        console.log(`Setting visibility to true for: ${personalizedNeighborhoodLayer.title}`);
      } else if (neighborhoodLayer) {
        neighborhoodLayer.visible = true;
        console.log(`Setting visibility to true for: ${neighborhoodLayer.title}`);
      }
    }
  
    // Update the state to reflect the current visible layer
    setIsFishnetLayer(isHeatmap);
  };
  

  useEffect(() => {
    if (isMobilePortrait) {
      resetWidgets();
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
        toggleRoot.render(<LayerToggle view={view} webMap={webMap} />);
      }
      forceRenderWidgets();
    });
  }, []);

  useEffect(() => {
    if (recalculateTriggered) {
      console.log("Recalculating neighborhoods...");
      fetchAndRenderNeighborhoods();
      setRecalculateTriggered(false);
    }
  }, [recalculateTriggered]);

  const handleBottomNavChange = (newValue: 'slider' | 'legend' | 'toggle') => {
    if (newValue === 'toggle') {
      console.log("Toggling layers via bottom navigation...");
      const newIsFishnetLayer = !isFishnetLayer;
      handleLayerToggle(newIsFishnetLayer);
      setIsFishnetLayer(newIsFishnetLayer); // Set the state after updating the layers
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
        if (!sliderRoot) {
          sliderRoot = createRoot(sliderDiv);
        }
        sliderRoot.render(<SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />);
        sliderDiv.style.visibility = 'visible';
      } else if (newValue === 'legend') {
        setLegendVisible(true);
        const legendDiv = document.querySelector(".legend-container") as HTMLElement;
        if (!legendRoot) {
          legendRoot = createRoot(legendDiv);
        }
        legendRoot.render(<LegendWidget />);
        legendDiv.style.visibility = 'visible';
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


