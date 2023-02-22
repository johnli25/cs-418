from PIL import Image

def hex_to_rgb(hex):
  rgb = []
  for i in (0, 2, 4):
    decimal = int(hex[i:i+2], 16)
    rgb.append(decimal)
  
  return tuple(rgb)

image = Image.new("RGBA", (5, 8), (0,0,0,0))

file_implement = open('implemented.txt', 'r')
txt_files = file_implement.readlines()
file1 = txt_files[0][:-1]
file2 = txt_files[1]

lines1 = open(file1, 'r')
lines2 = open(file2, 'r')

for line in lines1:
    if 'png' in line:
        continue
    elif 'xyrgb' in line:
        num_store = []
        temp_num = ""
        for c in line[6:]:
            if c == ' ':
                num_store.append(int(temp_num))
                temp_num = ""
                continue
            else:
                temp_num += c
        num_store.append(int(temp_num))
        temp_num = ""
        image.im.putpixel((num_store[0], num_store[1]), (num_store[2], num_store[3], num_store[4], 255))
    elif 'xyc' in line:
        num_store = []
        temp_num = ""
        for c in line[4:]:
            if c == ' ':
                num_store.append(int(temp_num))
                temp_num = ""
                continue
            else:
                temp_num += c
        # temp_num = temp_num[1:]
        temp_num = hex_to_rgb(temp_num[1:])
        num_store.append(int(temp_num[0]))
        num_store.append(int(temp_num[1]))
        num_store.append(int(temp_num[2]))
        temp_num = ""
        image.im.putpixel((num_store[0], num_store[1]), (num_store[2], num_store[3], num_store[4], 255)) 

image.save("mp0ex1.png")

image2 = Image.new("RGBA", (5, 8), (0,0,0,0))

pic2 = []
for line in lines2.readlines():
    line = line.strip().split()
    pic2.append(line)

for line in pic2:
    if len(line) == 0:
        continue
    if line[0] == "xyrgb":
        image2.im.putpixel((int(line[1]), int(line[2])), (int(line[3]), int(line[4]), int(line[5]), 255))
    if line[0] == 'xyc':
        image2.im.putpixel((int(line[1]), int(line[2])), hex_to_rgb((line[3][1:])))

print(image2)
print(pic2)

image2.save('mp0ex2.png')