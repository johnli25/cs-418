#version 300 es

in vec4 position;
in vec2 aTexCoord;
out vec2 vTexCoord;
in vec3 normal;
out vec3 outnormal;
out vec3 vPosition;
uniform vec4 color;
in vec4 vertex_color;
out vec4 vColor;
uniform mat4 p;
uniform mat4 mv;
uniform bool vtx_color_flag;


void main() {
    gl_Position = p * mv * position;
    vColor = vec4(vertex_color.rgb, 1.0);
    if (vtx_color_flag == false)
        vColor = color;
    vTexCoord = aTexCoord;
    vPosition = position.xyz;
    outnormal = normal;
}