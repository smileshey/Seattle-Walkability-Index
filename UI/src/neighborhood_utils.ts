import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Field from "@arcgis/core/layers/support/Field";
import Color from "@arcgis/core/Color";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Graphic from "@arcgis/core/Graphic";
import Collection from "@arcgis/core/core/Collection";
import PopupTemplate from "@arcgis/core/PopupTemplate";

export const aggregateScoresByNeighborhood = (features: __esri.Graphic[]) => {
  const scoresByNeighborhood: { [key: string]: number } = {};

  features.forEach((feature) => {
    const attributes = feature.attributes;
    const neighborhoodId = attributes.nested;
    if (neighborhoodId != null) {
      if (!scoresByNeighborhood[neighborhoodId]) {
        scoresByNeighborhood[neighborhoodId] = 0;
      }
      scoresByNeighborhood[neighborhoodId] += attributes.personalized_walkscore || 0;
    }
  });
  return scoresByNeighborhood;
};

export const normalizeScoresByArea = (features: __esri.Graphic[], scoresByNeighborhood: { [key: string]: number }, exponent: number) => {
  features.forEach((feature) => {
    const neighborhoodId = feature.attributes["nested"];
    const totalArea = feature.attributes["neighborhood_area"];
    let normalizedScore = scoresByNeighborhood[neighborhoodId] || 0;

    if (totalArea > 0) {
      normalizedScore /= Math.pow(totalArea, exponent); // Power normalization
    }

    feature.attributes["personalized_walkscore"] = normalizedScore;
  });
};

export const rankNormalizeAndScaleScores = (features: __esri.Graphic[]) => {
  const scores = features.map(f => f.attributes["personalized_walkscore"]);
  const sortedUniqueScores = Array.from(new Set(scores)).sort((a, b) => a - b);

  const rankMap = new Map<number, number>();
  sortedUniqueScores.forEach((score, index) => {
    rankMap.set(score, index + 1);
  });

  const minRank = 1;
  const maxRank = sortedUniqueScores.length;

  features.forEach((feature) => {
    const rawScore = feature.attributes["personalized_walkscore"];
    const rank = rankMap.get(rawScore);
    if (rank !== undefined) {
      const scaledScore = ((rank - minRank) / (maxRank - minRank)) * 5;
      feature.attributes["personalized_walkscore"] = scaledScore;
    }
  });
};

export const createPersonalizedNeighborhoodsLayer = async (
  fishnetLayer: FeatureLayer,
  neighborhoodsLayer: FeatureLayer,
  webMap: __esri.WebMap
): Promise<Neighborhood[]> => {
  try {
    const query = fishnetLayer.createQuery();
    query.where = "1=1";
    query.outFields = ["nested", "personalized_walkscore"];
    query.returnGeometry = false;

    const result = await fishnetLayer.queryFeatures(query);
    const scoresByNeighborhood = aggregateScoresByNeighborhood(result.features);

    const neighborhoodsQuery = neighborhoodsLayer.createQuery();
    neighborhoodsQuery.where = "city = 'Seattle'";
    neighborhoodsQuery.outFields = ["*"];
    neighborhoodsQuery.returnGeometry = true;

    const neighborhoodsResult = await neighborhoodsLayer.queryFeatures(neighborhoodsQuery);

    normalizeScoresByArea(neighborhoodsResult.features, scoresByNeighborhood,.8);
    rankNormalizeAndScaleScores(neighborhoodsResult.features);

    // Get the existing fields
    const existingFieldNames = new Set(neighborhoodsLayer.fields.map(field => field.name));

    // Filter to add only non-duplicate fields
    const additionalFields = [
      new Field({
        name: "personalized_walkscore",
        alias: "Personalized Walkscore",
        type: "double"
      })
    ].filter(field => !existingFieldNames.has(field.name)); // Prevent duplicates

    const allFields = neighborhoodsLayer.fields.concat(additionalFields);

    const intervals = [0, 1, 2, 3, 4, 5];

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

    const fillSymbol = new SimpleFillSymbol({
      color: "transparent",
      outline: {
        color: "grey",
        width: 0.1
      }
    });

    const renderer = new SimpleRenderer({
      symbol: fillSymbol,
      visualVariables: [colorVisVar]
    });

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

    const title = "Personalized Neighborhood Walkscore";

    // Remove the old personalized neighborhood layer if it exists
    let personalizedLayer = webMap.allLayers.find(layer => layer.title === title) as FeatureLayer;
    if (personalizedLayer) {
      webMap.remove(personalizedLayer);
    }

    // Create the new personalized neighborhood layer
    personalizedLayer = new FeatureLayer({
      source: new Collection(neighborhoodsResult.features.map(feature => new Graphic({
        geometry: feature.geometry,
        attributes: feature.attributes
      }))),
      fields: allFields,
      objectIdField: neighborhoodsLayer.objectIdField,
      geometryType: neighborhoodsLayer.geometryType,
      spatialReference: neighborhoodsLayer.spatialReference,
      title: title,
      renderer: renderer,
      popupTemplate: popupTemplate
    });

    webMap.add(personalizedLayer);

    await personalizedLayer.when();
    personalizedLayer.refresh();

    // Return the top neighborhoods
    return getTopNeighborhoods(personalizedLayer, "personalized_walkscore");
  } catch (error) {
    console.error("Error creating personalized neighborhoods layer:", error);
    throw error;
  }
};


export const getTopNeighborhoods = async (layer: FeatureLayer, field: string): Promise<Neighborhood[]> => {
  const query = layer.createQuery();
  query.where = "1=1";
  query.outFields = ["nested", field, "latitude", "longitude"];
  query.orderByFields = [`${field} DESC`];
  query.num = 12; // Fetch more results to allow for filtering
  query.returnGeometry = false;

  const excluded_nhoods = ['Sand Point', 'Discovery Park', 'Seward Park', 'University of Washington', 'Centennial Park', 'Pike-Market'];

  try {
      const neighborhoodsResult = await layer.queryFeatures(query);
      
      console.log("Fetched neighborhoods");

      const topNeighborhoods = neighborhoodsResult.features
          .map(feature => ({
              name: feature.attributes["nested"],
              score: feature.attributes[field],
              latitude: feature.attributes["latitude"],
              longitude: feature.attributes["longitude"],
          }))
          .filter(nhood => !excluded_nhoods.includes(nhood.name)) // Exclude specified neighborhoods
          .sort((a, b) => b.score - a.score)
          .slice(0, 5); // Top 5 neighborhoods

      console.log("Top neighborhoods");

      return topNeighborhoods;
  } catch (error) {
      console.error("Error creating top neighborhoods list:", error);
      throw error;
  }
};

// Define the Neighborhood interface
export interface Neighborhood {
  name: string;
  score: number;
  latitude?: number;  // Make optional if not always present
  longitude?: number; // Make optional if not always present
}








