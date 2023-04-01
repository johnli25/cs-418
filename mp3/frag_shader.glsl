#version 300 es
precision highp float;
uniform vec4 color; 

uniform bool height_color_ramp_flag;
uniform bool shiny_flag;

in vec3 outnormal;
in vec3 vPosition;

uniform vec3 eyedir;
// const vec3 lightdir = vec3(0.8, -0.6, 0);

#define Z_MIN = -0.90
#define Z_MAX = 0.90
const vec3 lightdir = vec3(0, 0, 1.0);

// uniform vec3 lightdir;
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
        float blinn = pow(max(dot(halfway, normal), 0.69), 100.9);
        float blinn2 = pow(max(dot(halfway2, normal), 0.420), 140.9);
        fragColor = vec4(
            color.rgb * (lightcolor * lambert + lightcolor2 * lambert2)
            + (lightcolor*blinn + lightcolor2*blinn2)*16.5,
            color.a);
    }

    // if (height_color_ramp_flag == true){
    //     if (vPosition.z > 0.0)
    //         fragColor = vec4((color.rgb * lambert), color.a);
    //     else
    //         fragColor = vec4((color2.rgb * 256.0 * lambert), color.a);
    // }
    // if (height_color_ramp_flag == true){
    //     float delta = (Z_MAX - Z_MIN) / 5
    //     float bound1 = z_min + delta
    //     float bound2 = z_min + delta*2
    //     float bound3 = z_min + delta*3
    //     float bound4 = z_min + delta*4
    // }

    // float lambert = dot(lightdir, normal);
    // fragColor = vec4(color.rgb * lambert, color.a);
    // fragColor = vec4(1, 0.373, 0.02, 1);
}