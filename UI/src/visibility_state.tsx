import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import WebMap from "@arcgis/core/WebMap";

interface VisibilityStateProps {
  webMap: WebMap;
}

class VisibilityState {
  webMap: WebMap;
  recalculateClicked: boolean;

  constructor(props: VisibilityStateProps) {
    this.webMap = props.webMap;
    this.recalculateClicked = false; // Initial state is false
  }

  // Set recalculate clicked state
  setRecalculateClicked(state: boolean): void {
    this.recalculateClicked = state;
  }

  // General method to hide all layers by title
  hideAllLayers(layerTitles: string[]): void {
    layerTitles.forEach((title) => {
      const layer = this.webMap.allLayers.find(layer => layer.title === title) as FeatureLayer;
      if (layer) {
        layer.visible = false;
      } else {
        console.warn(`(HideAllLayers)Can't hide: Layer not found: ${title}`);
      }
    });
  }

  // General method to set a specific layer visible by title
  setLayerVisible(layerTitle: string): void {
    const layer = this.webMap.allLayers.find(layer => layer.title === layerTitle) as FeatureLayer;
    if (layer) {
      layer.visible = true;
    } else {
      console.warn(`Can't set visibility: Layer not found: ${layerTitle}`);
    }
  }

  // In visibility_state.tsx
    toggleLegendVisibility(visible: boolean): void {
        const legendElement = document.querySelector(".legend-container") as HTMLElement;
        if (legendElement) {
        legendElement.style.display = visible ? 'block' : 'none';
        }
    }
    
    resetLegendVisibility(): void {
        this.toggleLegendVisibility(false);
    }

  // Method to handle visibility toggle between heatmap and neighborhood layers
    toggleLayerVisibility(isHeatmap: boolean): void {
        // Define the titles of the layers
        const baseHeatmapLayerTitle = "walkscore_fishnet_points";
        const personalizedHeatmapLayerTitle = "Personalized Heatmap";
        const baseNeighborhoodLayerTitle = "walkscore_neighborhoods";
        const personalizedNeighborhoodLayerTitle = "Personalized Neighborhood Walkscore";
    
        // Define base and personalized layers separately
        const baseLayerTitles = [
        baseHeatmapLayerTitle,
        baseNeighborhoodLayerTitle,
        ];
    
        const personalizedLayerTitles = [
        personalizedHeatmapLayerTitle,
        personalizedNeighborhoodLayerTitle,
        ];
    
        // Determine layers to hide based on recalculateClicked status
        let layersToHide = baseLayerTitles;
        if (this.recalculateClicked) {
        layersToHide = layersToHide.concat(personalizedLayerTitles);
        }
    
        // Hide the relevant layers
        this.hideAllLayers(layersToHide);
    
        console.log("Checking state of isHeatmap:", isHeatmap);
    
        // Set the correct layer to be visible based on the toggle state and recalculateClicked
        if (this.recalculateClicked) {
        // If recalculation has occurred, toggle between personalized layers
        if (isHeatmap) {
            console.log("Setting Personalized Heatmap layer to visible.");
            this.setLayerVisible(personalizedHeatmapLayerTitle);
        } else {
            console.log("Setting Personalized Neighborhood Walkscore layer to visible.");
            this.setLayerVisible(personalizedNeighborhoodLayerTitle);
        }
        } else {
        // If recalculation has not occurred, toggle between base layers
        if (isHeatmap) {
            console.log("Showing base Heatmap layer.");
            this.setLayerVisible(baseHeatmapLayerTitle);
        } else {
            console.log("Showing base Neighborhood layer.");
            this.setLayerVisible(baseNeighborhoodLayerTitle);
        }
        }
    }
  

    // Reset visibility for all key layers
    resetLayerVisibility(): void {
        const baseLayerTitles = [
        "walkscore_fishnet_points",
        "walkscore_neighborhoods",
        ];
    
        const personalizedLayerTitles = [
        "Personalized Heatmap",
        "Personalized Neighborhood Walkscore",
        ];
    
        // Hide base layers
        this.hideAllLayers(baseLayerTitles);
    
        // If recalculation has been clicked, also hide personalized layers
        if (this.recalculateClicked) {
        this.hideAllLayers(personalizedLayerTitles);
        }
    }

  // Set visibility for a specific layer type (base or personalized)
  setVisibilityForLayerType(layerType: 'baseHeatmap' | 'personalizedHeatmap' | 'neighborhood' | 'personalizedNeighborhood'): void {

    // Define layer titles for each type
    const layerTitleMap: { [key: string]: string } = {
      baseHeatmap: "walkscore_fishnet_points",
      personalizedHeatmap: "Personalized Heatmap",
      neighborhood: "walkscore_neighborhoods",
      personalizedNeighborhood: "Personalized Neighborhood Walkscore",
    };

    // Hide all layers first
    this.resetLayerVisibility();

    // Set the appropriate layer to visible
    const layerTitle = layerTitleMap[layerType];
    this.setLayerVisible(layerTitle);
  }

  // Set widget visibility
  setWidgetVisible(widgetId: string, isVisible: boolean): void {
    const widgetDiv = document.querySelector(`#${widgetId}`) as HTMLElement;
    if (widgetDiv) {
      widgetDiv.style.visibility = isVisible ? 'visible' : 'hidden';
    }
  }

  // Reset all widget visibility
  resetAllWidgets(): void {
    const widgetIds = ["sliderDiv", "legend-container"];
    widgetIds.forEach(id => this.setWidgetVisible(id, false));
  }

  // Initialize default visibility on app load
  initializeDefaultVisibility(): void {
    // Hide all layers initially
    this.resetLayerVisibility();

    // Set only the base heatmap layer to be visible
    this.setLayerVisible("walkscore_fishnet_points");
  }

  // Handle visibility for recalculation scenario
  handlePostRecalculateVisibility(): void {
    this.setRecalculateClicked(true);
    this.hideAllLayers([
      "walkscore_fishnet_points",
      "walkscore_neighborhoods",
      "Personalized Neighborhood Walkscore"
    ]);
    this.setLayerVisible("Personalized Heatmap");
  }

  // Determine if a personalized layer is available
  isPersonalizedLayerAvailable(layerTitle: string): boolean {
    const layer = this.webMap.allLayers.find(layer => layer.title === layerTitle) as FeatureLayer;
    const available = !!layer;
    return available;
  }

  // Get the currently visible layer based on recalculate state
  getCurrentVisibleLayer(): string | null {
    console.log("Getting the currently visible layer.");

    let relevantLayerTitles: string[];

    // Define relevant layers based on recalculateClicked state
    if (this.recalculateClicked) {
      // After recalculation, we care about personalized layers
      relevantLayerTitles = [
        "Personalized Heatmap",
        "Personalized Neighborhood Walkscore"
      ];
    } else {
      // Before recalculation, we only have the base layers
      relevantLayerTitles = [
        "walkscore_fishnet_points",
        "walkscore_neighborhoods"
      ];
    }

    // Iterate through relevant layers and return the visible one
    for (let title of relevantLayerTitles) {
      const layer = this.webMap.allLayers.find(layer => layer.title === title) as FeatureLayer;
      if (layer) {
        console.log(`Layer: ${title}, Visible: ${layer.visible}`);
      }
      if (layer && layer.visible) {
        console.log(`Currently visible layer: ${title}`);
        return title;
      }
    }

    console.log("No visible layer found.");
    return null; // No visible layer found
  }
}

export default VisibilityState;









