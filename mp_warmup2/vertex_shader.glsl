#version 300 es
uniform float seconds;
uniform int count;
void main() {
    float rad = sqrt((float(gl_VertexID)+0.5)/float(count));
    float ang = 2.399963229728653 * float(gl_VertexID) + seconds;
    gl_Position = vec4(rad*cos(ang), rad*sin(ang), 0, 1);
    gl_PointSize = 4.0;
}

/*illini.json reference (b/c JSON file don't allow comments smh)!*/
        // [[-0.9, 0.9]
        // ,[ -0.9, 0.6]
        // ,[ 0, 0.9]
        // ,[0, 0.6]
        // ,[-0.55, 0.6]
        // ,[-0.35, 0.6]
        // ,[-0.55, 0]
        // ,[-0.35, 0]
        // ,[-0.9, 0]
        // ,[-0.9, -0.3]
        // ,[0, 0]
        // ,[0, -0.3]

        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02],
        // [1,0.373,0.02]

// Vertex data for outer block I
// const g_outerVertices = [
//     // Top rectangle
//     [[-11.5, 17.0]],
//     [[11.5, 8.0]],
//     [[11.5, 17.0]],
//     [[-11.5, 8.0]],

//     // Middle rectangle
//     [[-6.5, 8.0]],
//     [[6.5, -8.0]],
//     [[6.5, 8.0]],
//     [[-6.5, -8.0]],

//     // Bottom rectangle
//     [[-11.5, -8.0]],
//     [[11.5, -17.0]],
//     [[11.5, -8.0]],
//     [[-11.5, -17.0]]
// ];

// // Vertex data for inner block I
// const g_innerVertices = [
//     // Top rectangle
//     [[-9.5, 15.0]],
//     [[9.5, 10.0]],
//     [[9.5, 15.0]],
//     [[-9.5, 10.0]],

//     // Middle rectangle
//     [[-4.5, 10.0]],
//     [[4.5, -10.0]],
//     [[4.5, 10.0]],
//     [[-4.5, -10.0]],

//     // Bottom rectangle
//     [[-9.5, -10.0]],
//     [[9.5, -15.0]],
//     [[9.5, -10.0]],
//     [[-9.5, -15.0]]
// ];

// // Index data
// const g_indices = [
//     // Top rectangle
//     0, 1, 2,
//     0, 3, 1,

//     // Middle rectangle
//     4, 5, 6,
//     4, 7, 5,

//     // Bottom rectangle
//     8, 9, 10,
//     8, 11, 9
// ];
