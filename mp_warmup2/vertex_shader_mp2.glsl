#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;

out vec4 vColor;

uniform mat4 rot_mat;

void main() {
    gl_Position = rot_mat * position;
    // gl_Position = vec4(
    //     position.xy*cos(seconds*0.6180339887498949),
    //     position.zw
    // );
    // gl_Position = position;
    vColor = color;
}