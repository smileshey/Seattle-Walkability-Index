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
import { getTopNeighborhoods, Neighborhood } from "./neighborhood_utils";
import { createHeatmapLayer } from './heatmap_render'; // Update the import here to 'createHeatmapLayer'

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
        ? (baseWalkscore * slopeScaler * effectiveSpeedLimitScaler * businessDensityScaler * crimeDensityScaler * crashDensityScaler) + 0.001 // Adding 0.001 to ensure non-zero scores
        : 0.001; // Setting a minimum value of 0.001
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

const handleRecalculate = async (
  view: MapView,
  webMap: __esri.WebMap,
  userSliderValues: { [key: string]: number },
  isDesktop: boolean
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
    // Hide original walkscore points layer
    walkscorePointsLayer.visible = false;
    console.log("Hiding original walkscore points layer.");

    // Generate the heatmap visualization based on the personalized scores
    console.log("Creating personalized heatmap layer...");
    await createHeatmapLayer(personalizedPointsLayer, "Personalized Heatmap", "personalized_walkscore", webMap, view);

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
  const isDesktop = useMediaQuery("(min-width: 1001px)");

  useEffect(() => {
    const initialLoad = async () => {
      try {
        console.log("Initial load: Triggering recalculation to generate personalized heatmap visualization.");

        // Use base case values for sliders
        const userSliderValues = { slope: 2, streets: 2, amenity: 2, crime: 2 };

        // Trigger recalculation to create a personalized walkscore layer and heatmap visualization
        await handleRecalculate(view, webMap, userSliderValues, isDesktop);
        console.log("Personalized heatmap and walkscore layers created successfully on initial load.");

      } catch (error) {
        console.error("Error during initial recalculation for personalized heatmap:", error);
      }
    };

    initialLoad();
  }, [webMap, view, isDesktop]);

  return (
    <button onClick={() => handleRecalculate(view, webMap, { slope: 2, streets: 2, amenity: 2, crime: 2 }, isDesktop)}>
      Recalculate Walkscore
    </button>
  );
};

export default WalkscoreCalculator;
export { handleRecalculate };










