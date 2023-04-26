#version 300 es

in vec4 position;
in vec4 normal;

uniform vec4 color;
in vec4 vertex_color;
uniform bool vtx_color_flag;

uniform mat4 p;
uniform mat4 mv;

void main() {
    gl_Position = p * mv * position;
    // if (vtx_color_flag == false)
    //     vColor = color;
    // vColor = vertex_color;
}