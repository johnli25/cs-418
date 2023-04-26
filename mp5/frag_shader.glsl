#version 300 es
precision highp float;

uniform vec4 color;
uniform vec3 lightdir;
uniform vec3 lightcolor;
in vec3 normal;
out vec3 outNormal;
out vec4 fragColor;

void main() {
    float lambert = max(0.0, dot(lightdir, normal));

    fragColor = color;
    // fragColor = vec4(vColor.rgb * (lightcolor * lambert)*0.5, 1.0);
}