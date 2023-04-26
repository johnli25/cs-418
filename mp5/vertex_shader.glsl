#version 300 es

in vec4 position;
in vec3 normal;

uniform vec4 color;
in vec4 vertex_color;
uniform bool vtx_color_flag;

uniform mat4 p;
uniform mat4 mv;

out vec3 outNormal;

void main() {
    gl_Position = p * mv * position;
    outNormal = normalize(normal);
    // if (vtx_color_flag == false)
    //     vColor = color;
    // vColor = vertex_color;
}