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

    // Create the new temporary personalized layer
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
      popupTemplate: popupTemplate,
    });
    

    // Add the personalized layer to the map
    webMap.add(temporaryLayer);

    await temporaryLayer.when();
    temporaryLayer.refresh();

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
  visibilityState: VisibilityState // Inject visibilityState
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

  // Step 1: Create the personalized walkscore layer
  console.log("Creating personalized walkscore layer...");
  const personalizedPointsLayer = await createPersonalizedWalkscoreLayer(
    walkscorePointsLayer,
    "Personalized Heatmap",
    userSliderValues,
    webMap,
    visibilityState
  );

  if (personalizedPointsLayer) {
    // Step 2: Create the personalized heatmap layer
    console.log("Creating personalized heatmap layer...");
    await createHeatmapLayer(personalizedPointsLayer, "Personalized Heatmap", "personalized_walkscore", webMap, view);

    // Step 3: Reset visibility of all layers after creating new layers
    console.log("Resetting visibility for all layers before updating visibility state.");
    visibilityState.resetLayerVisibility();

    // Step 4: Set personalized heatmap layer to be visible
    visibilityState.setLayerVisible("Personalized Heatmap");

    // Step 5: Create personalized neighborhoods layer and get the top neighborhoods
    const topNeighborhoods = await createPersonalizedNeighborhoodsLayer(personalizedPointsLayer, walkscoreNeighborhoodsLayer, webMap, visibilityState);

    // Ensure the base neighborhood layer is still hidden
    // visibilityState.setLayerHidden("walkscore_neighborhoods");

    // Step 6: Restore the view to its original state
    view.extent = currentExtent;
    view.zoom = currentZoom;
    return topNeighborhoods; // Return the recalculated top neighborhoods
  }

  return [];
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











