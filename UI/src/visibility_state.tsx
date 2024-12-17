import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import WebMap from "@arcgis/core/WebMap";

interface VisibilityStateProps {
  webMap: WebMap;
}

const BASE_LAYERS = {
  FISHNET: "walkscore_fishnet",
  NEIGHBORHOODS: "walkscore_neighborhoods",
};

const PERSONALIZED_LAYERS = {
  FISHNET: "personalized_walkscore_fishnet",
  NEIGHBORHOODS: "personalized_neighborhood_walkscore",
};

class VisibilityState {
  webMap: WebMap;
  recalculateClicked: boolean;

  constructor(props: VisibilityStateProps) {
    this.webMap = props.webMap;
    this.recalculateClicked = false; // Initial state is false
  }

  setRecalculateClicked(state: boolean): void {
    this.recalculateClicked = state;
  }

  hideAllLayers(layerTitles: string[]): void {
    layerTitles.forEach((title) => {
      const layer = this.webMap.allLayers.find((layer) => layer.title === title) as FeatureLayer;
      if (layer) {
        layer.visible = false;
      } else {
        console.warn(`(HideAllLayers) Can't hide: Layer not found: ${title}`);
      }
    });
  }

  setLayerVisible(layerTitle: string): void {
    const layer = this.webMap.allLayers.find((layer) => layer.title === layerTitle) as FeatureLayer;
    if (layer) {
      layer.visible = true;
    } else {
      console.warn(`Can't set visibility: Layer not found: ${layerTitle}`);
    }
  }

  toggleLayerVisibility(layerTitle: string): void {
    const excludedLayers = [
      "World Hillshade",
      "World Terrain Base",
      "World Terrain Reference",
      "citylimits"
    ]; // Add any other basemap or auxiliary layers that should always remain visible.
  
    this.webMap.allLayers.forEach((layer) => {
      if (excludedLayers.includes(layer.title)) {
        return; // Skip toggling visibility for excluded layers.
      }
  
      if (layer.title === layerTitle) {
        layer.visible = true;
      } else {
        layer.visible = false;
      }
    });
  }
  
  synchronizeStateAfterReset(): void {
    this.recalculateClicked = false;
    this.resetLayerVisibility();
    console.log("Visibility state synchronized after reset.");
  }

  resetLayerVisibility(): void {
    const baseLayerTitles = [BASE_LAYERS.FISHNET, BASE_LAYERS.NEIGHBORHOODS];
    const personalizedLayerTitles = [PERSONALIZED_LAYERS.FISHNET, PERSONALIZED_LAYERS.NEIGHBORHOODS];
    
    // Get all existing layer titles from the map
    const availableLayers = this.webMap.allLayers.map(layer => layer.title);
  
    // Filter the layers to only include the ones that exist in the map
    const layersToHide = [
      ...baseLayerTitles.filter(title => availableLayers.includes(title)),
      ...personalizedLayerTitles.filter(title => availableLayers.includes(title))
    ];
  
    // Hide only the layers that are currently present
    this.hideAllLayers(layersToHide);
  
    // Show the appropriate layers based on whether recalculation has occurred
    if (this.recalculateClicked && availableLayers.includes(PERSONALIZED_LAYERS.FISHNET)) {
      this.setLayerVisible(PERSONALIZED_LAYERS.FISHNET);
    } else if (availableLayers.includes(BASE_LAYERS.FISHNET)) {
      this.setLayerVisible(BASE_LAYERS.FISHNET);
    }
  }
  
  
  setVisibilityForLayerType(layerType: 'baseHeatmap' | 'personalizedHeatmap' | 'baseNeighborhood' | 'personalizedNeighborhood'): void {
    const layerTitleMap: { [key: string]: string } = {
      baseHeatmap: BASE_LAYERS.FISHNET,
      personalizedHeatmap: PERSONALIZED_LAYERS.FISHNET,
      baseNeighborhood: BASE_LAYERS.NEIGHBORHOODS,
      personalizedNeighborhood: PERSONALIZED_LAYERS.NEIGHBORHOODS,
    };

    this.resetLayerVisibility();

    const layerTitle = layerTitleMap[layerType];
    this.setLayerVisible(layerTitle);
  }

  setWidgetVisible(widgetId: string, isVisible: boolean): void {
    const widgetDiv = document.querySelector(`#${widgetId}`) as HTMLElement;
    if (widgetDiv) {
      widgetDiv.style.visibility = isVisible ? 'visible' : 'hidden';
    }
  }

  resetAllWidgets(): void {
    const widgetIds = ["sliderDiv", "legend-container"];
    widgetIds.forEach((id) => this.setWidgetVisible(id, false));
  }

  initializeDefaultVisibility(): void {
    this.setRecalculateClicked(false);
    this.resetLayerVisibility();
    this.setLayerVisible(BASE_LAYERS.FISHNET);
  }

  handlePostRecalculateVisibility(): void {
    this.setRecalculateClicked(true);
    this.resetLayerVisibility();
    this.setLayerVisible(PERSONALIZED_LAYERS.FISHNET);
  }
  
  isPersonalizedLayerAvailable(layerTitle: string): boolean {
    const layer = this.webMap.allLayers.find((layer) => layer.title === layerTitle) as FeatureLayer;
    return !!layer;
  }

  getCurrentVisibleLayer(): string | null {
    const relevantLayerTitles = this.recalculateClicked
      ? [PERSONALIZED_LAYERS.FISHNET, PERSONALIZED_LAYERS.NEIGHBORHOODS]
      : [BASE_LAYERS.FISHNET, BASE_LAYERS.NEIGHBORHOODS];

    for (const title of relevantLayerTitles) {
      const layer = this.webMap.allLayers.find((layer) => layer.title === title) as FeatureLayer;
      if (layer && layer.visible) {
        return title;
      }
    }

    return null;
  }
}

export default VisibilityState;











