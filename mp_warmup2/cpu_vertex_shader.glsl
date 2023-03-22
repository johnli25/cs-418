#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;

out vec4 vColor;

uniform mat4 combined_mat;

void main() {
    gl_Position = position;
    vColor = color;
}