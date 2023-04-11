#version 300 es
precision highp float;
uniform vec4 color; 

uniform bool height_color_ramp_flag;
uniform bool shiny_flag;
uniform bool rocky_cliffs_flag;

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
    // base terrain + colors: 
    vec3 mainColor = vec3(0.0);
    mainColor += (vec3(color));

    vec3 normal = normalize(outnormal);
    vec3 x = normal * dot(normal, lightdir);

    // vec3 r = 2.0*x - lightdir;
    // float phongbit = max(0.0,dot(r,eyedir));
    // float phong = pow(phongbit, 20.0 );
    float lambert = max(0.0, dot(lightdir, normal));
    // fragColor = vec4((color.rgb * lambert) + vec3(phong, phong, phong)/10.0, color.a);

    // shiny-specular: NOTE! 
    float lambert2 = 0.0;
    float blinn = 0.0;
    float blinn2 = 0.0;

    //height-based color:
    vec2 uv = vec2(0.0);
    vec3 v_color = vec3(0.0);
    vec4 blue = vec4(0.0, 0.0, 0.0, 0.0);

    fragColor = vec4((mainColor.rgb * lambert), color.a); // original (unused atm)

    if (shiny_flag == true){
        lambert = max(dot(lightdir, normal), 0.0); 
        lambert2 = max(dot(lightdir2, normal), 0.0);
        blinn = pow(max(dot(halfway, normal), 0.0), 16.5);
        blinn2 = pow(max(dot(halfway2, normal), 0.0), 140.9);
    }
    if (height_color_ramp_flag == true){
        uv = gl_FragCoord.xy / resolution;
        v_color = vec3(0.0);
        blue = vec4(0.0, 0.0, 1.0, 1.0);
        v_color += mix(mainColor.rgb, blue.rgb, vPosition.z * 3.0);
        mainColor = vec3(0.0);
        mainColor += v_color;
    }
    if (rocky_cliffs_flag == true){
        if (normal.z <= 0.33 && normal.z >= -0.33){
            mainColor = vec3(0.0);
            vec3 green = vec3(0.0, 1.0, 0.0);
            // vec3 green = vec3(165.0/256.0, 42.0/256.0, 42.0/256.0);
            mainColor += green.rgb;
            if (shiny_flag == true){
                if (normal.z <= 0.27 && normal.z >= -0.27){
                    lambert = max(dot(lightdir, normal), 0.0); 
                    lambert2 = max(dot(lightdir2, normal), 0.0);
                    blinn = pow(max(dot(halfway, normal), 0.00), 7.5);
                    blinn2 = pow(max(dot(halfway2, normal), 0.00), 7.5);
                    // lambert = 0.0;
                    // lambert2 = 0.1;
                    // blinn = 0.0;
                    // blinn2 = 0.0;
                }
            }
        }
    }

    fragColor = vec4(
        mainColor.rgb * (lightcolor * lambert + lightcolor2 * lambert2)
        + (lightcolor*blinn + lightcolor2*blinn2)*16.5,
        color.a); //'lightcolor' makes the terrain slightly darker red-orange (than orange)

    // float lambert = dot(lightdir, normal);
    // fragColor = vec4(color.rgb * lambert, color.a);
    // fragColor = vec4(1, 0.373, 0.02, 1);
}