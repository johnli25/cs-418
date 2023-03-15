#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;

out vec4 vColor;

void main() {
    vColor = color;
    gl_Position = vec4(
        position.xy*cos(seconds*0.21),
        position.zw
    );
    // float rad = sqrt((float(gl_VertexID)+0.5)/float(count));
    // float ang = 2.399963229728653 * float(gl_VertexID) + seconds;
    // gl_Position = vec4(rad*cos(ang), rad*sin(ang), 0, 1);
    // gl_PointSize = 4.0;
}
