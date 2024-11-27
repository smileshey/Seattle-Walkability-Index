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
import { neighborhoodPopupTemplate, fishnetPopupTemplate } from './popup_template';
import { handleRecalculate } from './walkscore_calculator';
import { createHeatmapLayer } from './heatmap_render'; // Update the import here to 'createHeatmapLayer'
import LayerList from "@arcgis/core/widgets/LayerList"; // Import Esri LayerList widget

// WebMap setup
const webMap = new WebMap({
  portalItem: {
    id: 'd50d84100894480ca401a350ae85c60a'
  }
});

console.log('webmap loaded');

// MapView setup
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

  // Determine if the device is desktop or not (boolean)
  const isDesktop = window.innerWidth > 1000;

// Trigger the heatmap generation using the initial walk_score from walkscore_fishnet_points on load
try {
  console.log("Initial load: Generating heatmap using walkscore_fishnet_points.");
  const walkscorePointsLayer = webMap.allLayers.find(layer => layer.title === "walkscore_fishnet_points") as FeatureLayer;

  if (walkscorePointsLayer) {
    // Set the walkscore_points_layer to visible for generating the heatmap
    walkscorePointsLayer.visible = true;

    // Use the heatmap creation function
    await createHeatmapLayer(walkscorePointsLayer, "Initial Heatmap", "walk_score", webMap, view);
  } else {
    console.error("Layer walkscore_fishnet_points not found");
  }

  console.log("Heatmap generation completed successfully.");
} catch (error) {
  console.error("Error during initial heatmap generation:", error);
}
  // Add the LayerList widget for easier debugging of layer visibility
  console.log("Adding LayerList widget to the view.");
  const layerList = new LayerList({
    view: view,
  });

  view.ui.add(layerList, {
    position: "top-right"
  });
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

  return (
    <div id="appRoot">
      <BasicMenu />

      <div className="widget-container" id="sliderDiv"></div>
      <div className="legend-container"></div>
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




