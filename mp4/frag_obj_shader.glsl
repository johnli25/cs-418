#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
    // fragColor = vec4(1, 0, 0.5, 1);
    fragColor = vColor;
}