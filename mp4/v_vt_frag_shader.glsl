#version 300 es
precision highp float;
uniform sampler2D image;

uniform vec4 color; 

// in vec3 outnormal;
// in vec3 vPosition;
in vec2 vTexCoord;

uniform vec3 lightdir;
out vec4 fragColor;

void main() {
    // vec3 normal = normalize(outnormal);
    // float lambert = max(0.0, dot(lightdir, normal));
    vec4 textureColor = texture(image, vTexCoord);
    fragColor = vec4((textureColor.rgb * lambert), 1.0); // original (unused atm)
}