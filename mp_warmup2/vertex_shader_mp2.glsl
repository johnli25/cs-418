#version 300 es

in vec4 position;
in vec4 color;

out vec4 vColor;

uniform mat4 rot_mat;

void main() {
    gl_Position = rot_mat * position;
    vColor = color;
    // gl_Position = position;
}