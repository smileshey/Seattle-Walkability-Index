def get_slope_scaler(slope_value: float, importance_level: int) -> float:
    if slope_value is None or slope_value < 0:
        return 1.0

    if importance_level == 0:
        return 1.0
    elif importance_level == 1:
        if slope_value < 2:
            return 1.0
        elif 2 <= slope_value < 3:
            return 1.0
        elif 3 <= slope_value < 4:
            return 1.0
        elif 4 <= slope_value < 5:
            return 0.99
        elif 5 <= slope_value < 7:
            return 0.95
        elif 7 <= slope_value < 10:
            return 0.9
        elif 10 <= slope_value < 15:
            return 0.8
        elif 15 <= slope_value < 20:
            return 0.7
        elif 20 <= slope_value < 25:
            return 0.5
        else:
            return 0.25
    elif importance_level == 2:
        if slope_value < 2:
            return 1.0
        elif 2 <= slope_value < 3:
            return 0.9
        elif 3 <= slope_value < 4:
            return 0.7
        elif 4 <= slope_value < 5:
            return 0.5
        elif 5 <= slope_value < 7:
            return 0.3
        elif 7 <= slope_value < 10:
            return 0.1
        elif 10 <= slope_value < 15:
            return 0.01
        else:
            return 0.0
    elif importance_level == 3:
        if slope_value < 2:
            return 1.0
        elif 2 <= slope_value < 3:
            return 1.0
        elif 3 <= slope_value < 4:
            return 0.5
        elif 4 <= slope_value < 5:
            return 0.3
        elif 5 <= slope_value < 7:
            return 0.01
        else:
            return 0.0
    elif importance_level == 4:
        if slope_value < 2:
            return 1.0
        elif 2 <= slope_value < 3:
            return 0.5
        elif 3 <= slope_value < 4:
            return 0.1
        else:
            return 0.0
    else:
        return 1.0

def get_effective_speed_limit_scaler(speed_limit_value: float, importance_level: int) -> float:
    if speed_limit_value is None or speed_limit_value < 0:
        return 1.0

    if importance_level == 0:
        return 1.0
    elif importance_level == 1:
        if speed_limit_value < 15:
            return 1.0
        elif 15 <= speed_limit_value < 20:
            return 1.0
        elif 20 <= speed_limit_value < 25:
            return 1.0
        elif 25 <= speed_limit_value < 30:
            return 1.0
        elif 30 <= speed_limit_value < 35:
            return 1.0
        elif 35 <= speed_limit_value < 40:
            return 0.6
        elif 40 <= speed_limit_value < 45:
            return 0.3
        else:
            return 0.0
    elif importance_level == 2:
        if speed_limit_value < 15:
            return 0.95
        elif 15 <= speed_limit_value < 20:
            return 0.9
        elif 20 <= speed_limit_value < 25:
            return 0.85
        elif 25 <= speed_limit_value < 30:
            return 0.75
        elif 30 <= speed_limit_value < 35:
            return 0.6
        else:
            return 0.0
    elif importance_level == 3:
        if speed_limit_value < 15:
            return 1.2
        elif 15 <= speed_limit_value < 20:
            return 1.0
        elif 20 <= speed_limit_value < 25:
            return 0.8
        else:
            return 0.0
    elif importance_level == 4:
        if speed_limit_value < 15:
            return 1.5
        elif 15 <= speed_limit_value < 20:
            return 1.0
        elif 20 <= speed_limit_value < 25:
            return 0.9
        else:
            return 0.0
    else:
        return 1.0

def get_crash_density_scaler(crash_density_value: float, importance_level: int) -> float:
    if importance_level == 0:
        return 1.0
    elif importance_level == 1:
        if crash_density_value < 0.5:
            return 0.98
        elif crash_density_value < 1.5:
            return 0.95
        else:
            return 0.85
    elif importance_level == 2:
        if crash_density_value < 0.5:
            return 0.95
        elif crash_density_value < 1.5:
            return 0.9
        else:
            return 0.8
    elif importance_level == 3:
        if crash_density_value < 0.5:
            return 1.0
        elif crash_density_value < 1.5:
            return 0.85
        else:
            return 0.25
    elif importance_level == 4:
        if crash_density_value < 0.1:
            return 2.0
        else:
            return 0.0
    else:
        return 1.0

def get_crash_density_scaler(crash_density_value: float, importance_level: int) -> float:
    if crash_density_value is None or crash_density_value < 0:
        return 1.0

    if importance_level == 0:  # "Crash density is not important"
        return 1.0
    elif importance_level == 1:  # Slightly important
        if crash_density_value < 0.5:
            return 0.98
        elif crash_density_value < 1.5:
            return 0.95
        elif crash_density_value < 3:
            return 0.90
        else:
            return 0.85
    elif importance_level == 2:  # Default importance level
        if crash_density_value < 0.5:
            return 0.95
        elif crash_density_value < 1.5:
            return 0.90
        elif crash_density_value < 3:
            return 0.85
        else:
            return 0.80
    elif importance_level == 3:  # Higher importance
        if crash_density_value < 0.5:
            return 1.0
        elif crash_density_value < 1.5:
            return 0.85
        elif crash_density_value < 3:
            return 0.5
        else:
            return 0.25
    elif importance_level == 4:  # "Crash density is very important"
        if crash_density_value < 0.1:
            return 2.0
        elif crash_density_value < 0.5:
            return 0.1
        elif crash_density_value < 1.0:
            return 0.1
        elif crash_density_value < 3:
            return 0.0
        else:
            return 0.0
    else:
        return 1.0

def get_business_density_scaler(business_density_value: float, importance_level: int) -> float:
    if business_density_value is None or business_density_value < 0:
        return 1.0

    if importance_level == 0:  # "Business density is not important"
        return 1.0
    elif importance_level == 1:  # Slightly important
        if 1.5 <= business_density_value <= 5:
            return 1.5
        elif 1.0 <= business_density_value < 1.5:
            return 1.25
        elif 0.5 <= business_density_value < 1.0:
            return 1.1
        else:
            return 1.0
    elif importance_level == 2:  # Default importance level
        if 1.5 <= business_density_value <= 5:
            return 2.0
        elif 1.0 <= business_density_value < 1.5:
            return 1.5
        elif 0.5 <= business_density_value < 1.0:
            return 1.25
        else:
            return 1.0
    elif importance_level == 3:  # Higher importance
        if 1.5 <= business_density_value <= 5:
            return 2.5
        elif 1.0 <= business_density_value < 1.5:
            return 1.25
        elif 0.5 <= business_density_value < 1.0:
            return 1.0
        else:
            return 0.5
    elif importance_level == 4:  # "Business density is very important"
        if 1.5 <= business_density_value <= 5:
            return 2.5
        elif 1.0 <= business_density_value < 1.5:
            return 1.75
        elif 0.5 <= business_density_value < 1.0:
            return 1.5
        else:
            return 0.0
    else:
        return 1.0

def get_crime_density_scaler(crime_density_value: float, importance_level: int) -> float:
    if crime_density_value is None or crime_density_value < 0:
        return 1.0

    if importance_level == 0:  # "Crime density is not important"
        return 1.0
    elif importance_level == 1:  # Slightly important
        if crime_density_value < 0.25:
            return 1.0
        elif crime_density_value < 0.7:
            return 1.0
        elif crime_density_value < 1.5:
            return 0.95
        elif crime_density_value < 3:
            return 0.90
        else:
            return 0.85
    elif importance_level == 2:  # Default importance level
        if crime_density_value < 0.25:
            return 1.0
        elif crime_density_value < 0.7:
            return 0.95
        elif crime_density_value < 1.5:
            return 0.90
        elif crime_density_value < 3:
            return 0.85
        else:
            return 0.80
    elif importance_level == 3:  # Higher importance
        if crime_density_value < 0.25:
            return 1.25
        elif crime_density_value < 0.7:
            return 1.0
        elif crime_density_value < 1.5:
            return 0.25
        elif crime_density_value < 3:
            return 0.0
        else:
            return 0.0
    elif importance_level == 4:  # "Crime density is very important"
        if crime_density_value < 0.25:
            return 1.5
        elif crime_density_value < 0.7:
            return 0.5
        elif crime_density_value < 1.5:
            return 0.0
        elif crime_density_value < 3:
            return 0.0
        else:
            return 0.0
    else:
        return 1.0
