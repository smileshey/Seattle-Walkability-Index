import PopupTemplate from "@arcgis/core/PopupTemplate";

// Neighborhood Popup Template
export const neighborhoodPopupTemplate = new PopupTemplate({
  title: "Walkscore Info",
  content: [
    {
      type: "fields", // Specify that you want to show fields
      fieldInfos: [
        { fieldName: "OBJECTID", label: "ObjectID" },
        { fieldName: "nested", label: "Neighborhood" },
        { fieldName: "rank_normalized_walkscore", label: "Rank Normalized Walkscore" },
        { fieldName: "personalized_walkscore", label: "Personalized Walkscore" },
      ]
    }
  ]
});

// Fishnet Popup Template
export const fishnetPopupTemplate = new PopupTemplate({
  title: "Walkscore Info",
  content: [
    {
      type: "fields", // Specify that you want to show fields
      fieldInfos: [
        { fieldName: "OBJECTID", label: "OBJECTID"},
        { fieldName: "nested", label: "Neighborhood"},
        { fieldName: "effective_slope", label: "Effective Slope"},
        { fieldName: "crash_density_scaler", label: "Crash Density Scaler"},
        { fieldName: "business_density_scaler", label: "Business Density Scaler"},
        { fieldName: "effective_speed_limit_scaler", label: "Speed Scaler"},
        { fieldName: "slope_scaler", label: "Slope Scaler"},
        { fieldName: "crime_density_scaler", label: "Crime Scaler"},
        { fieldName: "walk_score", label: "Walk Score"},
        { fieldName: "personalized_walkscore", label: "Personalized Walkscore"},
      ]
    }
  ]
});



  