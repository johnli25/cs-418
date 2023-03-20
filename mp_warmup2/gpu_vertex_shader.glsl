#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;

out vec4 vColor;

uniform mat4 combined_mat;

void main() {
    gl_Position = vec4(
        position.xy*cos(float(gl_VertexID) * seconds*1.1),
        position.zw
    );
    vColor = color;
}