#version 300 es
precision highp float;

uniform vec4 color;
uniform vec3 lightdir;
uniform vec3 lightcolor;
in vec3 outNormal;
out vec4 fragColor;

void main() {
    vec3 normal = normalize(outNormal);
    float lambert = max(0.0, dot(lightdir, normal));

    // fragColor = color;
    fragColor = vec4(color.rgb * (lightcolor * lambert)*0.5, 1.0);
}