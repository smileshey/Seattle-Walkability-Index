import React, { useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import Field from "@arcgis/core/layers/support/Field";
import Graphic from "@arcgis/core/Graphic";
import Collection from "@arcgis/core/core/Collection";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import { neighborhoodPopupTemplate, fishnetPopupTemplate } from "./popup_template";
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
import VisibilityState from "./visibility_state"; // Import VisibilityState class
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Color from "@arcgis/core/Color";

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

const BASE_LAYERS = {
  FISHNET: "walkscore_fishnet",
  NEIGHBORHOODS: "walkscore_neighborhoods",
};

const PERSONALIZED_LAYERS = {
  FISHNET: "personalized_walkscore_fishnet",
  NEIGHBORHOODS: "personalized_neighborhood_walkscore",
};

const createPersonalizedWalkscoreLayer = async (
  originalLayer: FeatureLayer,
  title: string,
  userSliderValues: { [key: string]: number },
  webMap: __esri.WebMap,
  visibilityState: VisibilityState
) => {
  try {
    const preNormalizationScores: number[] = [];

    // Query features from the original layer
    const query = originalLayer.createQuery();
    query.where = "1=1";
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.maxRecordCountFactor = 5;
    query.start = 0;
    query.num = 2000;

    const allFeatures: __esri.Graphic[] = [];
    let result: __esri.FeatureSet | undefined;

    do {
      result = await originalLayer.queryFeatures(query);
      if (result && result.features) {
        allFeatures.push(...result.features);
        query.start += query.num;
      } else {
        console.warn(
          `Query returned no features starting at index ${query.start}.`
        );
        break;
      }
    } while (result.features.length === query.num);

    // Recalculate scalers
    allFeatures.forEach((graphic) => {
      const attributes = graphic.attributes as FeatureAttributes;

      // Use precomputed scalers if the corresponding slider value is 2, otherwise calculate
      const slopeScaler =
        userSliderValues.slope === 2
          ? attributes.slope_scaler || 1 // Default to 1 if undefined
          : getSlopeScaler(attributes.effective_slope, userSliderValues.slope);

      const effectiveSpeedLimitScaler =
        userSliderValues.streets === 2
          ? attributes.effective_speed_limit_scaler || 1 // Default to 1 if undefined
          : getEffectiveSpeedLimitScaler(
              attributes.Max_Speed_Limit,
              userSliderValues.streets
            );

      const businessDensityScaler =
        userSliderValues.amenity === 2
          ? attributes.business_density_scaler || 1 // Default to 1 if undefined
          : getBusinessDensityScaler(
              attributes.business_density,
              userSliderValues.amenity
            );

      const crimeDensityScaler =
        userSliderValues.crime === 2
          ? attributes.crime_density_scaler || 1 // Default to 1 if undefined
          : getCrimeDensityScaler(
              attributes.crime_density_normalized,
              userSliderValues.crime
            );

      const crashDensityScaler =
        userSliderValues.streets === 2
          ? attributes.crash_density_scaler || 1 // Default to 1 if undefined
          : getCrashDensityScaler(
              attributes.crash_density_normalized,
              userSliderValues.streets
            );

      // Update attributes with scalers (only necessary for recalculated ones)
      if (userSliderValues.slope !== 2) attributes.slope_scaler = slopeScaler;
      if (userSliderValues.streets !== 2) {
        attributes.effective_speed_limit_scaler = effectiveSpeedLimitScaler;
        attributes.crash_density_scaler = crashDensityScaler;
      }
      if (userSliderValues.amenity !== 2)
        attributes.business_density_scaler = businessDensityScaler;
      if (userSliderValues.crime !== 2)
        attributes.crime_density_scaler = crimeDensityScaler;

      // Recalculate the personalized walkscore
      const maxPositiveScore = 0.00006;
      const baseWalkscore = attributes.unadjusted_walkscore || 0;
      const normalizedPositive = baseWalkscore / maxPositiveScore;

      attributes.personalized_walkscore = parseFloat(
        (
          normalizedPositive *
          slopeScaler *
          effectiveSpeedLimitScaler *
          businessDensityScaler *
          crimeDensityScaler *
          crashDensityScaler +
          0.001
        ).toFixed(2)
      );

      if (attributes.personalized_walkscore < 0.01) {
        attributes.personalized_walkscore = 0.01;
      }

      preNormalizationScores.push(attributes.personalized_walkscore);
    });

    // Normalize and scale the scores
    rankNormalizeAndScaleScores(allFeatures);

    // Collect distribution after normalization
    const postNormalizationScores: number[] = allFeatures.map(
      (g) => g.attributes.personalized_walkscore
    );

    // Define visualization
    const intervals = [0, 20, 40, 60, 80, 100];
    const colorVisVar = {
      type: "color",
      field: "personalized_walkscore",
      stops: [
        { value: intervals[1], color: new Color([255, 0, 0, 0.3]) }, // Red
        { value: intervals[2], color: new Color([255, 165, 0, 0.3]) }, // Orange
        { value: intervals[3], color: new Color([255, 255, 0, 0.3]) }, // Yellow
        { value: intervals[4], color: new Color([144, 238, 144, 0.3]) }, // Light Green
        { value: intervals[5], color: new Color([0, 128, 0, 0.3]) }, // Green
      ],
    };

    const renderer = new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: "transparent",
        outline: {
          color: "transparent",
          width: 0.0,
        },
      }),
      visualVariables: [colorVisVar],
    });

    // Ensure old temporary layer is removed
    const existingLayer = webMap.allLayers.find(
      (layer) => layer.title === title
    ) as FeatureLayer;
    if (existingLayer) {
      console.log(`Removing existing temporary layer: ${title}`);
      webMap.remove(existingLayer);
    }

    // Create new temporary layer
    const temporaryLayer = new FeatureLayer({
      source: new Collection(
        allFeatures.map((feature) => {
          const filteredAttributes = {
            IndexID: feature.attributes.IndexID,
            nested: feature.attributes.nested,
            walk_score: feature.attributes.walk_score,
            personalized_walkscore:
              feature.attributes.personalized_walkscore.toFixed(2),
          };

          return new Graphic({
            geometry: feature.geometry,
            attributes: filteredAttributes,
          });
        })
      ),
      fields: [
        ...originalLayer.fields,
        new Field({
          name: "personalized_walkscore",
          alias: "Personalized Walkscore",
          type: "double",
        }),
      ],
      objectIdField: "OBJECTID",
      geometryType: originalLayer.geometryType,
      spatialReference: originalLayer.spatialReference,
      title: title,
      renderer: renderer,
      popupTemplate: fishnetPopupTemplate,
    });

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
  visibilityState: VisibilityState
): Promise<Neighborhood[]> => {
  const currentExtent = view.extent.clone();
  const currentZoom = view.zoom;

  console.log("Recalculate button clicked.");

  // Retrieve required layers
  const walkscoreLayer = webMap.allLayers.find(
    (layer) => layer.title === BASE_LAYERS.FISHNET
  ) as FeatureLayer;
  const walkscoreNeighborhoodsLayer = webMap.allLayers.find(
    (layer) => layer.title === BASE_LAYERS.NEIGHBORHOODS
  ) as FeatureLayer;

  if (!walkscoreLayer || !walkscoreNeighborhoodsLayer) {
    console.error(
      "Required layers are missing. Ensure 'walkscore_fishnet' and 'walkscore_neighborhoods' are added to the map."
    );
    return [];
  }

  // Remove existing temporary layers to avoid memory issues
  const tempLayersToRemove = [
    PERSONALIZED_LAYERS.FISHNET,
    PERSONALIZED_LAYERS.NEIGHBORHOODS,
  ];

  tempLayersToRemove.forEach((tempLayerTitle) => {
    const tempLayer = webMap.allLayers.find(
      (layer) => layer.title === tempLayerTitle
    ) as FeatureLayer;
    if (tempLayer) {
      console.log(`Removing temporary layer: ${tempLayerTitle}`);
      webMap.remove(tempLayer);
    }
  });

  // Create personalized walkscore layer
  let personalizedWalkscoreLayer;
  try {
    personalizedWalkscoreLayer = await createPersonalizedWalkscoreLayer(
      walkscoreLayer,
      PERSONALIZED_LAYERS.FISHNET,
      userSliderValues,
      webMap,
      visibilityState
    );
  } catch (error) {
    console.error("Error creating personalized walkscore layer:", error);
    return [];
  }

  if (!personalizedWalkscoreLayer) {
    console.error("Failed to create personalized walkscore layer.");
    return [];
  }

  // Reset visibility and display the personalized layer
  try {
    visibilityState.resetLayerVisibility();
    visibilityState.setLayerVisible(PERSONALIZED_LAYERS.FISHNET);
  } catch (error) {
    console.error("Error resetting layer visibility:", error);
  }

  // Generate personalized neighborhoods layer
  try {
    const topNeighborhoods = await createPersonalizedNeighborhoodsLayer(
      personalizedWalkscoreLayer,
      walkscoreNeighborhoodsLayer,
      webMap,
      visibilityState
    );

    // Restore original view state
    view.extent = currentExtent;
    view.zoom = currentZoom;

    return topNeighborhoods;
  } catch (error) {
    console.error("Error creating personalized neighborhoods layer:", error);
    return [];
  }
};

console.debug("Custom Build Tag: 2025-XYZ-run-unique");

const WalkscoreCalculator: React.FC<{ view: MapView; webMap: __esri.WebMap }> = ({
  view,
  webMap,
}) => {
  const isDesktop = useMediaQuery("(min-width: 1001px)");
  const visibilityState = new VisibilityState({ webMap }); // Create an instance of VisibilityState

  useEffect(() => {
    const initialLoad = async () => {
      try {
        // Use base case values for sliders
        const userSliderValues = {
          slope: 2,
          streets: 2,
          amenity: 2,
          crime: 2,
        };

        // Trigger recalculation to create a personalized walkscore layer visualization
        await handleRecalculate(view, webMap, userSliderValues, isDesktop, visibilityState);
      } catch (error) {
        console.error("Error during initial recalculation for personalized walkscore:", error);
      }
    };

    initialLoad();
  }, [webMap, view, isDesktop]);

  return (
    <button
      onClick={() =>
        handleRecalculate(
          view,
          webMap,
          { slope: 2, streets: 2, amenity: 2, crime: 2 },
          isDesktop,
          visibilityState
        )
      }
    >
      Recalculate Walkscore
    </button>
  );
};

export default WalkscoreCalculator;
export { handleRecalculate };