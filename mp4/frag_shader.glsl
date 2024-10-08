#version 300 es
precision highp float;
uniform sampler2D image;

uniform vec4 color; 

uniform bool fog_mode;

in vec3 outnormal;
// in vec3 vPosition;
in vec2 vTexCoord;

uniform vec3 lightdir;
out vec4 fragColor;

void main() {
    // vec3 mainColor = vec3(0.0);
    // mainColor += (vec3(color));

    vec3 normal = normalize(outnormal);

    float lambert = max(0.0, dot(lightdir, normal));
    vec4 textureColor = texture(image, vTexCoord);
    float alpha = 1.0;
    if (fog_mode == true){
        alpha = (1.0 - pow(gl_FragCoord.z, 225.0)); // "flip" it so it's foggier when you're farther away and less foggy when close
        // also since my near plane = 0.01, the z/w will be very huge making the fog extremely bright. So raising the z-coord by exp^(225.0) will offset the brightness 
    }
    fragColor = vec4((textureColor.rgb * lambert), alpha); // original (unused atm)
}