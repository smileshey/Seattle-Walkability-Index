import React, { useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import HeatmapRenderer from "@arcgis/core/renderers/HeatmapRenderer";
import Field from "@arcgis/core/layers/support/Field";
import Graphic from "@arcgis/core/Graphic";
import Collection from "@arcgis/core/core/Collection";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import {
  getSlopeScaler,
  getEffectiveSpeedLimitScaler,
  getBusinessDensityScaler,
  getCrimeDensityScaler,
  getCrashDensityScaler,
} from "./scaler_calculations";
import {
  createPersonalizedNeighborhoodsLayer,
  rankNormalizeAndScaleScores,
} from "./neighborhood_utils";
import { getTopNeighborhoods, Neighborhood } from "./neighborhood_utils";

interface FeatureAttributes {
  effective_slope: number;
  business_density: number;
  Max_Speed_Limit: number;
  crime_density_normalized: number;
  crash_density_normalized: number;
  unadjusted_walkscore: number;
  walk_score: number;
  personalized_walkscore?: number;
  slope_scaler?: number;
  effective_speed_limit_scaler?: number;
  business_density_scaler?: number;
  crime_density_scaler?: number;
  crash_density_scaler?: number;
  [key: string]: any;
}

const createPersonalizedWalkscoreLayer = async (
  originalLayer: FeatureLayer,
  title: string,
  userSliderValues: { [key: string]: number },
  webMap: __esri.WebMap
) => {
  try {
    console.log("Creating personalized walkscore layer...");

    // Query the original layer to get the features
    const query = originalLayer.createQuery();
    query.where = "1=1";
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.start = 0;
    query.num = 1000;

    const allFeatures: __esri.Graphic[] = [];
    let result: __esri.FeatureSet | undefined;

    do {
      result = await originalLayer.queryFeatures(query);
      if (result && result.features) {
        allFeatures.push(...result.features);
        query.start += query.num;
      } else {
        break;
      }
    } while (result.features.length === query.num);

    // Recalculate scalers based on user input
    console.log("Calculating personalized scores for features...");
    allFeatures.forEach((graphic) => {
      const attributes = graphic.attributes as FeatureAttributes;

      const slopeScaler = getSlopeScaler(attributes.effective_slope, userSliderValues.slope);
      const effectiveSpeedLimitScaler = getEffectiveSpeedLimitScaler(attributes.Max_Speed_Limit, userSliderValues.streets);
      const businessDensityScaler = getBusinessDensityScaler(attributes.business_density, userSliderValues.amenity);
      const crimeDensityScaler = getCrimeDensityScaler(attributes.crime_density_normalized, userSliderValues.crime);
      const crashDensityScaler = getCrashDensityScaler(attributes.crash_density_normalized, userSliderValues.streets);

      attributes.slope_scaler = slopeScaler;
      attributes.effective_speed_limit_scaler = effectiveSpeedLimitScaler;
      attributes.business_density_scaler = businessDensityScaler;
      attributes.crime_density_scaler = crimeDensityScaler;
      attributes.crash_density_scaler = crashDensityScaler;

      const baseWalkscore = attributes.unadjusted_walkscore;
      attributes.personalized_walkscore = baseWalkscore
        ? (baseWalkscore * slopeScaler * effectiveSpeedLimitScaler * businessDensityScaler * crimeDensityScaler * crashDensityScaler) + 0.001 // Adding 0.0001 to ensure non-zero scores
        : 0.001; // Setting a minimum value of 0.0001
    });

    // Normalize and scale the scores
    console.log("Rank normalizing and scaling personalized scores...");
    rankNormalizeAndScaleScores(allFeatures);

    // Define the new fields to be added
    const allFields = originalLayer.fields.concat([
      new Field({
        name: "personalized_walkscore",
        alias: "Personalized Walkscore",
        type: "double",
      }),
    ]);

    // Create the popup template
    const popupTemplate = new PopupTemplate({
      title: "{Name}",
      content: [
        {
          type: "fields",
          fieldInfos: allFields.map((field) => ({
            fieldName: field.name,
            label: field.alias || field.name,
          })),
        },
      ],
    });

    // Remove the old personalized layer if it exists
    let temporaryLayer = webMap.allLayers.find((layer) => layer.title === title) as FeatureLayer;
    if (temporaryLayer) {
      console.log(`Removing existing layer with title: ${title}`);
      webMap.remove(temporaryLayer);
    }

    // Create the new temporary personalized layer
    console.log("Creating new personalized walkscore layer...");
    temporaryLayer = new FeatureLayer({
      source: new Collection(
        allFeatures.map(
          (feature) =>
            new Graphic({
              geometry: feature.geometry,
              attributes: feature.attributes,
            })
        )
      ),
      fields: allFields,
      objectIdField: originalLayer.objectIdField,
      geometryType: originalLayer.geometryType,
      spatialReference: originalLayer.spatialReference,
      title: title,
      popupTemplate: popupTemplate,
    });

    // Add the personalized layer to the map
    console.log("Adding personalized walkscore layer to the map...");
    webMap.add(temporaryLayer);

    await temporaryLayer.when();
    temporaryLayer.refresh();

    console.log("Added personalized walkscore layer to the map.");
    return temporaryLayer;
  } catch (error) {
    console.error("Error creating personalized walkscore layer:", error);
    throw error;
  }
};


// Function to generate a HeatmapRenderer based on the given field
const createHeatmapLayer = async (
  pointsLayer: FeatureLayer,
  outputTitle: string,
  field: string,
  webMap: __esri.WebMap
) => {
  try {
    console.log(`Creating heatmap layer: ${outputTitle} using field: ${field}`);

    // Get min and max values for debugging
    const featuresArray = pointsLayer.source.toArray();
    const scores = featuresArray.map(feature => feature.attributes[field]);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    console.log(`Heatmap values range from ${minScore} to ${maxScore}`);

    const heatmapRenderer = new HeatmapRenderer({
      field: field,
      colorStops: [
        {
          ratio: 0,
          color: [255, 255, 255, 0], // Full transparency for very low values
        },
        {
          ratio: 0.001,
          color: [255, 0, 0, 0.5], // Red with 50% transparency
        },
        {
          ratio: 0.5,
          color: [255, 255, 0, 0.6], // Yellow with 60% transparency
        },
        {
          ratio: 1,
          color: [0, 255, 0, 0.4], // Green with 40% transparency
        },
      ],
      referenceScale: 55500,
      radius: 30
    });

    // Remove any previous heatmap layers with the same title
    let heatmapLayer = webMap.allLayers.find((layer) => layer.title === outputTitle);
    if (heatmapLayer) {
      console.log(`Removing existing heatmap layer: ${outputTitle}`);
      webMap.remove(heatmapLayer);
    }

    // Add the layer to the map first before applying the renderer
    pointsLayer.title = outputTitle;
    webMap.add(pointsLayer);
    await pointsLayer.when();

    // Apply the heatmap renderer after the layer is added to the map
    pointsLayer.renderer = heatmapRenderer;
    // pointsLayer.visible = true; // Make sure this layer is visible
    // console.log(`Heatmap layer ${outputTitle} created successfully with field: ${field}, visibility set to true.`);

  } catch (error) {
    console.error("Error creating heatmap layer:", error);
  }
};


const handleRecalculate = async (
  view: MapView,
  webMap: __esri.WebMap,
  userSliderValues: { [key: string]: number }
): Promise<Neighborhood[]> => {
  const currentExtent = view.extent.clone();
  const currentZoom = view.zoom;

  console.log("Recalculate button clicked.");

  const walkscorePointsLayer = webMap.allLayers.find((layer) => layer.title === "walkscore_fishnet_points") as FeatureLayer;
  const walkscoreNeighborhoodsLayer = webMap.allLayers.find((layer) => layer.title === "walkscore_neighborhoods") as FeatureLayer;

  if (!walkscorePointsLayer || !walkscoreNeighborhoodsLayer) {
    console.error("Required layers not found");
    return [];
  }

  // Set neighborhood layer visibility to false
  walkscoreNeighborhoodsLayer.visible = false;
  console.log("Setting neighborhood layer visibility to false.");

  console.log("Creating personalized walkscore layer...");
  const personalizedPointsLayer = await createPersonalizedWalkscoreLayer(
    walkscorePointsLayer,
    "Personalized Walkscore",
    userSliderValues,
    webMap
  );

  if (personalizedPointsLayer) {
    // Hide original walkscore points heatmap
    walkscorePointsLayer.visible = false;
    console.log("Hiding original walkscore points layer.");

    // Generate the heatmap based on the personalized scores
    console.log("Creating personalized heatmap layer...");
    await createHeatmapLayer(personalizedPointsLayer, "Personalized Heatmap", "personalized_walkscore", webMap);

    // Create personalized neighborhood scores and get top neighborhoods
    const topNeighborhoods = await createPersonalizedNeighborhoodsLayer(personalizedPointsLayer, walkscoreNeighborhoodsLayer, webMap);

    // Ensure the neighborhood layer is still hidden
    walkscoreNeighborhoodsLayer.visible = false;
    console.log("Re-ensuring neighborhood layer visibility set to false.");

    view.extent = currentExtent;
    view.zoom = currentZoom;

    console.log("Finished recalculating, returning to original view.");

    return topNeighborhoods; // Return the recalculated top neighborhoods
  }

  return [];
};

const WalkscoreCalculator: React.FC<{ view: MapView; webMap: __esri.WebMap }> = ({ view, webMap }) => {
  useEffect(() => {
    const initialLoad = async () => {
      console.log("Initial load, creating base heatmap.");
      const walkscoreFishnetLayer = webMap.allLayers.find((layer) => layer.title === "walkscore_fishnet_points") as FeatureLayer;
      if (walkscoreFishnetLayer) {
        await createHeatmapLayer(walkscoreFishnetLayer, "Initial Heatmap", "walk_score", webMap);
      }
    };

    initialLoad();
  }, [webMap]);

  return (
    <button onClick={() => handleRecalculate(view, webMap, { slope: 2, streets: 2, amenity: 2, crime: 2 })}>
      Recalculate Walkscore
    </button>
  );
};

export default WalkscoreCalculator;
export { handleRecalculate };


