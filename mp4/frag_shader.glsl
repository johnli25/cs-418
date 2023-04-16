#version 300 es
precision highp float;
uniform sampler2D image;

uniform vec4 color; 
uniform vec4 fog_color;

uniform bool height_color_ramp_flag;
uniform bool shiny_flag;
uniform bool rocky_cliffs_flag;
uniform bool fog_mode;

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
    vec3 newTextureColor = vec3(0.0);
    vec4 gray_fog = vec4(0.0, 0.0, 0.0, 0.0);
    float alpha = 1.0;
    if (fog_mode == true){
        // vec4 gray_fog = vec4(0.502, 0.502, 0.502, 0.502);
        // newTextureColor += mix(textureColor.rgb, gray_fog.rgb, gl_FragCoord.z);
        alpha = 1.70*(1.0 - gl_FragCoord.z); // "flip" it so it's foggier when you're farther away and less foggy when close
    }
    fragColor = vec4((textureColor.rgb * lambert), alpha); // original (unused atm)
}