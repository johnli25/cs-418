#version 300 es
in vec4 position;
in vec2 aTexCoord;
out vec2 vTexCoord;
in vec3 normal;
out vec3 outnormal;
out vec3 vPosition;
uniform mat4 p;
uniform mat4 mv;
uniform bool spheroid_flag;
void main() {
    gl_Position = p * mv * position;
    vTexCoord = aTexCoord;
    vPosition = position.xyz;
    outnormal = normal;
}