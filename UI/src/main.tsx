import React, { useState, useEffect } from "react";
import { createRoot } from 'react-dom/client';
import { renderWithRoot, unmountRoot } from "./rootUtils";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SliderWidget from "./slider_widget";
import { getTopNeighborhoods, Neighborhood } from './neighborhood_utils';
import TopNeighborhoods from "./top_neighborhoods";
import ToggleWidget from "./toggle_widget";
import BasicMenu from './navBar'; // Import the new AppBar component

// Initialize WebMap and MapView outside the component for reuse
const webMap = new WebMap({
  portalItem: {
    id: 'fc18d1fe046a44f39107bb407815adaf'
  }
});

const view = new MapView({
  container: "viewDiv",
  map: webMap,
  center: [-122.3321, 47.6062],
  zoom: 13
});

const MainComponent = () => {
  const [recalculateTriggered, setRecalculateTriggered] = useState(false);
  const [currentLayerTitle, setCurrentLayerTitle] = useState("walkscore_fishnet");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);

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
  
    const topNeighborhoodsDiv = document.getElementById("topNeighborhoodsDiv");
    if (topNeighborhoodsDiv && topNeighborhoodsDiv.id !== "root") {
      renderWithRoot(
        topNeighborhoodsDiv,
        <TopNeighborhoods
          neighborhoods={fetchedNeighborhoods}
          view={view}
          webMap={webMap}
          onNeighborhoodsLoaded={(neighborhoods) => console.log("Neighborhoods loaded:", neighborhoods)}
          showTextList={false}
        />,
        "topNeighborhoodsRoot"
      );
    }
  };

  useEffect(() => {
    view.when(async () => {
      // Move Zoom widget to top-right
      view.ui.empty("top-right");
      view.ui.move("zoom", "top-right");

      // Render the AppBar in the headerDiv
      const headerDiv = document.getElementById("headerDiv");
      if (headerDiv) {
        renderWithRoot(headerDiv, <BasicMenu />, "headerRoot");
      }
  
      const sliderDiv = document.getElementById("sliderDiv");
      if (sliderDiv) {
        renderWithRoot(sliderDiv, <SliderWidget view={view} webMap={webMap} triggerRecalculate={() => setRecalculateTriggered(true)} />, "sliderRoot");
      }
      
      await fetchAndRenderNeighborhoods();
  
      const layerToggleDiv = document.getElementById("layerToggleDiv");
      if (layerToggleDiv) {
        renderWithRoot(layerToggleDiv, <ToggleWidget view={view} webMap={webMap} />, "toggleRoot");
      }
    });
  }, []);
  
  useEffect(() => {
    if (recalculateTriggered) {
      fetchAndRenderNeighborhoods();
      setRecalculateTriggered(false);
    }
  }, [recalculateTriggered]);

  return (
    <>
      <div id="appRoot">
        <div id="sliderDiv"></div>
        <div id="distributionPopup" style={{ display: 'none' }}>
          <div id="distributionPopupBody"></div>
        </div>
        <div id="scalerPopup" style={{ display: 'none' }}>
          <div id="scalerPopupBody"></div>
        </div>
        <div id="layerToggleDiv" className="toggle-container"></div>
      </div>
    </>
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

































































