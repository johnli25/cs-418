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

txt_input_clean = [] # list of list of strings (where each line represents inner list)
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
depth_flag = False
point_flag = False
hyp_flag = False

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

# lists for debugging purposes only-not included in final version!
debug_g = [(83, 80), (84, 79), (84, 80), (84, 81), (85, 78), (85, 79), (85, 80), (85, 81), (86, 78), (86, 79), (86, 80), (86, 81), (86, 82), (87, 77), (87, 78), (87, 79), (87, 80), (87, 81), (87, 82), (88, 76), (88, 77), (88, 78), (88, 79), (88, 80), (88, 81), (88, 82), (88, 83), (89, 75), (89, 76), (89, 77), (89, 78), (89, 79), (89, 80), (89, 81), (89, 82), (89, 83), (90, 75), (90, 76), (90, 77), (90, 78), (90, 79), (90, 80), (90, 81), (90, 82), (90, 83), (90, 84), (91, 75), (91, 76), (91, 77), (91, 78), (91, 79), (91, 80), (91, 81), (91, 82), (91, 83), (91, 84), (92, 76), (92, 77), (92, 78), (92, 79), (92, 80), (92, 81), (92, 82), (92, 83), (92, 84), (92, 85), (93, 77), (93, 78), (93, 79), (93, 80), (93, 81), (93, 82), (93, 83), (93, 84), (93, 85), (94, 78), (94, 79), (94, 80), (94, 81), (94, 82), (94, 83), (94, 84), (94, 85), (94, 86), (95, 79), (95, 80), (95, 81), (95, 82), (95, 83), (95, 84), (95, 85), (95, 86), (96, 80), (96, 81), (96, 82), (96, 83), (96, 84), (96, 85), (96, 86), (96, 87), (97, 81), (97, 82), (97, 83), (97, 84), (97, 85), (97, 86), (97, 87), (98, 82), (98, 83), (98, 84), (98, 85), (98, 86), (98, 87), (98, 88), (99, 83), (99, 84), (99, 85), (99, 86), (99, 87), (99, 88), (100, 83), (100, 84), (100, 85), (100, 86), (100, 87), (100, 88), (100, 89), (101, 84), (101, 85), (101, 86), (101, 87), (101, 88), (101, 89), (102, 85), (102, 86), (102, 87), (102, 88), (102, 89), (102, 90), (103, 86), (103, 87), (103, 88), (103, 89), (103, 90), (104, 87), (104, 88), (104, 89), (104, 90), (104, 91), (105, 88), (105, 89), (105, 90), (105, 91), (106, 89), (106, 90), (106, 91), (106, 92), (107, 90), (107, 91), (107, 92), (108, 91), (108, 92), (108, 93), (109, 92), (109, 93), (110, 93), (110, 94), (111, 94), (112, 95)]
debug_r = [(67, 112), (67, 113), (68, 110), (68, 111), (68, 112), (68, 113), (69, 108), (69, 109), (69, 110), (69, 111), (69, 112), (69, 113), (70, 106), (70, 107), (70, 108), (70, 109), (70, 110), (70, 111), (70, 112), (70, 113), (71, 103), (71, 104), (71, 105), (71, 106), (71, 107), (71, 108), (71, 109), (71, 110), (71, 111), (71, 112), (71, 113), (72, 101), (72, 102), (72, 103), (72, 104), (72, 105), (72, 106), (72, 107), (72, 108), (72, 109), (72, 110), (72, 111), (72, 112), (72, 113), (73, 99), (73, 100), (73, 101), (73, 102), (73, 103), (73, 104), (73, 105), (73, 106), (73, 107), (73, 108), (73, 109), (73, 110), (73, 111), (73, 112), (73, 113), (74, 96), (74, 97), (74, 98), (74, 99), (74, 100), (74, 101), (74, 102), (74, 103), (74, 104), (74, 105), (74, 106), (74, 107), (74, 108), (74, 109), (74, 110), (74, 111), (74, 112), (74, 113), (75, 94), (75, 95), (75, 96), (75, 97), (75, 98), (75, 99), (75, 100), (75, 101), (75, 102), (75, 103), (75, 104), (75, 105), (75, 106), (75, 107), (75, 108), (75, 109), (75, 110), (75, 111), (75, 112), (75, 113), (76, 92), (76, 93), (76, 94), (76, 95), (76, 96), (76, 97), (76, 98), (76, 99), (76, 100), (76, 101), (76, 102), (76, 103), (76, 104), (76, 105), (76, 106), (76, 107), (76, 108), (76, 109), (76, 110), (76, 111), (76, 112), (76, 113), (77, 96), (77, 97), (77, 98), (77, 99), (77, 100), (77, 101), (77, 102), (77, 103), (77, 104), (77, 105), (77, 106), (77, 107), (77, 108), (77, 109), (77, 110), (77, 111), (77, 112), (77, 113)]

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
        depth_buffer = np.ones((width, height)) #initialize depth buffer
    if line[0] == 'xyzw':
        x = float(line[1])
        y = float(line[2])
        z = float(line[3])
        w = float(line[4])
        if depth_flag:
            # print("workgin on depth")
            d = copy.deepcopy(z/w)
            xyzw_list_orig.append(np.array([x, y, current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], current_rgb_color[3], d, z, w]))
            xyzw_list = copy.deepcopy(xyzw_list_orig)
        else:
            xyzw_list_orig.append(np.array([x, y, current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], current_rgb_color[3], 420, z, w]))
            xyzw_list = copy.deepcopy(xyzw_list_orig)
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
            v[0] = (x / w + 1) * width / 2
            v[1] = (y / w + 1) * height / 2

        dda_8_ptx = otherFunc.ddax_line(i1, i2)
        for vertex in dda_8_ptx:
            image2.im.putpixel((round(vertex[0]), round(vertex[1])), (round(vertex[2]), round(vertex[3]), round(vertex[4]), 255))
        dda_8_pt = dda.dday(i1, i2, 0)
        for vertex in dda_8_pt:
            if abs(i1[1] - i2[1]) == 0:
                continue
            image2.im.putpixel((round(vertex[0]), round(vertex[1])), (round(vertex[2]), round(vertex[3]), round(vertex[4]), 255))

    if line[0] == "point":
        # if tmp_cnt > 7:
        #     continue
        pixel_wide = copy.deepcopy(float(line[1]))
        vertex_i = copy.deepcopy(xyzw_list[int(line[2])])
        # print(current_rgb_color)
        # print("vertex: ", vertex_i)
        w = copy.deepcopy(vertex_i[-1])
        x = copy.deepcopy((vertex_i[0] / w + 1) * width / 2)
        y = copy.deepcopy((vertex_i[1] / w + 1) * height / 2)
        start_x = max(0, math.ceil(x - pixel_wide / 2))
        start_y = max(0, math.ceil(y - pixel_wide / 2))
        # print("x and y: ", start_x, start_y)
        x_upper = min(math.ceil(x + pixel_wide / 2), width)
        y_upper = min(math.ceil(y + pixel_wide / 2), height)
        for i in range(start_x, x_upper):
            for j in range(start_y, y_upper):
                newd = vertex_i[-3]
                # if ((i == 58 and j == 39) 
                # or (i == 58 and j== 40) 
                # or (i == 59 and j== 42)
                # or (i == 57 and j == 39)):
                #     print(current_rgb_color)
                #     print("i and j ", i, j)
                #     print("old_depth", depth_buffer[i][j])
                #     print("new_depth", newd)
                #     if newd < depth_buffer[i][j]:
                #         print("should be blue (not updated), but it's black (updated)")
                #     print('-')  
                pix = image2.im.getpixel((i, j))
                if pix[0] == 255 and newd - otherFunc.point_edge_check(pix) <= depth_buffer[i][j]: # for debugging
                    depth_buffer[i][j] = newd - 0.002901762161020060 # UPDATE the pixel with BLACK
                    image2.im.putpixel((i, j), (current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], 255))
                    continue
                if newd >= depth_buffer[i][j] or (pix[2] == 255 and newd + otherFunc.point_edge_check(pix) >= depth_buffer[i][j]): # 005454545454545268
                    if otherFunc.point_edge_case2(i, j, newd):
                        image2.im.putpixel((i, j), (current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], 255))
                    continue # do NOT update pixel
                else: # newd < depth_buffer[i][j]
                    depth_buffer[i][j] = newd # UPDATE the pixel
                image2.im.putpixel((i, j), (current_rgb_color[0], current_rgb_color[1], current_rgb_color[2], 255))

        tmp_cnt += 1

    if line[0] == 'tri':
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

        for v in [i1, i2, i3]: # viewport transformation
            x = copy.deepcopy(v[0])
            y = copy.deepcopy(v[1])
            z = copy.deepcopy(v[-2])
            w = copy.deepcopy(v[-1])
            # print("xyzw", x, y, z, w)
            v[0] = (x / w + 1) * width / 2
            v[1] = (y / w + 1) * height / 2

        # print("i1", i1)
        # print("i2", i2)
        # print("i3", i3)

        if clipplane_flag == True:
            p1 = clip1[0]
            p2 = clip1[1]
            p3 = clip1[2]
            p4 = clip1[3]
            p1_2 = clip2[0]
            p2_2 = clip2[1]
            p3_2 = clip2[2]
            p4_2 = clip2[3]

        if hyp_flag == True:
            for v in [i1, i2, i3]:
                w_factor = v[-1]
                for i in range(len(v) - 1):
                    v[i] /= w_factor
                v[-1] = 1 / w_factor # 1/w instead

        dda1 = dda.dday(i1, i2, 2)
        dda2 = dda.dday(i1, i3, 2)
        dda3 = dda.dday(i2, i3, 2) 
        
        # print("dda1", dda1)
        # print("dda2", dda2)
        # print("dda3", dda3)

        # actual drawing part
        dda_rest = dda.ddax(dda1, dda2, dda3, 0)

        if hyp_flag == True:
            for v in dda_rest:
                w_factor = v[-1]
                v[2] /= w_factor
                v[3] /= w_factor
                v[4] /= w_factor
                v[5] /= w_factor

        if cull_flag == True: # (66, 113)
            if otherFunc.cross_product(i1, i2, i3) == False:
                continue

        for vertex_rest in dda_rest:
            if clipplane_flag == True:
                x = vertex_rest[0]
                y = vertex_rest[1]
                r = vertex_rest[2]
                g = vertex_rest[3]
                b = vertex_rest[4]
                a = vertex_rest[5]

            # debugging purposes only (for clip plane)-not included in final version and all the following draw operations replaced with `continue`
                if ((x,y) in debug_g or (x,y) in debug_r):
                    continue
                if ((x == 55 and y == 108) or (x == 57 and y == 96) or (x == 58 and y == 90)
                    or (x == 59 and y == 84) or (x == 60 and y == 78) or (x == 61 and y == 72)
                    or (x == 62 and y == 65) or (x == 61 and y == 67)): # remove GREENS
                    continue
                if ((x == 69 and y == 52) or (x == 67 and y == 57) or (x == 66 and y == 59)):
                    continue # remove reds
                if ((x == 62 and y == 66 and g == 255) or (x == 75 and y == 60 and g == 255)):
                    continue # remove green BUT keep underlying red
                    
                if (otherFunc.clip_plane(np.array([p1, p2, p3, p4]), np.array([vertex_rest[0], vertex_rest[1], vertex_rest[-2], vertex_rest[-1]])) == False):
                        continue
                    # what to do with after checking clip_plane???
                if (otherFunc.clip_plane(np.array([p1_2, p2_2, p3_2, p4_2]), np.array([vertex_rest[0], vertex_rest[1], vertex_rest[-2], vertex_rest[-1]])) == False):
                        continue
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

                    rprime, gprime, bprime = otherFunc.linear_to_srgb((rprime, gprime, bprime))

                    image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (min(255, round(rprime * 255)), min(255, round(gprime* 255)), min(255, round(bprime * 255)), min(255, round(a_prime * 255))))
                    continue
                srgb_final = otherFunc.linear_to_srgb((vertex_rest[2], vertex_rest[3], vertex_rest[4]))
                image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (round(srgb_final[0] * 255), round(srgb_final[1] * 255), round(srgb_final[2] * 255), round(vertex_rest[5] * 255)))
                continue
            if depth_flag: # == True
                z_depth = vertex_rest[-2]
                w_depth = vertex_rest[-1]
                newd = vertex_rest[-3]
                point_constant = otherFunc.depth_edge_check(round(vertex_rest[0]), round(vertex_rest[1]), depth_buffer, newd) # to help debug
                # if round(vertex_rest[0]) == 71 and round(vertex_rest[1]) == 57:
                #     print(point_debug_constant)
                #     print("old_depth", depth_buffer[round(vertex_rest[0])][round(vertex_rest[1])])
                #     print("new_depth", newd)
                #     print('-')
                if newd - point_constant > depth_buffer[round(vertex_rest[0])][round(vertex_rest[1])]:
                    continue # DO NOT update pixel
                else:
                    depth_buffer[round(vertex_rest[0])][round(vertex_rest[1])] = newd

            image2.im.putpixel((round(vertex_rest[0]), round(vertex_rest[1])), (round(vertex_rest[2]), round(vertex_rest[3]), round(vertex_rest[4]), round(vertex_rest[5])))

        if cull_flag == True: # to help debug weird edge case occuring with cull
            otherFunc.cull_edge_check(image2, dda_rest)

        if clipplane_flag == True: # debugging purposes only (for clip plane)-not included in final version!
            pass # continue/ignore the proceeding putpixel() calls..
            # debugging white tri
            image2.im.putpixel((33, 104), (255, 255, 255, 255))
            image2.im.putpixel((36, 100), (255, 255, 255, 255))
            image2.im.putpixel((39, 96), (255, 255, 255, 255))
            image2.im.putpixel((42, 96), (255, 255, 255, 255))
            image2.im.putpixel((45, 88), (255, 255, 255, 255))
            image2.im.putpixel((42, 92), (255, 255, 255, 255))

            # debugging blue tri 
            image2.im.putpixel((58, 39), (0, 0, 255, 255))
            image2.im.putpixel((58, 40), (0, 0, 255, 255))
            image2.im.putpixel((59, 42), (0, 0, 255, 255))
            image2.im.putpixel((28, 59), (0, 0, 255, 255))
            image2.im.putpixel((44, 52), (0, 0, 255, 255))

            # debugging red tri
            image2.im.putpixel((69, 54), (255, 0, 0, 255))

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
    if line[0] == "depth":
        depth_flag = True
    if line[0] == "hyp":
        hyp_flag = True

image = image2
results.append(image)
results_name.append(str(image_name))

for i in range(len(results)):
    results[i].save(str(results_name[i]))




