# Walkability Seattle Project

My goal with this project was to create a walkability index for Seattle that would provide anyone in Seattle with a gauge for how walkable their neighborhood is, in relation to other neighborhoods within Seattle. Current measures of "walkability", rely on too heavily on the user's proximity to businesses and often serve as a poor proxy for an area's walkability.

This project uses publicly available GIS data that is maintained by the city of Seattle, in addition to data from openstreetmap.org which provides information about the businesses and public amenities. This GIS data provides us with a geospatial representation for the infrastructure available throughout the city. With this data, and by using ArcGIS Pro, we are able to calculate the total area of sidewalk, road, pathways, trails, and parks, in addition to less tangible assets like slopes and businesses, to create a score for any point within Seattle city limits.

## Table of Contents
- [Project Overview](#project-overview)
- [How it Works](#howitworks)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

## Project Overview
The Seattle Walkability Index is a tool designed to evaluate and visualize the walkability of neighborhoods in Seattle using various geographic and environmental assets. The project uses publicly available GIS data from the city of Seattle, along with business and public amenities data from OpenStreetMap, to create a comprehensive walkability score that can be used to assess the walkability at one point in the city, in comparison to any other point.

Key factors considered in the scoring include sidewalk availability, slopes, business density, public amenities, and green space, which are combined to provide a more holistic view of walkability beyond proximity to businesses alone. The project utilizes ArcGIS Pro, which was used for the complex spatial analysis, which was applied to the assets described above, and React for the web-based user interface, allowing users to personalize their walkability scores by adjusting the weight of different factors via interactive sliders.

The platform dynamically recalculates these scores in real-time and displays the top walkable neighborhoods on a map. The resulting scores are visualized and displayed as geospatial layers, enabling users to understand how walkability differs between neighborhoods.

## How it Works

![Alt text](UI/images/WalkscoreAnimation.gif)

To create the walkscore discussed above, the city is first segmented using a fishnet. This fishnet is a series of grids of equal size that is overlaid on top of the map. Within each grid, we use ArcGIS to calculate the area of sidewalks, streets, pathways, and tree canopy. Additionally, we calculate the number of businesses, public amenities (benches, restrooms, water fountains, etc.), as well as the effective slope in each grid.

Each grid within the fishnet is given a unique identifier (FID), and the areas, quantities, and means are aggregated by this FID value. We then normalize each field created during the spatial analysis to a scale of 0-1.

A base `unadjusted_walkscore` field is then created using the `walkscore_calculator.py` notebook. This unadjusted walkscore is the sum of the 'positive' components of the walkscore, multiplied by a weighted function. Here are the weights used:

```python
positive_weights = {
    sidewalk_score_field: 0.7,
    park_score_field: 0.075,
    trail_score_field: 0.2,
    bike_score_field: 0.025
}
```

These weights are applied to the sum of the area for each asset provided above, such that the `unadjusted_walkscore` field is calculated like:

$$
W_{\text{unadjusted}} = 0.7 \times A_{\text{sidewalk}} + 0.075 \times A_{\text{park}} + 0.2 \times A_{\text{trail}} + 0.025 \times A_{\text{bike}}
$$

Where:
- $A_{\text{sidewalk}}$ is the sum of sidewalk area,
- $A_{\text{park}}$ is the sum of park area,
- $A_{\text{trail}}$ is the sum of trail area,
- $A_{\text{bike}}$ is the sum of bike lane area.

The final walkscore for each grid $W_{\text{walkscore}}$ is calculated by multiplying the unadjusted walkscore $W_{\text{unadjusted}}$ by scalers that adjust for specific factors such as slope, business density, canopy coverage, public amenities, and calm traffic:


$$
W_{\text{walkscore}} = W_{\text{unadjusted}} \times S_{\text{slope}} \times S_{\text{business}} \times S_{\text{canopy}} \times S_{\text{amenity}} \times S_{\text{traffic}}
$$

where:
- $S_{\text{slope}}$ is the slope scaler,
- $S_{\text{business}}$ is the business density scaler,
- $S_{\text{canopy}}$ is the canopy coverage scaler,
- $S_{\text{amenity}}$ is the public amenity scaler,
- $S_{\text{traffic}}$ is the calm traffic scaler.

These scalers allow us to adjust the importance of each geographic characteristic as it pertains to walkability and are calculated using a function that takes in the value for each fishnet grid and returns a value between 0-1 for the slope, calm traffic scalers, and tree canopy scalers, and 0-10 for the business density and public amenity scalers.

The walkscore field for each grid is then summed by neighborhood and normalized by neighborhood area to create the walkscore value for each neighborhood.

Here's a rough outline for how the scalers are calculated:

- Slope Scaler:
    - The slope field is aggregated as an 'effective_slope'
    - effective_slope represents the slope along walkable assets within each grid, rather than just using the mean slope across the grid
    - The function used during spatial analysis to calculate effective slope will first check if a sidewalk exists. If a sidewalk exists it calculates the slope along the sidewalk polyline. If not, then the function checks if a multi-use trail or a street exists. If none of these exist within a grid, the average slope across the grid is returned as the effective slope.
    - This process is intended to reduce the possibility that a flat pathway within an otherwise steep area being scaled negatively
    - The resulting scaler is between 0-1, where a 0 indicates that the slope is unwalkable (cliffs) and a 1 indicates that the slope is flat.

- Business Density Scaler:
    - The business density is calculated as sum of the businesses in a grid divided by the total area of the grid and normalized to prevent smaller grids (grids that are cutoff along the edges of the city).
    - These businesses are extracted from the dataset and trimmed to eliminate certain types of businesses like car dealerships, mobile car washes, parking vendors, etc.
    - Within the basemap, the scaler applied is between 1-2, where 1 indicates no businesses and 2 indicates the most businesses.

- Public Amenity Density Scaler:
    - public amenities are things within the city that are accessible to the public and that make walking more pleasant indirectly.
    - These amenities are things like artwork, fountains, museums, zoos, benches, drinking fountains, public restrooms, etc.
    - The scaler derived from this field is between 1-1.5, where 1 indicates no amenities and 1.5 indicates the most amenities.

- Tree Canopy Coverage Scaler
    - Tree canopy represents how much area trees cover within a given grid. This is calculated using Seattle's tree surveys and are provided in the form of a polygon layer.
    - The tree canopy scaler is between 1-1.5, where 1 indicates no trees and 1.5 indicates the most tree coverage.

- Calm Traffic Scaler
    - The calm traffic scaler is intended to represent how fast vehicle traffic is moving within each grid. This uses the MAX_effective_speed_limit calculated within each grid.
    - This effective speed limit is calculated using scalers for the use-type, where the speed limit in grids that contain industrial areas, parkinglots, and hospitals are scaled.
    - In each grid we find the maximum speed limt and then adjust the max speed limit depending on the use. This speed limit adjustment is defined like:
        ```python
        speed_limit_scalers = {
            "Industrial": 1.75,
            "ParkingLots": 1.50,
            "Hospitals": 2.0
        } 
        ```
        where the resulting 'effective_speed_limit' is calculated like: 
        
        ```python
        effective_speed_limit = MAX(speed limit for all streets in the grid)* MAX(speed_limit_scaler)
        ```
    - The Calm Traffic Scaler is then calculated between 0-1, where a 0 indicates heavy vehicle usage (I-5, industrial areas) and a 1 indicates calm traffic

For further information regarding the operations completed above, please view the notebooks provided in this repo either by viewing the 'walkscore_calculator.ipynb' or the 'preprocessing.ipynb'. Information on how to view these within ArcGIS are described below.

## Usage

### ArcGIS Pro
Open the `Walkability_Seattle.ppkx` file in ArcGIS Pro. This file is a package of the relevant files and layers needed to run the application. The layers and datasets will be in the `Walkability_Seattle.gdb` geodatabase, and they should be relinked if necessary by ensuring that the data sources are correctly pointing to the `.gdb` file. To start the map within ArcGIS, you'll need to unpack the packaged file and then run the .aprx file.

Once you have successfully started the map within ArcGIS Pro, you will need to ensure that the notebooks are linked to the project which use python to control the processing steps required to make the data usable for the purposes of creating a walkscore. After the processing notebook has run sucessfully, the walkscore calculator.ipynb script should be run to calculate the walkscore layers.

### Web Application
To view the web application, please visit this page:

[placeholder]

Once the web application is running, you can:
- Adjust walkability preferences using the sliders. By adjusting the sliders you are able to indicate your personal preferences.
- Click the **Recalculate** button to see updated and personalized walkability rankings.
- View the top-ranked neighborhoods on the map with circular ranking markers.

### Packaging and Sharing
If you want to share this project via ArcGIS Online or a GitHub repository, ensure that you are using **relative paths** for the data layers and include all necessary files within the `Walkability_Seattle` folder.

## File Structure (User Interface)
```
Walkability_Seattle/
│
├── UI/                           # React web application
│   ├── index.html                # Main HTML file for the web app
│   ├── src/
│   │   ├── main.tsx              # Main entry for the web app
│   │   ├── slider_widget.tsx      # Slider component for adjusting factors
│   │   ├── top_neighborhoods.tsx  # Component for displaying top neighborhoods
│   │   ├── walkscore_calculator.tsx # Logic for recalculating walkscore
│   │   ├── neighborhood_utils.ts  # Utility functions for neighborhood processing
│   │   ├── rootUtils.tsx          # Utility functions for handling the root component
│   │   ├── toggle_widget.tsx      # Component for toggling between neighborhood and fishnet views
│   └── package.json               # Dependencies and scripts for the web app
│
├── Walkability_Seattle.aprx       # ArcGIS Pro project file
├── Walkability_Seattle.gdb/       # Geodatabase for storing GIS layers
├── README.md                      # Project documentation
└── .gitignore                     # Git configuration to ignore unnecessary files
```
## Dependencies

### ArcGIS
- ArcGIS Pro
- ArcGIS Online (for hosted layers)

### Web Application
- React
- Typescript
- ArcGIS API for JavaScript
- Material UI

### GIS Data Sources
- OpenStreetMap.org for Public and Business Amenities
- Seattle GeoData for Sidewalks, Parks, Trails, Tree Canopy, bike, and Street layers.

## Contributing
If you would like to contribute, please get in touch. I'd be happy to incorporate more people into this project.

## License
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) License. See the [LICENSE](LICENSE) file for details.
