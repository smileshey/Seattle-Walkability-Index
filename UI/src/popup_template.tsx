import PopupTemplate from "@arcgis/core/PopupTemplate";

// Neighborhood Popup Template
export const neighborhoodPopupTemplate = new PopupTemplate({
  title: "Neighborhood Info",
  content: [
    {
      type: "fields", // Specify that you want to show fields
      fieldInfos: [
        { fieldName: "OBJECTID", label: "Object ID" },
        { fieldName: "nested", label: "Nested" },
        // { fieldName: "business_density", label: "Business Density" },
        // { fieldName: "amenity_density", label: "Amenity Density" },
        // { fieldName: "tree_density", label: "Tree Density" },
        { fieldName: "rank_normalized_walkscore", label: "Rank Normalized Walkscore" },
        { fieldName: "personalized_walkscore", label: "Personalized Walkscore" },
      ]
    }
  ]
});

// Fishnet Popup Template
export const fishnetPopupTemplate = new PopupTemplate({
  title: "Fishnet Info",
  content: [
    {
      type: "fields", // Specify that you want to show fields
      fieldInfos: [
        { fieldName: "OID", label: "OID" },
        { fieldName: "nested", label: "Nested" },
        { fieldName: "Max_Speed_Limit", label: "Max Speed Limit" },
        { fieldName: "effective_slope", label: "Effective Slope" },
        { fieldName: "business_density", label: "Business Density" },
        { fieldName: "crash_density_scaler", label: "Crash Density Scaler" },
        { fieldName: "effective_speed_limit_scaler", label: "Speed Scaler" },
        { fieldName: "crime_density_scaler", label: "Crime Scaler" },
        { fieldName: "walk_score", label: "Walk Score" },
        { fieldName: "personalized_walkscore", label: "Personalized Walkscore" },
      ]
    }
  ]
});



  