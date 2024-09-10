import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { getSlopeScaler, getEffectiveSpeedLimitScaler, getBusinessDensityScaler } from "./scaler_calculations";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const importanceLevels = [0, 1, 2, 3, 4];

// Generate a consistent set of colors
const colors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)'
];

const linspace = (start: number, end: number, num: number) => {
  const step = (end - start) / (num - 1);
  return Array.from({ length: num }, (_, i) => start + (i * step));
};

const ScalerVisualization: React.FC<{ userSliderValues: { slope: number, sidewalk: number, amenity: number }, onClose: () => void }> = ({ userSliderValues, onClose }) => {
  const [data, setData] = useState<{ slope: number[], combined: number[], businessDensity: number[] }>({ slope: [], combined: [], businessDensity: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8081/walkscore_fishnet.geojson');
        const dataset = await response.json();

        const slopeValues = dataset.features.map((row: any) => row.properties.Slope_MEAN); // Updated to use Slope_MEAN
        const combinedValues = dataset.features.map((row: any) => row.properties.NORM_Combined_effective_area);
        const businessDensityValues = dataset.features.map((row: any) => row.properties.NORM_business_density);

        setData({ slope: slopeValues, combined: combinedValues, businessDensity: businessDensityValues });

        console.log("Fetched data:", { slopeValues, combinedValues, businessDensityValues });
      } catch (error) {
        console.error("Error fetching dataset:", error);
      }
    };

    fetchData();
  }, []);

  const generateDatasets = (getScaler: (value: number, importanceLevel: number) => number, linspaceValues: number[]) => {
    return importanceLevels.map((importanceLevel, index) => ({
      label: `Case ${importanceLevel}`,
      data: linspaceValues.map(val => getScaler(val, importanceLevel)),
      borderColor: colors[index],
      fill: false,
    }));
  };

  const maxSlope = Math.max(...data.slope); // Determine the maximum slope value for the x-axis scale
  const minSlope = Math.min(...data.slope); // Determine the minimum slope value for the x-axis scale
  const slopeDatasets = generateDatasets(getSlopeScaler, linspace(minSlope, maxSlope, 100)); // Use the actual range of Slope_MEAN
  const combinedDatasets = generateDatasets(getEffectiveSpeedLimitScaler, linspace(0, 1, 100));
  const businessDensityDatasets = generateDatasets(getBusinessDensityScaler, linspace(0, 1, 100));

  const slopeXAxisOptions = {
    type: 'linear' as const,
    min: minSlope,
    max: maxSlope,
    ticks: {
      callback: function(tickValue: string | number) {
        return Number(tickValue).toFixed(2);
      }
    }
  };

  const defaultXAxisOptions = {
    type: 'linear' as const,
    min: 0,
    max: 1,
    ticks: {
      callback: function(tickValue: string | number) {
        return Number(tickValue).toFixed(2);
      }
    }
  };

  useEffect(() => {
    console.log("Slope datasets:", slopeDatasets);
    console.log("Combined datasets:", combinedDatasets);
    console.log("Business density datasets:", businessDensityDatasets);
  }, [slopeDatasets, combinedDatasets, businessDensityDatasets]);

  const chartOptions = (title: string, xAxisOptions: any) => ({
    plugins: {
      legend: {
        display: title === 'Slope Scaler Visualization' // Only display legend for the first plot
      },
      title: {
        display: false,
        text: title,
      }
    },
    scales: {
      x: xAxisOptions,
      y: {
        min: title === 'Business Density Scaler Visualization' ? 1 : 0,
        max: title === 'Business Density Scaler Visualization' ? 10 : 1
      }
    }
  } as ChartOptions<'line'>);

  return (
    <div className="modal-content">
      <div className="modal-body">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>How Do the Sliders Affect The Score?</h2>
        <h3>Slope Scaler Visualization</h3>
        <div className="chart-container">
          <Line data={{ labels: linspace(minSlope, maxSlope, 100), datasets: slopeDatasets }} options={chartOptions('Slope Scaler Visualization', slopeXAxisOptions)} />
        </div>
        <h3>Effective Area Scaler Visualization</h3>
        <div className="chart-container">
          <Line data={{ labels: linspace(0, 1, 100), datasets: combinedDatasets }} options={chartOptions('Effective Area Scaler Visualization', defaultXAxisOptions)} />
        </div>
        <h3>Business Density Scaler Visualization</h3>
        <div className="chart-container">
          <Line data={{ labels: linspace(0, 1, 100), datasets: businessDensityDatasets }} options={chartOptions('Business Density Scaler Visualization', defaultXAxisOptions)} />
        </div>
      </div>
    </div>
  );
};

export default ScalerVisualization;





















































