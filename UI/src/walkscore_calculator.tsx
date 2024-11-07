import React, { useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import Color from "@arcgis/core/Color";
import { SimpleFillSymbol } from "@arcgis/core/symbols";
import Field from "@arcgis/core/layers/support/Field";
import Graphic from "@arcgis/core/Graphic";
import Collection from "@arcgis/core/core/Collection";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import { getSlopeScaler, getEffectiveSpeedLimitScaler, getBusinessDensityScaler, getCrimeDensityScaler } from "./scaler_calculations";
import { createPersonalizedNeighborhoodsLayer, rankNormalizeAndScaleScores } from "./neighborhood_utils";
import TopNeighborhoods from "./top_neighborhoods";
import { getTopNeighborhoods, Neighborhood } from './neighborhood_utils'; // Ensure this import exists

interface FeatureAttributes {
  effective_slope: number;
  business_density: number;
  Max_Speed_Limit: number;
  neighborhood_crime_density: number;
  unadjusted_walkscore: number;
  walk_score: number;
  personalized_walkscore?: number;
  slope_scaler?: number;
  effective_speed_limit_scaler?: number;
  business_density_scaler?: number;
  crime_density_scaler?: number;
  [key: string]: any;
}

const getFixedIntervals = () => {
  return [0, 1, 2, 3, 4, 5];
};

export const calculateScalerSums = (features: __esri.Graphic[]) => {
  let sumSlope = 0;
  let sumSpeedLimit = 0;
  let sumBusinessDensity = 0;
  let sumCrimeDensity = 0;
  let totalScalerSum = 0;

  features.forEach((graphic, index) => {
    const attributes = graphic.attributes as FeatureAttributes;

    const slopeScaler = attributes.slope_scaler || 1;
    const effectiveSpeedLimitScaler = attributes.effective_speed_limit_scaler || 1;
    const businessDensityScaler = attributes.business_density_scaler || 1;
    const crimeDensityScaler = attributes.crime_density_scaler || 1;

    sumSlope += slopeScaler;
    sumSpeedLimit += effectiveSpeedLimitScaler;
    sumBusinessDensity += businessDensityScaler;
    sumCrimeDensity += crimeDensityScaler;

    totalScalerSum += slopeScaler + effectiveSpeedLimitScaler + businessDensityScaler + crimeDensityScaler;
  });

  console.log("Sum of Slope Scaler:", sumSlope);
  console.log("Sum of Speed Limit Scaler:", sumSpeedLimit);
  console.log("Sum of Business Density Scaler:", sumBusinessDensity);
  console.log("Sum of Crime Density Scaler:", sumCrimeDensity);
  console.log("Total Scaler Sum:", totalScalerSum);
};

const createPersonalizedWalkscoreLayer = async (
  originalLayer: FeatureLayer,
  title: string,
  userSliderValues: { [key: string]: number },
  webMap: __esri.WebMap
) => {
  try {
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
    allFeatures.forEach((graphic) => {
      const attributes = graphic.attributes as FeatureAttributes;
    
      const slopeScaler = getSlopeScaler(attributes.effective_slope, userSliderValues.slope);
      const effectiveSpeedLimitScaler = getEffectiveSpeedLimitScaler(attributes.Max_Speed_Limit, userSliderValues.sidewalk);
      const businessDensityScaler = getBusinessDensityScaler(attributes.business_density, userSliderValues.amenity);
      const crimeDensityScaler = getCrimeDensityScaler(attributes.neighborhood_crime_density, userSliderValues.crime);
    
      attributes.slope_scaler = slopeScaler;
      attributes.effective_speed_limit_scaler = effectiveSpeedLimitScaler;
      attributes.business_density_scaler = businessDensityScaler;
      attributes.crime_density_scaler = crimeDensityScaler;
    
      const baseWalkscore = attributes.unadjusted_walkscore;
      attributes.personalized_walkscore = baseWalkscore 
        ? baseWalkscore * slopeScaler * effectiveSpeedLimitScaler * businessDensityScaler * crimeDensityScaler
        : 0;
    });

    calculateScalerSums(allFeatures); // Log the sums after personalization

    rankNormalizeAndScaleScores(allFeatures);

    const intervals = getFixedIntervals();

    const colorVisVar = {
      type: "color",
      field: "personalized_walkscore",
      stops: [
        { value: intervals[1] - 0.00001, color: new Color([230, 238, 207, .7]) },
        { value: intervals[2] - 0.00001, color: new Color([155, 196, 193, .7]) },
        { value: intervals[3] - 0.00001, color: new Color([105, 168, 183, .7]) },
        { value: intervals[4] - 0.00001, color: new Color([75, 126, 152, .7]) },
        { value: intervals[5], color: new Color([46, 85, 122, .7]) }
      ]
    };

    const renderer = new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: "transparent",
        outline: {
          color: "transparent",
          width: 0.1
        }
      }),
      visualVariables: [colorVisVar]
    });

    const allFields = originalLayer.fields.concat([
      new Field({
        name: "personalized_walkscore",
        alias: "Personalized Walkscore",
        type: "double"
      })
    ]);

    const popupTemplate = new PopupTemplate({
      title: "{Name}",
      content: [
        {
          type: "fields",
          fieldInfos: allFields.map(field => ({
            fieldName: field.name,
            label: field.alias || field.name
          }))
        }
      ]
    });

    // Remove the old personalized layer if it exists
    let temporaryLayer = webMap.allLayers.find(layer => layer.title === title) as FeatureLayer;
    if (temporaryLayer) {
      webMap.remove(temporaryLayer);
    }

    // Create the new temporary personalized layer
    temporaryLayer = new FeatureLayer({
      source: new Collection(allFeatures.map(feature => new Graphic({
        geometry: feature.geometry,
        attributes: feature.attributes
      }))),
      fields: allFields,
      objectIdField: originalLayer.objectIdField,
      geometryType: originalLayer.geometryType,
      spatialReference: originalLayer.spatialReference,
      title: title,
      renderer: renderer,
      popupTemplate: popupTemplate
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
  userSliderValues: { [key: string]: number }
): Promise<Neighborhood[]> => {
  const currentExtent = view.extent.clone();
  const currentZoom = view.zoom;

  const walkscoreFishnetLayer = webMap.allLayers.find(layer => layer.title === "walkscore_fishnet") as FeatureLayer;
  const walkscoreNeighborhoodsLayer = webMap.allLayers.find(layer => layer.title === "walkscore_neighborhoods") as FeatureLayer;
  let personalizedNeighborhoodLayer = webMap.allLayers.find(layer => layer.title === "Personalized Neighborhood Walkscore") as FeatureLayer;

  if (!walkscoreFishnetLayer || !walkscoreNeighborhoodsLayer) {
    console.error("Required layers not found");
    return [];
  }

  walkscoreFishnetLayer.visible = false;
  walkscoreNeighborhoodsLayer.visible = false;
  if (personalizedNeighborhoodLayer) {
    personalizedNeighborhoodLayer.visible = false;
  }

  const personalizedFishnetLayer = await createPersonalizedWalkscoreLayer(
    walkscoreFishnetLayer,
    "Personalized Walkscore",
    userSliderValues,
    webMap
  );

  if (personalizedFishnetLayer) {
    await createPersonalizedNeighborhoodsLayer(personalizedFishnetLayer, walkscoreNeighborhoodsLayer, webMap);
    personalizedNeighborhoodLayer = webMap.allLayers.find(layer => layer.title === "Personalized Neighborhood Walkscore") as FeatureLayer;

    if (personalizedNeighborhoodLayer) {
      personalizedFishnetLayer.visible = false;
      personalizedNeighborhoodLayer.visible = true;
    }
  }

  // Fetch top neighborhoods with their coordinates
  const topNeighborhoods: Neighborhood[] = await getTopNeighborhoods(personalizedNeighborhoodLayer, 'personalized_walkscore');

  view.extent = currentExtent;
  view.zoom = currentZoom;

  return topNeighborhoods; // Return the data array
};

const WalkscoreCalculator: React.FC<{ view: MapView; webMap: __esri.WebMap }> = ({ view, webMap }) => {
  useEffect(() => {
    const initialLoad = async () => {
      const walkscoreFishnetLayer = webMap.allLayers.find(layer => layer.title === "walkscore_fishnet") as FeatureLayer;
      if (walkscoreFishnetLayer) {
        const query = walkscoreFishnetLayer.createQuery();
        query.where = "1=1";
        query.returnGeometry = true;
        query.outFields = ["*"];

        const result = await walkscoreFishnetLayer.queryFeatures(query);

        if (result && result.features) {
          console.log("Initial scaler sums (before personalization):");
          calculateScalerSums(result.features);
        }
      }
    };

    initialLoad();
  }, [webMap]);

  return (
    <button onClick={() => handleRecalculate(view, webMap, { slope: 2, sidewalk: 2, amenity: 2, crime: 2 })}>
      Recalculate Walkscore
    </button>
  );
};

export default WalkscoreCalculator;
export { handleRecalculate };


































































