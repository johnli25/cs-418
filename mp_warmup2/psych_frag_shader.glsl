#version 300 es
precision highp float;

in vec4 vColor;

uniform float seconds;

out vec4 fragColor;

void main() {
    float c = tan(seconds)*0.25 + 0.69, s = tan(seconds)*0.420 + 0.665;
    fragColor = vec4(
        vColor.b*c + vColor.g*s,
        vColor.b*c - vColor.r*s,
        cos(vColor.r * 30. - vColor.b * 15.) * 0.5 + 0.5,
        vColor.a * 0.90
    );
    // fragColor = vColor;
}
