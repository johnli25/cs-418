from PIL import Image
import math
import copy
import numpy as np
import otherFunc
import sys

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
        delta = (line2[i][dim] - line1[i][dim], line2[i][1] - line1[i][1], line2[i][2] - line1[i][2], line2[i][3] - line1[i][3], line2[i][4] - line1[i][4],
                 line2[i][5] - line1[i][5], line2[i][6] - line1[i][6]) # tuple coords
        delta_d = line2[i][dim] - line1[i][dim] # x direction difference coords
        if delta_d == 0:
            continue
        s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d),
             (delta[5] / delta_d), (delta[6] / delta_d))
        e = (math.ceil(line1[i][dim]) - line1[i][dim],
             math.ceil(line1[i][1]) - line1[i][1],
             math.ceil(line1[i][2]) - line1[i][2],
             math.ceil(line1[i][3]) - line1[i][3],
             math.ceil(line1[i][4]) - line1[i][4],
             math.ceil(line1[i][5]) - line1[i][5],
             math.ceil(line1[i][6]) - line1[i][6])
        o = (e[0] * s[0], e[0] * s[1], e[0] * s[2], e[0] * s[3], e[0] * s[4], e[5] * s[5],
             e[6] * s[6])
        p = list(line1[i])
        p[0] += o[0]
        # p[1] += o[1] # DO NOT REMOVE! I MIGHT NEED THIS!
        p[2] += o[2]
        p[3] += o[3]
        p[4] += o[4]
        p[5] += o[5]
        p[6] += o[6]
        while(p[dim] < line2[i][dim]):
            curr_p = copy.deepcopy(p)
            p[0] += s[0]
            # p[1] += s[1] # DO NOT REMOVE! I MIGHT NEED THIS!
            p[2] += s[2]
            p[3] += s[3]
            p[4] += s[4]
            p[5] += s[5]
            p[6] += s[6]
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
                 line3[i][4] - line_extended[mid_offset + i][4], line3[i][5] - line_extended[mid_offset + i][5],
                 line3[i][6] - line_extended[mid_offset + i][6]) # tuple coords
        delta_d = line3[i][dim] - line_extended[mid_offset + i][dim] # x direction difference coords
        if delta_d == 0:
            continue
        s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d),
             (delta[5] / delta_d), (delta[6] / delta_d))
        e = (math.ceil(line_extended[mid_offset + i][dim]) - line_extended[mid_offset + i][dim], 
             math.ceil(line_extended[mid_offset + i][1]) - line_extended[mid_offset + i][1], 
             math.ceil(line_extended[mid_offset + i][2]) - line_extended[mid_offset + i][2], 
             math.ceil(line_extended[mid_offset + i][3]) - line_extended[mid_offset + i][3], 
             math.ceil(line_extended[mid_offset + i][4]) - line_extended[mid_offset + i][4],
             math.ceil(line_extended[mid_offset + i][5]) - line_extended[mid_offset + i][5], 
             math.ceil(line_extended[mid_offset + i][6]) - line_extended[mid_offset + i][6])
        o = (e[0] * s[0], e[0] * s[1], e[0] * s[2], e[0] * s[3], e[0] * s[4], e[5] * s[5],
             e[6] * s[6])
        p = line_extended[mid_offset + i]
        p[dim] += o[dim]
        p[1] += o[1]
        p[2] += o[2]
        p[3] += o[3]
        p[4] += o[4]
        p[5] += o[5]
        p[6] += o[6]
        while(p[dim] < line3[i][dim]):
            # print("horiz", horiz_line_coords)
            curr_p = copy.deepcopy(p)
            horiz_line_coords.append(curr_p)
            p[dim] += s[dim]
            p[1] += s[1]
            p[2] += s[2]
            p[3] += s[3]
            p[4] += s[4]
            p[5] += s[5]
            p[6] += s[6]
            if curr_p in coord1_list or curr_p in coord2_list or curr_p in coord3_list:
                continue
        for horiz in horiz_line_coords:
            output.append(horiz)
    return output

file_input = sys.argv[1]
f = open(file_input, 'r')
results = []
results_name = []

txt_input_clean = [] # is the list
image_name = ""

## clean data: strip whitespaces, commas, put into list, etc.
for line in f.readlines():
    line = line.strip().split()
    txt_input_clean.append(line)

#flags
cull_flag = False
clipplane_flag = False
clipplane_cnt = 1
sRGB_flag = False
line_flag = False
rgba_flag = False

width = 0
height = 0
xyzw_list_orig = []
xyzw_list = []
current_rgb_color = (255,255,255,255)
xy_to_rgb = {}
x_xywz = 0
y_xywz = 0
clip1 = np.array([0, 0, 0, 0])
clip2 = np.array([0, 0, 0, 0])
alpha_buffer = []
rgb_buffer = []
alpha_flag = False

tmp_cnt = 0
for line in txt_input_clean:
    if len(line) == 0:
        continue
    if line[0] == "png":
        width = int(line[1])
        height = int(line[2])
        image2 = Image.new("RGBA", (width, height), (0,0,0,0))
        image_name = line[3]
        alpha_buffer = np.zeros((width, height))
        rgb_buffer = np.zeros((width, height, 3))
    if line[0] == 'xyzw':
        x = float(line[1])
        y = float(line[2])
        z = float(line[3])
        w = float(line[4])
        xyzw_list_orig.append(np.array([x, y, current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], current_rgb_color[3], z, w]))
        xyzw_list = copy.deepcopy(xyzw_list_orig)
        print("current rgb color", current_rgb_color)
        print("xyzw", xyzw_list)
    if line[0] == 'rgb':
        if sRGB_flag == True:
            current_rgb_color = (float(line[1]) / 255, float(line[2]) / 255, float(line[3]) / 255, 1)
            srgb = otherFunc.srgb_to_linear(np.array(current_rgb_color))
            # if rgba_flag == True:
            #     current_rgb_color[3] = line[3]
            #     rgba = otherFunc.blend_rgba(srgb)
            #     current_rgb_color = tuple(rgba)
            #     continue
            current_rgb_color = tuple(srgb)
        else:
            current_rgb_color = (int(float(line[1])), int(float(line[2])), int(float(line[3])), int(float(line[4])))
    if line[0] == 'rgba':
        rgba_flag = True
        if sRGB_flag == True:
            current_rgb_color = (float(line[1]) / 255, float(line[2]) / 255, float(line[3]) / 255, float(line[4]))
            srgb = otherFunc.srgb_to_linear(np.array(current_rgb_color))
            # print("cur rgb", current_rgb_color)
            current_rgb_color = tuple(srgb)
            # current_rgb_color = (int(float(line[1])), int(float(line[2])), int(float(line[3])), float(line[4]))
    if line[0] == "line":
        i1 = xyzw_list[int(line[1])]
        i2 = xyzw_list[int(line[2])]
        dda_8_pt = dday(i1, i2, 0)
        dda_8_ptx = otherFunc.ddax_line(i1, i2)
        print(dda_8_ptx)
        for vertex in dda_8_ptx:
            image2.im.putpixel((round(vertex[0]), round(vertex[1])), (round(vertex[2]), round(vertex[3]), round(vertex[4]), 255))
        for vertex in dda_8_pt:
            image2.im.putpixel((round(vertex[0]), round(vertex[1])), (round(vertex[2]), round(vertex[3]), round(vertex[4]), 255))

    if line[0] == 'tri':
        # xyzw_list.append(np.array([x_xywz, y_xywz, current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], z, w]))
        tmp_cnt += 1
        print(line)
        print("temp cnt", tmp_cnt)
        if int(line[1]) < 0:
            i1 = copy.deepcopy(xyzw_list[int(line[1])])
        else:
            i1 = copy.deepcopy(xyzw_list[int(line[1])-1])
        if int(line[2]) <= -1:
            i2 = copy.deepcopy(xyzw_list[int(line[2])])
        else:
            i2 = copy.deepcopy(xyzw_list[int(line[2])-1]) 
        if int(line[3]) <= -1:
            i3 = copy.deepcopy(xyzw_list[int(line[3])])
        else:
            i3 = copy.deepcopy(xyzw_list[int(line[3])-1])

        if clipplane_flag == True:
            p1 = clip1[0]
            p2 = clip1[1]
            p3 = clip1[2]
            p4 = clip1[3]
            p1_2 = clip2[0]
            p2_2 = clip2[1]
            p3_2 = clip2[2]
            p4_2 = clip2[3]

            for vtx in [i1, i2, i3]:
                # what to do with after checking clip_plane???
                if otherFunc.clip_plane(np.array([p1, p2, p3, p4]), np.array([vtx[0], vtx[1], vtx[-2], vtx[-1]])) == False:
                    print("beging clip1")
                # what to do with after checking clip_plane???
                if otherFunc.clip_plane(np.array([p1_2, p2_2, p3_2, p4_2]), np.array([vtx[0], vtx[1], vtx[-2], vtx[-1]])) == False:
                    print("begin clip2")

        print("i1 before", i1)
        print("i2 before", i2)
        print("i3 before", i3)
        for v in [i1, i2, i3]: # viewport transformation
            x = copy.deepcopy(v[0])
            y = copy.deepcopy(v[1])
            z = copy.deepcopy(v[-2])
            w = copy.deepcopy(v[-1])
            # print("xyzw", x, y, z, w)
            v[0] = (x / w + 1) * width / 2
            v[1] = (y / w + 1) * height / 2
            # print("v: ", v)

        print("i1", i1)
        print("i2", i2)
        print("i3", i3)
        dda1 = dday(i1, i2, 2)
        dda2 = dday(i1, i3, 2)
        dda3 = dday(i2, i3, 2) 
        print("after:::::::")
        print("i1", i1)
        print("i2", i2)
        print("i3", i3)
        print("xyzw: ", xyzw_list)
        # actual drawing part
        if cull_flag == True:
            if otherFunc.cross_product(i1, i2, i3) == False:
                continue
        dda_rest = ddax(dda1, dda2, dda3, 0)
        # for vertex in dda_rest:
        #     alpha_buffer[][]

        for vertex_rest in dda_rest:
            if (vertex_rest == [] or vertex_rest[0] < 0 or vertex_rest[0] >= width or vertex_rest[1] < 0 or vertex_rest[1] >= height):
                continue
            if vertex_rest in dda1 or vertex_rest in dda2 or vertex_rest in dda3:
                continue
            if sRGB_flag == True:
                srgb_final = otherFunc.linear_to_srgb((vertex_rest[2], vertex_rest[3], vertex_rest[4], vertex_rest[5]))
                # print(srgb_final)
                if rgba_flag == True:
                    a_d = copy.deepcopy(alpha_buffer[round(vertex_rest[0])][round(vertex_rest[1])])
                    a_s = copy.deepcopy(srgb_final[3])
                    alpha_buffer[round(vertex_rest[0])][round(vertex_rest[1])] += a_s # + a_d*(1 - a_s)
                    a_prime = copy.deepcopy(alpha_buffer[round(vertex_rest[0])][round(vertex_rest[1])])

                    r_s = copy.deepcopy(srgb_final[0])
                    g_s = copy.deepcopy(srgb_final[1])
                    b_s = copy.deepcopy(srgb_final[2])

                    r_d = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][0])
                    g_d = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][1])
                    b_d = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][2])

                    rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][0] = (a_s / a_prime)*r_s + r_d * a_d*(1 - a_s)/a_prime # r
                    rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][1] = (a_s / a_prime)*g_s + g_d * a_d*(1 - a_s)/a_prime # g
                    rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][2] = (a_s / a_prime)*b_s + b_d * a_d*(1 - a_s)/a_prime # b
                    # rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][0] += r_d
                    # rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][1] += g_d
                    # rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][2] += b_d
                    rprime = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][0])
                    gprime = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][1])
                    bprime = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][2])

                    image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (min(255, round(r_s * 255)), min(255, round(g_s * 255)), min(255, round(b_s * 255)), min(255, round(a_prime * 255))))
                    continue
                image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (round(srgb_final[0] * 255), round(srgb_final[1] * 255), round(srgb_final[2] * 255), round(srgb_final[3] * 255)))
                continue
            image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (round(vertex_rest[2]), round(vertex_rest[3]), round(vertex_rest[4]), round(vertex_rest[5])))

    if line[0] == "cull":
        cull_flag = True
    if line[0] == "clipplane" and clipplane_cnt == 1:
        clipplane_flag = True
        if clipplane_cnt == 1:
            clip1 = np.array([float(line[1]), float(line[2]), float(line[3]), float(line[4])])
            clipplane_cnt += 1
        if clipplane_cnt == 2:
            clip2 = np.array([float(line[1]), float(line[2]), float(line[3]), float(line[4])])

    if line[0] == "sRGB":
        sRGB_flag = True
    if line[0] == "line":
        line_flag = True
    # if line[0] == "rgba":
    #     rgba_flag == True

results.append(image2)
results_name.append(str(image_name))

for i in range(len(results)):
    results[i].save(str(results_name[i]))



