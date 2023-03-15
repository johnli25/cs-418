from PIL import Image
import math
import copy
import numpy as np

def ddax_edge_case(coord1, coord2):
    output = []
    if (coord1[0] == coord2[0] and coord1[1] == coord2[1]):
        return output
    if (coord1[0] > coord2[0]):
        coord1, coord2 = coord2, coord1
    delta = (coord2[0] - coord1[0], coord2[1] - coord1[1], coord2[2] - coord1[2], coord2[3] - coord1[3], coord2[4] - coord1[4]) # tuple coords
    delta_d = coord2[0] - coord1[0] # y direction difference coords
    if delta_d == 0:
        return output

    s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d))
    e = math.ceil(coord1[0]) - coord1[0]
    o = (e * s[0]) # , e * s[1], e * s[2], e * s[3], e * s[4])
    p = list(coord1)
    p[0] += o
    while(p[0] < coord2[0]):
        curr_p = copy.deepcopy(p)
        output.append(curr_p)
        p[0] += s[0]

    return output

def dday(coord1, coord2, dim):
    output = []
    if (coord1[0] == coord2[0] and coord1[1] == coord2[1]):
        return output
    if (coord1[1] > coord2[1]):
        coord1, coord2 = coord2, coord1
    delta = (coord2[0] - coord1[0], coord2[1] - coord1[1], coord2[2] - coord1[2], coord2[3] - coord1[3], coord2[4] - coord1[4],
             coord2[5] - coord1[5], coord2[6] - coord1[6], coord2[7] - coord1[7]) # tuple coords
    delta_d = coord2[1] - coord1[1] # y direction difference coords
    if delta_d == 0:
        output = ddax_edge_case(coord1, coord2)
        return output

    s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d),
         (delta[5] / delta_d), (delta[6] / delta_d), (delta[7] / delta_d))
    e = math.ceil(coord1[1]) - coord1[1]
    o = (e * s[0], e * s[1], e * s[2], e * s[3], e * s[4], e * s[5], e * s[6], e * s[7])
    p = list(coord1)
    p[0] += o[0]
    p[1] += o[1]
    p[2] += o[2]
    p[3] += o[3]
    p[4] += o[4]
    p[5] += o[5]
    p[6] += o[6]
    p[7] += o[7]
    while(p[1] < coord2[1]):
        curr_p = copy.deepcopy(p)
        output.append(curr_p)
        p[0] += s[0]
        p[1] += s[1]
        p[2] += s[2]
        p[3] += s[3]
        p[4] += s[4]
        p[5] += s[5]
        p[6] += s[6]
        p[7] += s[7]

    return output

def ddax(coord1_list, coord2_list, coord3_list, dim): 
    # NOTE: DIM ALWAYS = 0!!
    output = []
    if (coord1_list[0][1] == coord2_list[0][1]):
        line1 = coord1_list
        line2 = coord2_list
        line3 = coord3_list

    if (coord2_list[0][1] == coord3_list[0][1]):
        line1 = coord2_list
        line2 = coord3_list
        line3 = coord1_list

    if (coord1_list[0][1] == coord3_list[0][1]):
        line1 = coord1_list
        line2 = coord3_list
        line3 = coord2_list

    mid_offset = min(len(line1), len(line2))
    for i in range(min(len(line1), len(line2))): 
        horiz_line_coords = []
        if (line1[i][0] == line2[i][0] and line1[i][1] == line2[i][1]):
            continue
        if (line1[i][0] > line2[i][0]):
            line1[i], line2[i] = line2[i], line1[i]
        delta = (line2[i][dim] - line1[i][dim], line2[i][1] - line1[i][1], line2[i][2] - line1[i][2], line2[i][3] - line1[i][3], line2[i][4] - line1[i][4],
                 line2[i][5] - line1[i][5], line2[i][6] - line1[i][6], line2[i][7] - line1[i][7]) # tuple coords
        delta_d = line2[i][dim] - line1[i][dim] # x direction difference coords
        if delta_d == 0:
            continue
        s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d),
             (delta[5] / delta_d), (delta[6] / delta_d), (delta[7] / delta_d))
        e = (math.ceil(line1[i][dim]) - line1[i][dim],
             math.ceil(line1[i][1]) - line1[i][1],
             math.ceil(line1[i][2]) - line1[i][2],
             math.ceil(line1[i][3]) - line1[i][3],
             math.ceil(line1[i][4]) - line1[i][4],
             math.ceil(line1[i][5]) - line1[i][5],
             math.ceil(line1[i][6]) - line1[i][6],
             math.ceil(line1[i][7]) - line1[i][7])
        o = (e[0] * s[0], e[0] * s[1], e[0] * s[2], e[0] * s[3], e[0] * s[4], e[5] * s[5],
             e[6] * s[6], e[7] * s[7])
        p = list(line1[i])
        p[0] += o[0]
        # p[1] += o[1] # DO NOT REMOVE! I MIGHT NEED THIS!
        p[2] += o[2]
        p[3] += o[3]
        p[4] += o[4]
        p[5] += o[5]
        p[6] += o[6]
        p[7] += o[7]
        while(p[dim] < line2[i][dim]):
            curr_p = copy.deepcopy(p)
            p[0] += s[0]
            # p[1] += s[1] # DO NOT REMOVE! I MIGHT NEED THIS!
            p[2] += s[2]
            p[3] += s[3]
            p[4] += s[4]
            p[5] += s[5]
            p[6] += s[6]
            p[7] += s[7]
            if curr_p in coord1_list or curr_p in coord2_list or curr_p in coord3_list:
                continue
            horiz_line_coords.append(curr_p)
        for horiz in horiz_line_coords:
            output.append(horiz)

    line_extended = line1
    if i == len(line1) - 1: # line1 finished, line2 still needs to be rasterized
        line_extended = line2
    if i == len(line2) - 1: # line2 finished, line1 still needs to be rasterized
        line_extended = line1

    temp = [coord[1] for coord in line3]
    if len(set(temp)) == 1: # IMPORTANT: checks if every y-coordinate in line/list is exactly the same
        return output    
    for i in range(len(line3)): 
        horiz_line_coords = []
        if (line_extended[mid_offset + i][0] == line3[i][0] and line_extended[mid_offset + i][0] == line3[i][1]):
            continue
        if (line_extended[mid_offset + i][0] > line3[i][0]): 
            line_extended[mid_offset + i], line3[i] = line3[i], line_extended[mid_offset + i]
        delta = (line3[i][dim] - line_extended[mid_offset + i][dim], line3[i][1] - line_extended[mid_offset + i][1],
                 line3[i][2] - line_extended[mid_offset + i][2], line3[i][3] - line_extended[mid_offset + i][3],
                 line3[i][4] - line_extended[mid_offset + i][4], line3[i][5] - line_extended[mid_offset + i][5],
                 line3[i][6] - line_extended[mid_offset + i][6], line3[i][7] - line_extended[mid_offset + i][7]) # tuple coords
        delta_d = line3[i][dim] - line_extended[mid_offset + i][dim] # x direction difference coords
        if delta_d == 0:
            continue
        s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d),
             (delta[5] / delta_d), (delta[6] / delta_d), (delta[7] / delta_d))
        e = (math.ceil(line_extended[mid_offset + i][dim]) - line_extended[mid_offset + i][dim], 
             math.ceil(line_extended[mid_offset + i][1]) - line_extended[mid_offset + i][1], 
             math.ceil(line_extended[mid_offset + i][2]) - line_extended[mid_offset + i][2], 
             math.ceil(line_extended[mid_offset + i][3]) - line_extended[mid_offset + i][3], 
             math.ceil(line_extended[mid_offset + i][4]) - line_extended[mid_offset + i][4],
             math.ceil(line_extended[mid_offset + i][5]) - line_extended[mid_offset + i][5], 
             math.ceil(line_extended[mid_offset + i][6]) - line_extended[mid_offset + i][6],
             math.ceil(line_extended[mid_offset + i][7]) - line_extended[mid_offset + i][7])
        o = (e[0] * s[0], e[0] * s[1], e[0] * s[2], e[0] * s[3], e[0] * s[4], e[5] * s[5],
             e[6] * s[6], e[7] * s[7])
        p = line_extended[mid_offset + i]
        p[dim] += o[dim]
        p[1] += o[1]
        p[2] += o[2]
        p[3] += o[3]
        p[4] += o[4]
        p[5] += o[5]
        p[6] += o[6]
        p[7] += o[7]
        while(p[dim] < line3[i][dim]):
            curr_p = copy.deepcopy(p)
            horiz_line_coords.append(curr_p)
            p[dim] += s[dim]
            p[1] += s[1]
            p[2] += s[2]
            p[3] += s[3]
            p[4] += s[4]
            p[5] += s[5]
            p[6] += s[6]
            p[7] += s[7]

            if curr_p in coord1_list or curr_p in coord2_list or curr_p in coord3_list:
                continue
        for horiz in horiz_line_coords:
            output.append(horiz)

    return output
