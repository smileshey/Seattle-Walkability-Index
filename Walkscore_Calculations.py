import arcpy
import pandas as pd
import geopandas as gpd

gdb_path = r"C:\Users\rtvpd\OneDrive\Documentos\ArcGIS\Projects\Walkability_Seattle\Walkability_Seattle.gdb"

# Set the workspace to the geodatabase
arcpy.env.workspace = gdb_path

# List all feature classes in the geodatabase
feature_classes = arcpy.ListFeatureClasses()
print("Feature Classes in the Geodatabase:")
for fc in feature_classes:
    print(fc)

gdb_path = r"C:\Users\rtvpd\OneDrive\Documentos\ArcGIS\Projects\Walkability_Seattle\Walkability_Seattle.gdb"
exported_fishnet_layer = r"C:\Users\rtvpd\OneDrive\Documentos\ArcGIS\Projects\Walkability_Seattle\Walkability_Seattle.gdb\fishnet_dataframe"

# Set the workspace to the geodatabase
arcpy.env.workspace = gdb_path

# List all fields in the exported fishnet layer
fields = arcpy.ListFields(exported_fishnet_layer)

# Print field names and types
print("Field Names and Types:")
for field in fields:
    print(f"Name: {field.name}, Type: {field.type}, Alias: {field.aliasName}")

gdb_path = r"C:\Users\rtvpd\OneDrive\Documentos\ArcGIS\Projects\Walkability_Seattle\Walkability_Seattle.gdb"
fishnet_layer = r"C:\Users\rtvpd\OneDrive\Documentos\ArcGIS\Projects\Walkability_Seattle\Walkability_Seattle.gdb\fishnet_dataframe"

# Define the list of fields to normalize
field_list = [
    "SUM_Park_Area",
    "SUM_SW_length",
    "SUM_SW_WIDTH",
    "SUM_SW_area",
    "SLOPE_MIN",
    "SLOPE_MAX",
    "SLOPE_MEAN",
    "SUM_trail_area",
    "SUM_trail_length",
    "MEAN_trail_GRADE_PERC"
]

def normalize_field(layer, field_name, norm_field_name):
    try:
        # Calculate min and max values for the specified field
        with arcpy.da.SearchCursor(layer, [field_name]) as cursor:
            values = [row[0] for row in cursor if row[0] is not None]
            if not values:
                print(f"No values found for {field_name}. Skipping normalization.")
                return
            min_value = min(values)
            max_value = max(values)
        
        # Add new field for normalized values if it does not already exist
        if not any(f.name == norm_field_name for f in arcpy.ListFields(layer)):
            arcpy.management.AddField(layer, norm_field_name, "DOUBLE")
        
        # Normalize the data and store in the new field
        with arcpy.da.UpdateCursor(layer, [field_name, norm_field_name]) as cursor:
            for row in cursor:
                if row[0] is not None:
                    row[1] = (row[0] - min_value) / (max_value - min_value)
                else:
                    row[1] = None
                cursor.updateRow(row)
        print(f"Normalization complete for {field_name}.")
    except Exception as e:
        print(f"Error processing field {field_name}: {e}")

# Set the workspace to the geodatabase
arcpy.env.workspace = gdb_path

# List all fields in the fishnet layer to verify field names
fields = arcpy.ListFields(fishnet_layer)
field_names = [field.name for field in fields]

# Print field names to verify
print("Field Names in the Layer:")
for field in field_names:
    print(field)

# Normalize each field in the field_list
for field in field_list:
    if field in field_names:
        norm_field = "NORM_" + field
        normalize_field(fishnet_layer, field, norm_field)
    else:
        print(f"Field {field} not found in the layer. Skipping.")

sidewalk_score_field = 'sidewalk_score'
park_score_field = 'park_score'
trail_score_field = 'trail_score'
walkscore_field = 'walk_score'

weights = {
    sidewalk_score_field: 0.5,
    park_score_field: 0.3,
    trail_score_field: 0.2
}

assert sum(weights.values()) == 1.0, "The weights must sum up to 1.0"
for score_field in [sidewalk_score_field, park_score_field, trail_score_field, walkscore_field]:
    if not any(f.name == score_field for f in arcpy.ListFields(fishnet_layer)):
        arcpy.management.AddField(fishnet_layer, score_field, "DOUBLE")

norm_fields = [sidewalk_score_field, park_score_field, trail_score_field]

sidewalk_score_components = ['NORM_SUM_SW_area']
park_score_components = ['NORM_SUM_park_area']
trail_score_components = ['NORM_SUM_trail_area']

with arcpy.da.UpdateCursor(fishnet_layer, sidewalk_score_components + park_score_components + trail_score_components + [sidewalk_score_field, park_score_field, trail_score_field]) as cursor:
    for row in cursor:
        # Calculate sidewalk score
        sidewalk_score = sum(row[i] for i in range(len(sidewalk_score_components)) if row[i] is not None)
        row[len(sidewalk_score_components + park_score_components + trail_score_components)] = sidewalk_score

        # Calculate park score
        park_score = sum(row[i + len(sidewalk_score_components)] for i in range(len(park_score_components)) if row[i + len(sidewalk_score_components)] is not None)
        row[len(sidewalk_score_components + park_score_components + trail_score_components) + 1] = park_score

        # Calculate trail score
        trail_score = sum(row[i + len(sidewalk_score_components + park_score_components)] for i in range(len(trail_score_components)) if row[i + len(sidewalk_score_components + park_score_components)] is not None)
        row[len(sidewalk_score_components + park_score_components + trail_score_components) + 2] = trail_score

        cursor.updateRow(row)

with arcpy.da.UpdateCursor(fishnet_layer, norm_fields + [walkscore_field]) as cursor:
    for row in cursor:
        walkscore = sum(row[i] * weights[norm_fields[i]] for i in range(len(norm_fields)) if row[i] is not None)
        row[-1] = walkscore
        cursor.updateRow(row)

print("Aggregated walkscore calculation complete.")






