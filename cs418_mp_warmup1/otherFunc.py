import numpy as np
import copy
import math
from PIL import Image

def cross_product(i1, i2, i3): # cull
    a = np.array([i1[0] - i2[0], i1[1] - i2[1]])
    b = np.array([i1[0] - i3[0], i1[1] - i3[1]])
    cross = np.cross(a,b)
    return True if cross < 0 else False

def clip_plane(p1, p2):
    dot = np.dot(p1, p2)
    # print("dot,", dot)
    return True if dot >= 0 else False

def srgb_to_linear(srgb):
    lin = []
    for color in srgb:
        if color <= 0.04045:
            color = color / 12.92
        else:
            color = pow(((color + 0.055) / 1.055), 2.4)
        linc = copy.deepcopy(color)
        lin.append(linc)
    return np.array(lin)

def linear_to_srgb(lin):
    srgb = []
    for color in lin:
        if color > 0.0031308:
            s = 1.055 * (pow(color, (1.0 / 2.4))) - 0.055
        else:
            s = 12.92 * color
        s_col = copy.deepcopy(s)
        srgb.append(s_col)
    return np.array(srgb)

def cull_edge_check(image, dda_rest):
    for i,j in zip(range(19, 66), range(20, 113, 2)): # x-coord
            # print("i and j: ", i, j)
            image.im.putpixel((i, j), (round(dda_rest[0][2]), round(dda_rest[0][3]), round(dda_rest[0][4]), 255))

def blend_rgba(srgb_lin):
    pass

def ddax_line(coord1, coord2):
    output = []
    if (coord1[0] == coord2[0] and coord1[1] == coord2[1]):
        return output
    if (coord1[0] > coord2[0]):
        coord1, coord2 = coord2, coord1
    delta = (coord2[0] - coord1[0], coord2[1] - coord1[1], coord2[2] - coord1[2], coord2[3] - coord1[3], coord2[4] - coord1[4]) # tuple coords
    delta_d = coord2[0] - coord1[0] # y direction difference coords
    # if delta_d == 0:
    #     output = ddax_edge_case(coord1, coord2)
    #     return output
    s = ((delta[0] / delta_d), (delta[1] / delta_d), (delta[2] / delta_d), (delta[3] / delta_d), (delta[4] / delta_d))
    e = math.ceil(coord1[0]) - coord1[0]
    o = (e * s[0], e * s[1], e * s[2], e * s[3], e * s[4])
    p = list(coord1)
    p[0] += o[0]
    p[1] += o[1]
    p[2] += o[2]
    p[3] += o[3]
    p[4] += o[4]
    while(p[0] < coord2[0]):
        curr_p = copy.deepcopy(p)
        output.append(curr_p)
        p[0] += s[0]
        p[1] += s[1]
        p[2] += s[2]
        p[3] += s[3]
        p[4] += s[4]

    return output

