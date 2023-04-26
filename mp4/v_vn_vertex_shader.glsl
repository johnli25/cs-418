#version 300 es

in vec4 position;
// in vec2 aTexCoord;
// out vec2 vTexCoord;
in vec3 normal;
out vec3 outnormal;
out vec3 vPosition;

in vec4 vertex_color;
out vec4 vColor;

uniform mat4 p;
uniform mat4 mv;

void main() {
    gl_Position = p * mv * position;
    vColor = vec4(vertex_color.rgb, 1.0);
    // vTexCoord = aTexCoord;
    vPosition = position.xyz;
    outnormal = normal;
}