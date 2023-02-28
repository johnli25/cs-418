from PIL import Image
import math
import copy
import numpy as np
import otherFunc
import dda
import sys

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
height = 1
xyzw_list_orig = []
xyzw_list = []
current_rgb_color = [255,255,255,255]
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
        # print("current rgb color", current_rgb_color)
        # print("xyzw list:", xyzw_list)
    if line[0] == 'rgb':
        if sRGB_flag == True:
            current_rgb_color = [float(line[1]) / 255, float(line[2]) / 255, float(line[3]) / 255, 1]
            srgb = otherFunc.srgb_to_linear(np.array(current_rgb_color))
            current_rgb_color = list(srgb)
        else:
            current_rgb_color = [int(float(line[1])), int(float(line[2])), int(float(line[3])), 255]
    if line[0] == 'rgba':
        rgba_flag = True
        if sRGB_flag == True:
            current_rgb_color = [float(line[1]) / 255, float(line[2]) / 255, float(line[3]) / 255, float(line[4])]
            srgb = otherFunc.srgb_to_linear(np.array(current_rgb_color[0:3]))
            # print("cur rgb", current_rgb_color)
            for i in range(len(srgb)):
                current_rgb_color[i] = srgb[i]
    if line[0] == "line":
        i1 = xyzw_list[int(line[1])]
        i2 = xyzw_list[int(line[2])]
        for v in [i1, i2]: # viewport transformation
            x = copy.deepcopy(v[0])
            y = copy.deepcopy(v[1])
            z = copy.deepcopy(v[-2])
            w = copy.deepcopy(v[-1])
            # print("xyzw", x, y, z, w)
            v[0] = (x / w + 1) * width / 2
            v[1] = (y / w + 1) * height / 2

        dda_8_pt = dda.dday(i1, i2, 0)
        dda_8_ptx = otherFunc.ddax_line(i1, i2)
        print(dda_8_ptx)
        for vertex in dda_8_ptx:
            image2.im.putpixel((round(vertex[0]), round(vertex[1])), (round(vertex[2]), round(vertex[3]), round(vertex[4]), 255))
        for vertex in dda_8_pt:
            image2.im.putpixel((round(vertex[0]), round(vertex[1])), (round(vertex[2]), round(vertex[3]), round(vertex[4]), 255))

    if line[0] == 'tri':
        # xyzw_list.append(np.array([x_xywz, y_xywz, current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], z, w]))
        tmp_cnt += 1
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

        for v in [i1, i2, i3]: # viewport transformation
            x = copy.deepcopy(v[0])
            y = copy.deepcopy(v[1])
            z = copy.deepcopy(v[-2])
            w = copy.deepcopy(v[-1])
            # print("xyzw", x, y, z, w)
            v[0] = (x / w + 1) * width / 2
            v[1] = (y / w + 1) * height / 2

        dda1 = dda.dday(i1, i2, 2)
        dda2 = dda.dday(i1, i3, 2)
        dda3 = dda.dday(i2, i3, 2) 

        # actual drawing part
        if cull_flag == True:
            if otherFunc.cross_product(i1, i2, i3) == False:
                continue
        dda_rest = dda.ddax(dda1, dda2, dda3, 0)

        for vertex_rest in dda_rest:
            if (vertex_rest == [] or vertex_rest[0] < 0 or vertex_rest[0] >= width or vertex_rest[1] < 0 or vertex_rest[1] >= height):
                continue
            if vertex_rest in dda1 or vertex_rest in dda2 or vertex_rest in dda3:
                continue
            if sRGB_flag == True:
                # srgb_final = otherFunc.linear_to_srgb((vertex_rest[2], vertex_rest[3], vertex_rest[4]))
                if rgba_flag == True:
                    a_d = copy.deepcopy(alpha_buffer[round(vertex_rest[0])][round(vertex_rest[1])])
                    a_s = copy.deepcopy(vertex_rest[5])
                    alpha_buffer[round(vertex_rest[0])][round(vertex_rest[1])] = a_s + a_d*(1 - a_s)
                    a_prime = copy.deepcopy(alpha_buffer[round(vertex_rest[0])][round(vertex_rest[1])])

                    r_s = copy.deepcopy(vertex_rest[2])
                    g_s = copy.deepcopy(vertex_rest[3])
                    b_s = copy.deepcopy(vertex_rest[4])
                    r_d = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][0])
                    g_d = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][1])
                    b_d = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][2])

                    rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][0] = (a_s / a_prime)*r_s + r_d * a_d*(1 - a_s)/a_prime # r
                    rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][1] = (a_s / a_prime)*g_s + g_d * a_d*(1 - a_s)/a_prime # g
                    rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][2] = (a_s / a_prime)*b_s + b_d * a_d*(1 - a_s)/a_prime # b

                    rprime = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][0])
                    gprime = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][1])
                    bprime = copy.deepcopy(rgb_buffer[round(vertex_rest[0])][round(vertex_rest[1])][2])

                    rpime, gprime, bprime = otherFunc.linear_to_srgb((rprime, gprime, bprime))

                    image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (min(255, round(rprime * 255)), min(255, round(gprime* 255)), min(255, round(bprime * 255)), min(255, round(a_prime * 255))))
                    continue
                srgb_final = otherFunc.linear_to_srgb((vertex_rest[2], vertex_rest[3], vertex_rest[4]))
                image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (round(srgb_final[0] * 255), round(srgb_final[1] * 255), round(srgb_final[2] * 255), round(vertex_rest[5] * 255)))
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



