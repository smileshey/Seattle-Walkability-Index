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

  toggleLayerVisibility(showFishnet: boolean) {
    const layerToShow = showFishnet ? BASE_LAYERS.FISHNET : BASE_LAYERS.NEIGHBORHOODS;
    const personalizedLayerToShow = showFishnet ? PERSONALIZED_LAYERS.FISHNET : PERSONALIZED_LAYERS.NEIGHBORHOODS;

    this.webMap.allLayers.forEach((layer) => {
      if (layer.title === layerToShow || layer.title === personalizedLayerToShow) {
        layer.visible = true;
      } else {
        layer.visible = false;
      }
    });
  }

  resetLayerVisibility(): void {
    const baseLayerTitles = [BASE_LAYERS.FISHNET, BASE_LAYERS.NEIGHBORHOODS];
    const personalizedLayerTitles = [PERSONALIZED_LAYERS.FISHNET, PERSONALIZED_LAYERS.NEIGHBORHOODS];
  
    // Hide all layers initially
    const allLayerTitles = [...baseLayerTitles, ...personalizedLayerTitles];
    this.hideAllLayers(allLayerTitles);
  
    // Show the appropriate layers based on whether recalculation has occurred
    if (this.recalculateClicked) {
      this.setLayerVisible(PERSONALIZED_LAYERS.FISHNET);
    } else {
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











