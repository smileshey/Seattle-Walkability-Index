import React, { useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
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
import { Neighborhood } from "./neighborhood_utils";
import { createHeatmapLayer } from './heatmap_render'; // Update the import here to 'createHeatmapLayer'
import VisibilityState from './visibility_state'; // Import VisibilityState class

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
  webMap: __esri.WebMap,
  visibilityState: VisibilityState
) => {
  try {
    console.time("Total Layer Creation Time");
    // Start timer for querying features
    console.time("Query Features");
    const query = originalLayer.createQuery();
    query.where = "1=1";
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.start = 0;
    query.num = 20483;

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
    console.timeEnd("Query Features");

    // Start timer for recalculating scalers
    console.time("Recalculate Scalers");
    allFeatures.forEach((graphic) => {
      const attributes = graphic.attributes as FeatureAttributes;

      const slopeScaler = getSlopeScaler(attributes.effective_slope, userSliderValues.slope);
      const effectiveSpeedLimitScaler = getEffectiveSpeedLimitScaler(
        attributes.Max_Speed_Limit,
        userSliderValues.streets
      );
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
        ? baseWalkscore *
          slopeScaler *
          effectiveSpeedLimitScaler *
          businessDensityScaler *
          crimeDensityScaler *
          crashDensityScaler +
          0.001
        : 0.001;
    });
    console.timeEnd("Recalculate Scalers");

    // Normalize and scale the scores
  console.time("Rank Normalize and Scale");
  rankNormalizeAndScaleScores(allFeatures);
  console.timeEnd("Rank Normalize and Scale");

  // Calculate statistics for rank normalized scores
  console.time("Calculate Rank-Normalized Statistics");
  const normalizedScores = allFeatures.map((graphic) => graphic.attributes.personalized_walkscore);
  if (normalizedScores.length > 0) {
    const minScore = Math.min(...normalizedScores);
    const maxScore = Math.max(...normalizedScores);

    normalizedScores.sort((a, b) => a - b); // Sort scores to calculate quantiles
    const q1 = normalizedScores[Math.floor(normalizedScores.length * 0.25)];
    const q2 = normalizedScores[Math.floor(normalizedScores.length * 0.5)]; // Median
    const q3 = normalizedScores[Math.floor(normalizedScores.length * 0.75)];

    console.log("Rank-Normalized Personalized Walkscore Statistics:");
    console.log(`Min: ${minScore}, Q1: ${q1}, Median: ${q2}, Q3: ${q3}, Max: ${maxScore}`);
  }
  console.timeEnd("Calculate Rank-Normalized Statistics");

  // Calculate density statistics
  const densities = allFeatures.map((feature) => feature.attributes.personalized_walkscore);
  const minDensity = Math.min(...densities);
  const maxDensity = Math.max(...densities);
  console.log(`Density Stats - Min: ${minDensity}, Max: ${maxDensity}`);



    // Start timer for creating the personalized layer
    console.time("Create Personalized Layer");
    const allFields = originalLayer.fields.concat([
      new Field({
        name: "personalized_walkscore",
        alias: "Personalized Walkscore",
        type: "double",
      }),
    ]);

    const requiredFields = [
      { name: "IndexID", alias: "Index ID", type: "integer" as const },
      { name: "nested", alias: "Nested Field", type: "string" as const },
      { name: "walk_score", alias: "Walk Score", type: "double" as const },
      { name: "personalized_walkscore", alias: "Personalized Walkscore", type: "double" as const },
    ];
  
    // Remove the old personalized layer if it exists
    let temporaryLayer = webMap.allLayers.find((layer) => layer.title === title) as FeatureLayer;
    if (temporaryLayer) {
      webMap.remove(temporaryLayer);
    }

    temporaryLayer = new FeatureLayer({
      source: new Collection(
        allFeatures.map((feature) => {
          const filteredAttributes = {
            IndexID: feature.attributes.IndexID,
            nested: feature.attributes.nested,
            walk_score: feature.attributes.walk_score,
            personalized_walkscore: feature.attributes.personalized_walkscore,
          };
    
          return new Graphic({
            geometry: feature.geometry,
            attributes: filteredAttributes,
          });
        })
      ),
      fields: requiredFields, // Use the filtered fields
      objectIdField: "IndexID", // Ensure this matches the field in your requiredFields array
      geometryType: originalLayer.geometryType,
      spatialReference: originalLayer.spatialReference,
      title: title,
    });
    

    webMap.add(temporaryLayer);
    await temporaryLayer.when();
    temporaryLayer.refresh();
    console.timeEnd("Create Personalized Layer");

    console.timeEnd("Total Layer Creation Time");
    return temporaryLayer;
  } catch (error) {
    console.error("Error creating personalized walkscore layer:", error);
    throw error;
  }
};

const handleRecalculate = async (
  view: MapView,
  webMap: __esri.WebMap,
  userSliderValues: { [key: string]: number },
  isDesktop: boolean,
  visibilityState: VisibilityState
): Promise<Neighborhood[]> => {
  console.time("Handle Recalculate Total Time");

  const currentExtent = view.extent.clone();
  const currentZoom = view.zoom;

  console.log("Recalculate button clicked.");

  const walkscorePointsLayer = webMap.allLayers.find((layer) => layer.title === "walkscore_fishnet_points") as FeatureLayer;
  const walkscoreNeighborhoodsLayer = webMap.allLayers.find((layer) => layer.title === "walkscore_neighborhoods") as FeatureLayer;

  if (!walkscorePointsLayer) {
    console.error("Walkscore points layer not found.");
    console.timeEnd("Handle Recalculate Total Time");
    return [];
  }

  if (!walkscoreNeighborhoodsLayer) {
    console.error("Walkscore neighborhoods layer not found.");
    console.timeEnd("Handle Recalculate Total Time");
    return [];
  }

  let personalizedPointsLayer;
  try {
    personalizedPointsLayer = await createPersonalizedWalkscoreLayer(
      walkscorePointsLayer,
      "Personalized Heatmap",
      userSliderValues,
      webMap,
      visibilityState
    );
  } catch (error) {
    console.error("Error creating personalized walkscore layer:", error);
    console.timeEnd("Handle Recalculate Total Time");
    return [];
  }

  if (!personalizedPointsLayer) {
    console.error("Failed to create personalized points layer.");
    console.timeEnd("Handle Recalculate Total Time");
    return [];
  }

  try {
    console.time("Create Personalized Heatmap Layer");
    await createHeatmapLayer(personalizedPointsLayer, "Personalized Heatmap", "personalized_walkscore", webMap, view);
    console.timeEnd("Create Personalized Heatmap Layer");
  } catch (error) {
    console.error("Error creating personalized heatmap layer:", error);
    console.timeEnd("Handle Recalculate Total Time");
    return [];
  }

  try {
    console.time("Reset Layer Visibility");
    visibilityState.resetLayerVisibility();
    visibilityState.setLayerVisible("Personalized Heatmap");
    console.timeEnd("Reset Layer Visibility");
  } catch (error) {
    console.error("Error resetting layer visibility:", error);
  }

  try {
    console.time("Create Personalized Neighborhood Layer");
    const topNeighborhoods = await createPersonalizedNeighborhoodsLayer(
      personalizedPointsLayer,
      walkscoreNeighborhoodsLayer,
      webMap,
      visibilityState
    );
    console.timeEnd("Create Personalized Neighborhood Layer");

    view.extent = currentExtent;
    view.zoom = currentZoom;

    console.timeEnd("Handle Recalculate Total Time");
    return topNeighborhoods;
  } catch (error) {
    console.error("Error creating personalized neighborhoods layer:", error);
    console.timeEnd("Handle Recalculate Total Time");
    return [];
  }
};



const WalkscoreCalculator: React.FC<{ view: MapView; webMap: __esri.WebMap }> = ({ view, webMap }) => {
  const isDesktop = useMediaQuery("(min-width: 1001px)");
  const visibilityState = new VisibilityState({ webMap }); // Create an instance of VisibilityState

  useEffect(() => {
    const initialLoad = async () => {
      try {
        // Use base case values for sliders
        const userSliderValues = { slope: 2, streets: 2, amenity: 2, crime: 2 };

        // Trigger recalculation to create a personalized walkscore layer and heatmap visualization
        await handleRecalculate(view, webMap, userSliderValues, isDesktop, visibilityState);
      } catch (error) {
        console.error("Error during initial recalculation for personalized heatmap:", error);
      }
    };

    initialLoad();
  }, [webMap, view, isDesktop]);

  return (
    <button onClick={() => handleRecalculate(view, webMap, { slope: 2, streets: 2, amenity: 2, crime: 2 }, isDesktop, visibilityState)}>
      Recalculate Walkscore
    </button>
  );
};

export default WalkscoreCalculator;
export { handleRecalculate };











