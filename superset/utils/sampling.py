import math

def largest_triangle_three_buckets(data, threshold):

    # Bucket size. Leave room for start and end data points
    every = (len(data) - 2) / (threshold - 2)

    a = 0  # Initially a is the first point in the triangle
    next_a = 0
    max_area_point = (0, 0)

    sampled = [data[0]]  # Always add the first point

    for i in range(0, threshold - 2):
        # Calculate point average for next bucket (containing c)
        avg_x = 0
        avg_y = 0
        avg_range_start = int(math.floor((i + 1) * every) + 1)
        avg_range_end = int(math.floor((i + 2) * every) + 1)
        avg_rang_end = avg_range_end if avg_range_end < len(data) else len(data)

        avg_range_length = avg_rang_end - avg_range_start

        while avg_range_start < avg_rang_end:
            avg_x += int(round(data[avg_range_start]['x'].timestamp()))
            avg_y += data[avg_range_start]['y']
            avg_range_start += 1

        avg_x /= avg_range_length
        avg_y /= avg_range_length

        # Get the range for this bucket
        range_offs = int(math.floor((i + 0) * every) + 1)
        range_to = int(math.floor((i + 1) * every) + 1)

        # Point a
        point_ax = int(round(data[a]['x'].timestamp()))
        point_ay = data[a]['y']

        max_area = -1

        max_y = data[range_offs]['y']
        min_y = data[range_offs]['y']

        max_point_to_add = data[range_offs]
        min_point_to_add = data[range_offs]
        while range_offs < range_to:
            #Calculate triangle area over three buckets
            area = math.fabs(
               (point_ax - avg_x)
               * (data[range_offs]['y'] - point_ay)
               - (point_ax - int(round(data[range_offs]['x'].timestamp())))
               * (avg_y - point_ay)
            ) * 0.5

            if area > max_area:
               max_area = area
               max_area_point = data[range_offs]
               next_a = range_offs  # Next a is this b
            range_offs += 1

        sampled.append(max_area_point)
        a = next_a  # This a is the next a (chosen b)

    sampled.append(data[len(data) - 1])  # Always add last

    return sampled

def max_min_buckets(data, threshold):
    # Bucket size. Leave room for start and end data points
    every = (len(data) - 2) / (threshold - 2)

    sampled = [data[0]]  # Always add the first point

    for i in range(0, threshold - 2):
        # Get the range for this bucket
        range_offs = int(math.floor((i + 0) * every) + 1)
        range_to = int(math.floor((i + 1) * every) + 1)

        max_y = data[range_offs]['y']
        min_y = data[range_offs]['y']

        max_point_to_add = data[range_offs]
        min_point_to_add = data[range_offs]
        while range_offs < range_to:
            if max_y < data[range_offs]['y']:
                max_y = data[range_offs]['y']
                max_point_to_add =  data[range_offs]
            if min_y > data[range_offs]['y']:
                min_y = data[range_offs]['y']
                min_point_to_add =  data[range_offs]
            range_offs += 1

        if int(round(min_point_to_add['x'].timestamp())) < int(round(max_point_to_add['x'].timestamp())):
            sampled.append(min_point_to_add)
            sampled.append(max_point_to_add)
        else:
            sampled.append(max_point_to_add)
            sampled.append(min_point_to_add)

    sampled.append(data[len(data) - 1]) # Always add last

    return sampled