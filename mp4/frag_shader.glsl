#version 300 es
precision highp float;
uniform sampler2D image;

uniform vec4 color; 
uniform vec4 fog_color;

uniform bool height_color_ramp_flag;
uniform bool shiny_flag;
uniform bool rocky_cliffs_flag;

in vec3 outnormal;
in vec3 vPosition;
in vec2 vTexCoord;

uniform vec3 eyedir;

#define Z_MIN -0.90
#define Z_MAX 0.90
// const vec3 lightdir = vec3(0, 0, 1.0);

uniform vec2 resolution;
uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;
uniform vec3 lightdir2;
uniform vec3 lightcolor2;
uniform vec3 halfway2;
out vec4 fragColor;

void main() {
    // base terrain + colors: 
    vec3 mainColor = vec3(0.0);
    mainColor += (vec3(color));

    vec3 normal = normalize(outnormal);

    float lambert = max(0.0, dot(lightdir, normal));
    vec4 textureColor = texture(image, vTexCoord);
    // if (gl_FragCoord.z == 0.0)
    fragColor = vec4((textureColor.rgb * lambert), 1.0); // original (unused atm)
    // if (gl_FragCoord.z == 1.0)
        // fragColor = vec4((fog_color.rgb * lambert), 0.502);
}