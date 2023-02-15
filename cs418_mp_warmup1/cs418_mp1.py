from PIL import Image
import math
import copy
import numpy as np
import cull

def ddax_edge_case(coord1, coord2):
    output = []
    if (coord1[0] == coord2[0] and coord1[1] == coord2[1]):
        return output
    if (coord1[0] > coord2[0]):
        coord1, coord2 = coord2, coord1
    delta = (coord2[0] - coord1[0], coord2[1] - coord1[1], coord2[2] - coord1[2], coord2[3] - coord1[3], coord2[4] - coord1[4]) # tuple coords
    delta_d = coord2[0] - coord1[0] # y direction difference coords
    if delta_d == 0:
        print(coord1)
        print(coord2)
        print("bro wtf")
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

def hex_to_rgb(hex):
  rgb = []
  for i in (0, 2, 4):
    decimal = int(hex[i:i+2], 16)
    rgb.append(decimal)
  
  return tuple(rgb)

def dday(coord1, coord2, dim):
    output = []
    if (coord1[0] == coord2[0] and coord1[1] == coord2[1]):
        return output
    if (coord1[1] > coord2[1]):
        coord1, coord2 = coord2, coord1
    delta = (coord2[0] - coord1[0], coord2[1] - coord1[1], coord2[2] - coord1[2], coord2[3] - coord1[3], coord2[4] - coord1[4]) # tuple coords
    delta_d = coord2[1] - coord1[1] # y direction difference coords
    if delta_d == 0:
        output = ddax_edge_case(coord1, coord2)
        return output

    s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d))
    e = math.ceil(coord1[1]) - coord1[1]
    o = (e * s[0], e * s[1], e * s[2], e * s[3], e * s[4])
    p = list(coord1)
    p[0] += o[0]
    p[1] += o[1]
    p[2] += o[2]
    p[3] += o[3]
    p[4] += o[4]
    while(p[1] < coord2[1]):
        curr_p = copy.deepcopy(p)
        output.append(curr_p)
        p[0] += s[0]
        p[1] += s[1]
        p[2] += s[2]
        p[3] += s[3]
        p[4] += s[4]

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
        delta = (line2[i][dim] - line1[i][dim], line2[i][1] - line1[i][1], line2[i][2] - line1[i][2], line2[i][3] - line1[i][3], line2[i][4] - line1[i][4]) # tuple coords
        delta_d = line2[i][dim] - line1[i][dim] # x direction difference coords
        if delta_d == 0:
            continue
        s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d))
        e = (math.ceil(line1[i][dim]) - line1[i][dim],
             math.ceil(line1[i][1]) - line1[i][1],
             math.ceil(line1[i][2]) - line1[i][2],
             math.ceil(line1[i][3]) - line1[i][3],
             math.ceil(line1[i][4]) - line1[i][4])

        o = (e[0] * s[0], e[0] * s[1], e[0] * s[2], e[0] * s[3], e[0] * s[4])
        p = list(line1[i])
        p[0] += o[0]
        # p[1] += o[1] # DO NOT REMOVE! I MIGHT NEED THIS!
        p[2] += o[2]
        p[3] += o[3]
        p[4] += o[4]
        while(p[dim] < line2[i][dim]):
            curr_p = copy.deepcopy(p)
            p[0] += s[0]
            # p[1] += s[1] # DO NOT REMOVE! I MIGHT NEED THIS!
            p[2] += s[2]
            p[3] += s[3]
            p[4] += s[4]
            if curr_p in coord1_list or curr_p in coord2_list or curr_p in coord3_list:
                # print("hi")
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
                 line3[i][4] - line_extended[mid_offset + i][4]) # tuple coords
        delta_d = line3[i][dim] - line_extended[mid_offset + i][dim] # x direction difference coords
        if delta_d == 0:
            continue
        s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d))
        e = (math.ceil(line_extended[mid_offset + i][dim]) - line_extended[mid_offset + i][dim], 
             math.ceil(line_extended[mid_offset + i][1]) - line_extended[mid_offset + i][1], 
             math.ceil(line_extended[mid_offset + i][2]) - line_extended[mid_offset + i][2], 
             math.ceil(line_extended[mid_offset + i][3]) - line_extended[mid_offset + i][3], 
             math.ceil(line_extended[mid_offset + i][4]) - line_extended[mid_offset + i][4])
        o = (e[0] * s[0], e[0] * s[1], e[0] * s[2], e[0] * s[3], e[0] * s[4])
        p = line_extended[mid_offset + i]
        p[dim] += o[dim]
        p[1] += o[1]
        p[2] += o[2]
        p[3] += o[3]
        p[4] += o[4]
        while(p[dim] < line3[i][dim]):
            curr_p = copy.deepcopy(p)
            horiz_line_coords.append(curr_p)
            p[dim] += s[dim]
            p[1] += s[1]
            p[2] += s[2]
            p[3] += s[3]
            p[4] += s[4]
            if curr_p in coord1_list or curr_p in coord2_list or curr_p in coord3_list:
                print("hi")
                continue
        for horiz in horiz_line_coords:
            output.append(horiz)

    return output

file_implement = open('implemented.txt', 'r')
txt_files = file_implement.readlines()
results = []
results_name = []
cull_flag = False
for f in txt_files:
    if f[-1] == '\n': # if \n at end of string
        file_input = f[:-1] # remove \n
    else:
        file_input = f

    lines = open(file_input, 'r')
    pic2 = [] # is the list
    image_name = ""

    ## clean data: strip whitespaces, commas, put into list, etc.
    for line in lines.readlines():
        line = line.strip().split()
        pic2.append(line)

    width = 0
    height = 0
    xyzw_list = []
    current_rgb_color = (255,255,255,255)
    xy_to_rgb = {}
    x_xywz = 0
    y_xywz = 0
    for line in pic2:
        if len(line) == 0:
            continue
        if line[0] == "png":
            width = int(line[1])
            height = int(line[2])
            image2 = Image.new("RGBA", (width, height), (0,0,0,0))
            image_name = line[3]
        if line[0] == "xyrgb":
            image2.im.putpixel((int(line[1]), int(line[2])), (int(line[3]), int(line[4]), int(line[5]), 255))
        if line[0] == 'xyc':
            image2.im.putpixel((int(line[1]), int(line[2])), hex_to_rgb((line[3][1:])))
        if line[0] == 'xyzw':
            x = float(line[1])
            y = float(line[2])
            z = float(line[3])
            w = float(line[4])
            x_xywz = (x / w + 1) * (width / 2)
            y_xywz = (y / w + 1) * (height / 2)
            xyzw_list.append(np.array([x_xywz, y_xywz, current_rgb_color[0], current_rgb_color[1], current_rgb_color[2]]))

        if line[0] == 'rgb':
            current_rgb_color = (int(float(line[1])), int(float(line[2])), int(float(line[3])), 255)

        if line[0] == 'tri':
            if int(line[1]) < 0:
                i1 = xyzw_list[int(line[1])] 
            else:
                i1 = xyzw_list[int(line[1])-1] 
            if int(line[2]) <= -1:
                i2 = xyzw_list[int(line[2])] 
            else:
                i2 = xyzw_list[int(line[2])-1] 
            if int(line[3]) <= -1:
                i3 = xyzw_list[int(line[3])] 
            else:
                i3 = xyzw_list[int(line[3])-1] 
            dda1 = dday(i1, i2, 2)
            dda2 = dday(i1, i3, 2)
            dda3 = dday(i2, i3, 2) 

            # actual drawing part
            if cull_flag == True:
                if cull.dot_product(i1, i2, i3) == False:
                    continue
            dda_rest = ddax(dda1, dda2, dda3, 0)
            for vertex_rest in dda_rest:
                if (vertex_rest == [] or vertex_rest[0] < 0 or vertex_rest[0] >= width or vertex_rest[1] < 0 or vertex_rest[1] >= height):
                    continue
                if vertex_rest in dda1 or vertex_rest in dda2 or vertex_rest in dda3:
                    continue
                image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (round(vertex_rest[2]), round(vertex_rest[3]), round(vertex_rest[4]), 255))
            
        if line[0] == "cull":
            cull_flag = True
             
    results.append(image2)
    results_name.append(str(image_name))

for i in range(len(results)):
    results[i].save(str(results_name[i]))



