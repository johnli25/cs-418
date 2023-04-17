#version 300 es

in vec4 position;
uniform vec4 color;
in vec4 vertex_color;
uniform bool vtx_color_flag;

out vec4 vColor;

uniform mat4 p;
uniform mat4 mv;

void main() {
    gl_Position = p * mv * position;
    vColor = vec4(vertex_color.rgb, 1.0);
    if (vtx_color_flag == false)
        vColor = color;
    // vColor = vertex_color;
}