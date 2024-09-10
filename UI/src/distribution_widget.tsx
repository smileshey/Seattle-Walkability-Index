import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";

interface DistributionWidgetProps {
  view: MapView;
  onClose: () => void;
  layerTitle: string;
}

const DistributionWidget: React.FC<DistributionWidgetProps> = ({ view, onClose, layerTitle }) => {
  const [chartData, setChartData] = useState<number[]>([]);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchWalkscoreData = async () => {
      const walkscoreLayer = view.map.allLayers.find(layer => layer.title === layerTitle) as FeatureLayer;
      if (!walkscoreLayer) {
        console.error(`${layerTitle} layer not found`);
        return;
      }

      const query = walkscoreLayer.createQuery();
      query.where = "1=1";
      query.outFields = ["walk_score"];
      query.returnGeometry = false;

      const result = await walkscoreLayer.queryFeatures(query);
      const walkScores = result.features.map((feature: any) => feature.attributes.walk_score);
      
      // Bin the walkScores into 1-point ranges (0-1, 1-2, ..., 9-10)
      const bins = Array(11).fill(0);
      walkScores.forEach(score => {
        const binIndex = Math.min(Math.floor(score), 10);
        bins[binIndex]++;
      });

      setChartData(bins);
    };

    fetchWalkscoreData();
  }, [view, layerTitle]);

  useEffect(() => {
    const canvas = document.getElementById("walkscoreChart") as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (chartRef.current) {
          chartRef.current.destroy();
        }
        chartRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: Array.from({ length: 11 }, (_, i) => `${i}-${i + 1}`), // Labels from 0-1 to 9-10
            datasets: [{
              label: 'Walkscore Distribution',
              data: chartData,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <div className="modal-content">
      <span className="close" onClick={onClose}>&times;</span>
      <div className="modal-body">
        <canvas id="walkscoreChart"></canvas>
      </div>
    </div>
  );
};

export default DistributionWidget;







