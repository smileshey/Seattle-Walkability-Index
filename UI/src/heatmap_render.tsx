import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap.js";
import HeatmapRenderer from "@arcgis/core/renderers/HeatmapRenderer";
import VisibilityState from "./visibility_state"; // Import VisibilityState

export const createHeatmapLayer = async (
  pointsLayer: FeatureLayer,
  outputTitle: string,
  field: string,
  webMap: WebMap,
  view: MapView
) => {
  try {
    // Initialize the VisibilityState instance
    const visibilityManager = new VisibilityState({ webMap });

    // Wait for the pointsLayer to load
    await pointsLayer.when();
    
    // List of possible layers to hide
    const possibleLayersToHide = [
        "walkscore_fishnet_points",
        "walkscore_neighborhoods",
        "Personalized Heatmap",
        "Personalized Neighborhood Walkscore"
      ];
  
      // Filter layers to hide by checking their availability in the webMap
      const layersToHide = possibleLayersToHide.filter(layerTitle => {
        const layer = webMap.allLayers.find(layer => layer.title === layerTitle);
        return !!layer; // Only include if layer exists
      });

      console.log(layersToHide)
  
      // Hide the layers that exist in the map
      visibilityManager.hideAllLayers(layersToHide);

    // Query the features from the pointsLayer
    console.log("Querying features from points layer...");
    const query = pointsLayer.createQuery();
    query.where = "1=1"; // Query all features
    query.returnGeometry = true; // Return geometry of features
    query.outFields = [field]; // Only retrieve the necessary field

    const featureSet = await pointsLayer.queryFeatures(query);
    const featuresArray = featureSet.features;

    if (!featuresArray || featuresArray.length === 0) {
      console.error("No features found in the layer.");
      return;
    }
    // Create heatmap renderer
    const heatmapRenderer = new HeatmapRenderer({
      field: field,
      colorStops: [
        { ratio: 0, color: [255, 255, 255, 0] }, // Transparent (replicating ratio: 0)
        { ratio: 0.001, color: [255, 0, 0, 0.5] }, // Red at 50% opacity (replicating ratio: 0.001)
        { ratio: 0.5, color: [255, 255, 0, 0.5] }, // Yellow at 50% opacity (replicating ratio: 0.5)
        { ratio: 1.0, color: [20, 175, 0, 0.5] }, // Green at 70% opacity (replicating ratio: 1)
      ],
      radius: 50,
      maxDensity: 0.015,
      minDensity: 0.001,
      referenceScale: 31000
    });

    // Apply the renderer to the points layer
    pointsLayer.renderer = heatmapRenderer;
    console.log("Heatmap renderer applied to points layer.");

    // Add the points layer to the webMap if not already added
    if (!webMap.layers.includes(pointsLayer)) {
      console.log("Adding points layer to the map...");
      webMap.add(pointsLayer);
    } else {
      console.log("Points layer already exists in the map.");
    }

    console.log("Heatmap layer created successfully.");
  } catch (error) {
    console.error("Error creating heatmap layer:", error);
  }
};









  

















