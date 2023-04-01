#version 300 es
precision highp float;
uniform vec4 color; 
const vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 green = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);
const vec4 white = vec4(1.0, 1.0, 1.0, 1.0);

uniform bool height_color_ramp_flag;
uniform bool shiny_flag;

in vec3 outnormal;
in vec3 vPosition;

uniform vec3 eyedir;

#define Z_MIN -0.90
#define Z_MAX 0.90
// const vec3 lightdir = vec3(0, 0, 1.0);

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
        float delta = (Z_MAX - Z_MIN) / 5.0;
        float bound1 = Z_MIN + delta*1.0;
        float bound2 = Z_MIN + delta*2.0;
        float bound3 = Z_MIN + delta*3.0;
        float bound4 = Z_MIN + delta*4.0;
        if (vPosition.z >= Z_MIN && vPosition.z < bound1)
            fragColor = vec4((red.rgb * lambert), red.a);
        else if (vPosition.z >= bound1 && vPosition.z < bound2)
            fragColor = vec4((color.rgb * lambert), color.a);
        else if (vPosition.z >= bound2 && vPosition.z < bound3)
            fragColor = vec4((green.rgb * lambert), green.a);
        else if (vPosition.z >= bound3 && vPosition.z < bound4)
            fragColor = vec4((blue.rgb * lambert), blue.a);
        else if (vPosition.z >= bound4 && vPosition.z < Z_MAX)
            fragColor = vec4((white.rgb * lambert), white.a);
    }

    // float lambert = dot(lightdir, normal);
    // fragColor = vec4(color.rgb * lambert, color.a);
    // fragColor = vec4(1, 0.373, 0.02, 1);
}