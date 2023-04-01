#version 300 es
precision highp float;
uniform vec4 color; 
// const vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
// const vec4 green = vec4(0.000, 1.000, 0.000, 1.0);
// const vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);
// const vec4 white = vec4(1.0, 1.0, 1.0, 1.0);

uniform bool height_color_ramp_flag;
uniform bool shiny_flag;

in vec3 outnormal;
in vec3 vPosition;

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
    vec3 normal = normalize(outnormal);
    vec3 x = normal * dot(normal, lightdir);

    // vec3 r = 2.0*x - lightdir;
    // float phongbit = max(0.0,dot(r,eyedir));
    // float phong = pow(phongbit, 20.0 );
    float lambert = max(0.0, dot(lightdir, normal));
    // fragColor = vec4((color.rgb * lambert) + vec3(phong, phong, phong)/10.0, color.a);
    fragColor = vec4((color.rgb * lambert), color.a);

    if (shiny_flag == true){
        lambert = max(dot(lightdir, normal), 0.1);
        float lambert2 = max(dot(lightdir2, normal), 0.1);
        float blinn = pow(max(dot(halfway, normal), 0.19), 156.9);
        float blinn2 = pow(max(dot(halfway2, normal), 0.420), 140.9);
        fragColor = vec4(
            color.rgb * (lightcolor * lambert + lightcolor2 * lambert2)
            + (lightcolor*blinn + lightcolor2*blinn2)*16.5,
            color.a);
    }

    if (height_color_ramp_flag == true){
        // float v_color = mix(color.rgb, green.rgb, 0.500);
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 v_color = vec3(0.0);

        vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
        vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);

        v_color += mix(color.rgb, blue.rgb, vPosition.z*3.0);

        fragColor = vec4((v_color.rgb * 2.0 * lambert), color.a);
    }

    // float lambert = dot(lightdir, normal);
    // fragColor = vec4(color.rgb * lambert, color.a);
    // fragColor = vec4(1, 0.373, 0.02, 1);
}