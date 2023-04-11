#version 300 es
in vec4 position;
in vec3 normal;

out vec3 outnormal;
out vec3 outnormal2;
out vec3 vPosition;
uniform mat4 p;
uniform mat4 mv;
uniform bool spheroid_flag;
void main() {
    gl_Position = p * mv * position;
    vPosition = position.xyz;
    outnormal2 = normal;
    outnormal = mat3(mv) * normal; //originally, normals stay constant/not-moving. THAT'S why...
    // you have to multiply the model-view matrix with the normals, so the normals + light sources
    // (eye + light) are in motion/changing the output normal vectors!
}