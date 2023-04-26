#version 300 es
precision highp float;
uniform sampler2D image;

uniform vec4 color; // constant orange colr - deprecated?

in vec3 outnormal;
// in vec3 vPosition;
// in vec2 vTexCoord;

uniform vec3 lightdir;

in vec4 vColor;
out vec4 fragColor;

void main() {
    vec3 normal = normalize(outnormal);

    float lambert = max(0.0, dot(lightdir, normal));
    // vec4 textureColor = texture(image, vTexCoord);
    fragColor = vec4((vColor.rgb * lambert), 1.0); // original (unused atm)
}