import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import WebMap from "@arcgis/core/WebMap";

interface VisibilityStateProps {
  webMap: WebMap;
}

class VisibilityState {
  webMap: WebMap;

  constructor(props: VisibilityStateProps) {
    this.webMap = props.webMap;
  }

  // General method to hide all layers by title
  hideAllLayers(layerTitles: string[]): void {
    layerTitles.forEach((title) => {
      const layer = this.webMap.allLayers.find(layer => layer.title === title) as FeatureLayer;
      if (layer) {
        layer.visible = false;
        console.log(`Setting visibility to false for: ${layer.title}`);
      } else {
        console.warn(`Layer not found: ${title}`);
      }
    });
  }

  // General method to set a specific layer visible by title
  setLayerVisible(layerTitle: string): void {
    const layer = this.webMap.allLayers.find(layer => layer.title === layerTitle) as FeatureLayer;
    if (layer) {
      layer.visible = true;
      console.log(`Setting visibility to true for: ${layer.title}`);
    } else {
      console.warn(`Layer not found: ${layerTitle}`);
    }
  }

  // Method to handle visibility toggle between heatmap and neighborhood layers
  toggleLayerVisibility(isHeatmap: boolean): void {
    // Define the titles of the layers
    const baseHeatmapLayerTitle = "walkscore_fishnet_points";
    const personalizedHeatmapLayerTitle = "Personalized Heatmap";
    const baseNeighborhoodLayerTitle = "walkscore_neighborhoods";
    const personalizedNeighborhoodLayerTitle = "Personalized Neighborhood Walkscore";

    // Hide all relevant layers first
    this.hideAllLayers([
      baseHeatmapLayerTitle,
      personalizedHeatmapLayerTitle,
      baseNeighborhoodLayerTitle,
      personalizedNeighborhoodLayerTitle
    ]);

    // Set the correct layer to be visible based on the toggle state
    if (isHeatmap) {
      if (this.isPersonalizedLayerAvailable("Personalized Heatmap")) {
        this.setLayerVisible(personalizedHeatmapLayerTitle);
      } else {
        this.setLayerVisible(baseHeatmapLayerTitle);
      }
    } else {
      if (this.isPersonalizedLayerAvailable("Personalized Neighborhood Walkscore")) {
        this.setLayerVisible(personalizedNeighborhoodLayerTitle);
      } else {
        this.setLayerVisible(baseNeighborhoodLayerTitle);
      }
    }
  }

  // Reset visibility for all key layers
  resetLayerVisibility(): void {
    const allLayerTitles = [
      "walkscore_fishnet_points",
      "Personalized Heatmap",
      "walkscore_neighborhoods",
      "Personalized Neighborhood Walkscore"
    ];

    // Hide all layers
    this.hideAllLayers(allLayerTitles);
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
      console.log(`Setting visibility to ${isVisible ? 'visible' : 'hidden'} for widget: ${widgetId}`);
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
    this.hideAllLayers([
      "walkscore_fishnet_points",
      "walkscore_neighborhoods",
      "Personalized Neighborhood Walkscore"
    ]);

    // Set personalized heatmap layer to visible
    this.setLayerVisible("Personalized Heatmap");
  }

  // Determine if a personalized layer is available
  isPersonalizedLayerAvailable(layerTitle: string): boolean {
    const layer = this.webMap.allLayers.find(layer => layer.title === layerTitle) as FeatureLayer;
    return !!layer;
  }

  // Get the currently visible layer
  getCurrentVisibleLayer(): string | null {
    const allLayerTitles = [
      "walkscore_fishnet_points",
      "Personalized Heatmap",
      "walkscore_neighborhoods",
      "Personalized Neighborhood Walkscore"
    ];

    for (let title of allLayerTitles) {
      const layer = this.webMap.allLayers.find(layer => layer.title === title) as FeatureLayer;
      if (layer && layer.visible) {
        return title;
      }
    }

    return null; // No visible layer found
  }
}

export default VisibilityState;






