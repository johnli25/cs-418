import numpy as np

def dot_product(i1, i2, i3):
    a = np.array([i1[0] - i2[0], i1[1] - i2[1]])
    b = np.array([i1[0] - i3[0], i1[1] - i3[1]])
    cross = np.cross(a,b)
    return True if cross < 0 else False
