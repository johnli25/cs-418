// import * as math from "./math.js";

/** @global global vertex buffer CPU-based vertex movement */
var vertexBufGlobal;

/** @global global flag to alternate between x-motions */
var left_mvt_flag = true;

/** @global global variables to store canvas and mouse cursor X and Y positions */
var mouseX;
var mouseY;
var canvas_global

/** @global global logo data for CPU-based vertex movement */
var global_logo = {"triangles":
    [0, 1, 2,
    1,2,3,
    4,5,6,
    5,6,7,
    8,9,10,
    9,10,11,

    12,13,14,
    13,14,15,
    16,17,18,
    17,18,19,
    20,21,22,
    21,22,23
    ]
,"attributes":
    {"position":
    [[-0.99, 0.99]
    ,[ -0.99, 0.66]
    ,[ 0.04, 0.99]
    ,[0.04, 0.66]

    ,[-0.74, 0.66]
    ,[-0.74, 0]
    ,[-0.21, 0.66]
    ,[-0.21, 0]

    ,[-0.99, 0]
    ,[-0.99, -0.33]
    ,[0.04, 0]
    ,[0.04, -0.33]
    ,

    [-0.95, 0.95]
    ,[ -0.95, 0.70]
    ,[ 0, 0.95]
    ,[0, 0.70]

    ,[-0.7, 0.7]
    ,[-0.7, -0.29]
    ,[-0.25, 0.7]
    ,[-0.25, -0.29]

    ,[-0.95, -0.04]
    ,[-0.95, -0.29]
    ,[0, -0.04]
    ,[0, -0.29]]
    ,"color": [
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],
    [0.075,0.16,0.292],

    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0],
    [1,1,0]]
    }
}

/** compiles and links GLSL to rest of program and graphics 
 * @param {vs_source, fs_source}
*/
function compileAndLinkGLSL(vs_source, fs_source) {
    let vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    let fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    let program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    return program
}

/** set up geometry for required/part 1
 * @param {geom}
*/
function setupGeometry(geom) {
    // a "vertex array object" or VAO records various data provision commands
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    // Object.entries({k1:v1, k2:v2}) returns [[k1,v1],[k2,v2]]
    // [a, b, c].forEach(func) calls func(a), then func(b), then func(c)
    Object.entries(geom.attributes).forEach(([name,data]) => {
        // goal 1: get data from CPU memory to GPU memory 
        // createBuffer allocates an array of GPU memory
        let buf = gl.createBuffer() // do NOT repeat this line
        // to get data into the array we tell the GPU which buffer to use
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        // and convert the data to a known fixed-sized type
        let f32 = new Float32Array(data.flat())
        // then send that data to the GPU, with a hint that we don't plan to change it very often
        gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)
        
        // goal 2: connect the buffer to an input of the vertex shader
        // this is done by finding the index of the given input name
        let loc = gl.getAttribLocation(program, name)
        // telling the GPU how to parse the bytes of the array
        gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
        // and connecting the currently-used array to the VS input
        gl.enableVertexAttribArray(loc)
    })

    // We also have to explain how values are connected into shapes.
    // There are other ways, but we'll use indices into the other arrays
    var indices = new Uint16Array(geom.triangles.flat())
    // we'll need a GPU array for the indices too
    var indexBuffer = gl.createBuffer()
    // but the GPU puts it in a different "ready" position, one for indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    // we return all the bits we'll need to use this work later
    return {
        mode:gl.TRIANGLES,      // grab 3 indices per triangle
        count:indices.length,   // out of this many indices overall
        type:gl.UNSIGNED_SHORT, // each index is stored as a Uint16
        vao:triangleArray       // and this VAO knows which buffers to use
    }
}

/** set up geometry for CPU-based vertex movement
 * @param {geomCPU}
*/
function setupGeometryCPU(geomCPU) {
    // a "vertex array object" or VAO records various data provision commands
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    // Object.entries({k1:v1, k2:v2}) returns [[k1,v1],[k2,v2]]
    // [a, b, c].forEach(func) calls func(a), then func(b), then func(c)
    Object.entries(geomCPU.attributes).forEach(([name,data]) => {
        // goal 1: get data from CPU memory to GPU memory 
        // createBuffer allocates an array of GPU memory
        let buf = gl.createBuffer()
        if (name == "position"){
            vertexBufGlobal = buf 
            // to get data into the array we tell the GPU which buffer to use
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufGlobal)
            // and convert the data to a known fixed-sized type
            let f32 = new Float32Array(data.flat())
            // then send that data to the GPU, with a hint that we don't plan to change it very often
            gl.bufferData(gl.ARRAY_BUFFER, f32, gl.DYNAMIC_DRAW)
        } else { //name == "color"
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            // and convert the data to a known fixed-sized type
            let f32 = new Float32Array(data.flat())
            // then send that data to the GPU, with a hint that we don't plan to change it very often
            gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)
        }
        // goal 2: connect the buffer to an input of the vertex shader
        // this is done by finding the index of the given input name
        let loc = gl.getAttribLocation(program, name)
        // telling the GPU how to parse the bytes of the array
        gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
        // and connecting the currently-used array to the VS input
        gl.enableVertexAttribArray(loc)
    })

    // We also have to explain how values are connected into shapes.
    // There are other ways, but we'll use indices into the other arrays
    var indices = new Uint16Array(geomCPU.triangles.flat())
    // we'll need a GPU array for the indices too
    var indexBuffer = gl.createBuffer()
    // but the GPU puts it in a different "ready" position, one for indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW)

    // we return all the bits we'll need to use this work later
    return {
        mode:gl.TRIANGLES,      // grab 3 indices per triangle
        count:indices.length,   // out of this many indices overall
        type:gl.UNSIGNED_SHORT, // each index is stored as a Uint16
        vao:triangleArray       // and this VAO knows which buffers to use
    }
}

/**
 * Animation callback for the first display. Should be invoked as 
 * `window.pending = requestAnimationFrame(draw1)`
 * and invokes that on itself as well; to stop it, call
 * `cancelAnimationFrame(window.pending)`
 *
 * Fills the screen with Illini Orange
 */
function draw1() {
    gl.clearColor(1, 0.373, 0.02, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    window.pending = requestAnimationFrame(draw1)
}
/**
 * Animation callback for the second display. See {draw1} for more.
 *
 * Fills the screen with Illini Blue
 */
function draw2() {
    gl.clearColor(0.075, 0.16, 0.292, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    window.pending = requestAnimationFrame(draw2)
}

/**
 * Matrix math suite/library:
 * multiple matrix/math functions, including rotation (x,y or z), multiplication, 
 * dot product, translation, scaling, transpose, row, dot product, etc.
 * @param {ang, dx, dy, dz, sx, sy, sz, m, r, args...}
 */
const m4rotX = (ang) => { // around x axis
    let c = Math.cos(ang), s = Math.sin(ang);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}
const m4rotY = (ang) => { // around y axis
    let c = Math.cos(ang), s = Math.sin(ang);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}
const m4rotZ = (ang) => { // around z axis
    let c = Math.cos(ang), s = Math.sin(ang);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
}

const m4trans = (dx,dy,dz) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, dx,dy,dz,1])

const m4scale = (sx,sy,sz) => new Float32Array([sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1])

const m4row = (m,r) => new m.constructor(4).map((e,i)=>m[r+4*i])
const m4rowdot = (m,r,v) => m[r]*v[0] + m[r+4]*v[1] + m[r+8]*v[2] + m[r+12]*v[3]
const m4col = (m,c) => m.slice(c*4,(c+1)*4)
const m4transpose = (m) => m.map((e,i) => m[((i&3)<<2)+(i>>2)])
const m4mul = (...args) => args.reduce((m1,m2) => {
    if(m2.length == 4) return m2.map((e,i)=>m4rowdot(m1,i,m2)) // m*v
    if(m1.length == 4) return m1.map((e,i)=>m4rowdot(m2,i,m1)) // v*m
    let ans = new m1.constructor(16)
    for(let c=0; c<4; c+=1) for(let r=0; r<4; r+=1)
      ans[r+c*4] = m4rowdot(m1,r,m4col(m2,c))
    return ans // m*m
})

/**
 * Animation callback for the third display (required/part 1). See {draw1} for more.
 * Scaling/Shrinking + Rotation around Z-axis
 * @param {seconds}
 */
function draw3(seconds) {
    gl.useProgram(program)
    let rot_mat = m4rotZ(0.002 * seconds)
    let scale_mat = m4scale(1/(0.001 * seconds), 1/(0.001 * seconds), 1/(0.001 * seconds))
    let combined_mat = m4mul(rot_mat, scale_mat)
    // let combined_mat = ([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
    let matrixBindPoints = gl.getUniformLocation(program, 'combined_mat') // getUniformLocation finds and allocates address space/location of variable
    gl.uniformMatrix4fv(matrixBindPoints, false, combined_mat)

    gl.bindVertexArray(geom.vao)  // and the buffers
    gl.drawElements(geom.mode, geom.count, geom.type, 0) // then draw things
    window.pending = requestAnimationFrame(draw3)
}

/**
 * Animation callback for fourth display. See {draw1} for more.
 * Other, non-logo animation for part 1
 * @param {seconds}
 */
function draw4(seconds) {
    gl.useProgram(programOther)
    let rot_mat = m4rotY(-0.005 * seconds)
    let scale_mat = m4scale(-1/(0.001 * seconds), 1/(0.001 * seconds), -1/(0.001 * seconds))
    let combined_mat = m4mul(rot_mat, scale_mat)
    let matrixBindPoints = gl.getUniformLocation(programOther, 'combined_mat') // getUniformLocation finds and allocates address space/location of variable
    gl.uniformMatrix4fv(matrixBindPoints, false, combined_mat)

    gl.bindVertexArray(geomOther.vao)  // and the buffers
    gl.drawElements(geomOther.mode, geomOther.count, geomOther.type, 0) // then draw things
    window.pending = requestAnimationFrame(draw4)
}

/**
 * Animation callback for fifth display. See {draw1} for more.
 * GPU-based vertex mvmt
 * @param {seconds}
 */
function draw5(seconds) {
    gl.useProgram(programGPU)
    let secondsBindPoint = gl.getUniformLocation(programGPU, 'seconds')
    gl.uniform1f(secondsBindPoint, seconds/1000)
    gl.bindVertexArray(geomGPU.vao)  // and the buffers
    gl.drawElements(geomGPU.mode, geomGPU.count, geomGPU.type, 0) // then draw things
    window.pending = requestAnimationFrame(draw5)
}

/**
 * Animation callback for sixth display. See {draw1} for more.
 * CPU-based vertex mvmt
 * @param {seconds}
 */
function draw6(seconds) {
    gl.useProgram(programCPU)

    gl.bindVertexArray(geomCPU.vao)  // and the buffers
    // to get data into the array we tell the GPU which buffer to use
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufGlobal)
    let data = global_logo
    y = Math.abs((seconds % 2800) - 1400);
    for (let i = 0; i < data.attributes.position.length; i++){
        if (left_mvt_flag == true) {
            data.attributes.position[i][0] += (y * 0.00005)
            if (data.attributes.position[23][0] >= 1.0)
                left_mvt_flag = false
        }
        else if (left_mvt_flag == false) {// false 
            data.attributes.position[i][0] -= (y * 0.00005)
            if (data.attributes.position[0][0] <= -1.0)
                left_mvt_flag = true
        }
    }
    // global_logo.attributes.position = data.attributes.position //update global logo data
    let f32 = new Float32Array(global_logo.attributes.position.flat())
    // then send that data to the GPU, with a hint that we don't plan to change it very often
    gl.bufferData(gl.ARRAY_BUFFER, f32, gl.DYNAMIC_DRAW)
    
    gl.drawElements(geomCPU.mode, geomCPU.count, geomCPU.type, 0) // then draw things
    window.pending = requestAnimationFrame(draw6)
}

/**
 * Animation callback for seventh display. See {draw1} for more.
 * collisions
 * @param {seconds}
 */
function draw7(seconds) {
    gl.useProgram(programCollision)
    y = Math.abs((seconds % 2820) - 1410);
    let combined_mat = m4trans(y*0.0005, 0, 0)
    let matrixBindPoints = gl.getUniformLocation(programCollision, 'combined_mat') // getUniformLocation finds and allocates address space/location of variable
    gl.uniformMatrix4fv(matrixBindPoints, false, combined_mat)
    gl.bindVertexArray(geomCollision.vao)  // and the buffers
    gl.drawElements(geomCollision.mode, geomCollision.count, geomCollision.type, 0) // then draw things

    combined_mat = m4trans(-y*0.0005, 0, 0)
    let matrixBindPoints2 = gl.getUniformLocation(programCollision, 'combined_mat') // getUniformLocation finds and allocates address space/location of variable
    gl.uniformMatrix4fv(matrixBindPoints2, false, combined_mat)
    gl.bindVertexArray(geomCollision2.vao)  // and the buffers
    gl.drawElements(geomCollision2.mode, geomCollision2.count, geomCollision2.type, 0) // then draw things

    window.pending = requestAnimationFrame(draw7)
}

/**
 * Animation callback for eighth display. See {draw1} for more.
 * Psychedelic
 * @param {seconds}
 */
function draw8(seconds) {
    gl.useProgram(programPsych)
    let secondsBindPoint = gl.getUniformLocation(programPsych, 'seconds')
    gl.uniform1f(secondsBindPoint, seconds/1000)
    gl.bindVertexArray(geomPysch.vao)  // and the buffers
    gl.drawElements(geomPysch.mode, geomPysch.count, geomPysch.type, 0) // then draw things
    window.pending = requestAnimationFrame(draw8)
}

/**
 * Animation callback for seventh display. See {draw1} for more.
 * Psychedelic
 * @param {seconds}
 */
function draw9(seconds) {
    gl.clearColor(1, 0.373, 0.02, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(programMouse)
    // let combined_mat = m4trans(0,0,0) // (Mouse.x - canvas.offsetLeft) / canvas.width
    let combined_mat = m4trans(2*(mouseX - canvas_global.offsetLeft) / canvas_global.width, (-2*(mouseY - canvas_global.offsetTop) / canvas_global.height) + (canvas_global.offsetTop + 0.4*canvas_global.height) / canvas_global.height, 0)
    let matrixBindPoints = gl.getUniformLocation(programMouse, 'combined_mat') // getUniformLocation finds and allocates address space/location of variable
    gl.uniformMatrix4fv(matrixBindPoints, false, combined_mat)

    gl.bindVertexArray(geomMouse.vao)  // and the buffers
    gl.drawElements(geomMouse.mode, geomMouse.count, geomMouse.type, 0) // then draw things
    window.pending = requestAnimationFrame(draw9)
}

/** Callback for when the radio button selection changes */
function radioChanged() {
    let chosen = document.querySelector('input[name="example"]:checked').value
    cancelAnimationFrame(window.pending)
    window.pending = requestAnimationFrame(window['draw'+chosen])
}

/** Resizes the canvas to be a square that fits on the screen with at least 20% vertical padding */
function resizeCanvas() {
    let c = document.querySelector('canvas')
    c.width = c.parentElement.clientWidth
    c.height = document.documentElement.clientHeight * 0.8
    if (c.width > c.height) c.width = c.height
    else c.height = c.width
}

/** asynchrounous setup: build data & waiting for and linking fragment and vertex WebGL shaders 
 * @parameter {event}
*/
async function setup(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('vertex_shader_mp2.glsl').then(res => res.text())
    let fs = await fetch('fragment_shader_mp2.glsl').then(res => res.text())
    window.program = compileAndLinkGLSL(vs,fs)
    let data = await fetch('illini.json').then(r=>r.json())
    window.geom = setupGeometry(data)
}

/** asynchrounous setup: build data & waiting for and linking fragment and vertex WebGL shaders 
 * for other animation in part 1
 * @parameter {event}
*/
async function setupOther(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('vertex_shader_mp2.glsl').then(res => res.text())
    let fs = await fetch('fragment_shader_mp2.glsl').then(res => res.text())
    window.programOther = compileAndLinkGLSL(vs,fs)
    let data = await fetch('illini2.json').then(r=>r.json())
    window.geomOther = setupGeometry(data) 
}

/** GPU-based vertex movement setup: build data & waiting for and linking fragment and vertex WebGL shaders 
 * for GPU animation in part 2
 * @parameter {event}
*/
async function setupGPU(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('gpu_vertex_shader.glsl').then(res => res.text())
    let fs = await fetch('gpu_frag_shader.glsl').then(res => res.text())
    window.programGPU = compileAndLinkGLSL(vs,fs)
    let data = await fetch('illini.json').then(r=>r.json())
    window.geomGPU = setupGeometry(data) 
}

/** CPU-based vertex movement setup: build data & waiting for and linking fragment and vertex WebGL shaders 
 * for CPU animation in part 2
 * @parameter {event}
*/
async function setupCPU(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('cpu_vertex_shader.glsl').then(res => res.text())
    let fs = await fetch('cpu_frag_shader.glsl').then(res => res.text())
    window.programCPU = compileAndLinkGLSL(vs,fs)
    let data = await fetch('illini.json').then(r=>r.json())
    window.geomCPU = setupGeometryCPU(data) 
}

/* collision of 2 objects setup: build data & waiting for and linking fragment and vertex WebGL shaders 
 * for collision in part 2
 * @parameter {event}
*/
async function setupCollision(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('vertex_shader_mp2.glsl').then(res => res.text())
    let fs = await fetch('fragment_shader_mp2.glsl').then(res => res.text())
    window.programCollision = compileAndLinkGLSL(vs,fs)
    let data = await fetch('obj1.json').then(r=>r.json())
    window.geomCollision = setupGeometry(data)
    let data2 = await fetch('obj2.json').then(r=>r.json())
    window.geomCollision2 = setupGeometry(data2)
}

/* Psychedelic setup: build data & waiting for and linking fragment and vertex WebGL shaders 
 * for collision in part 2
 * @parameter {event}
*/
async function setupPsych(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('psych_vertex_shader.glsl').then(res => res.text())
    let fs = await fetch('psych_frag_shader.glsl').then(res => res.text())
    window.programPsych = compileAndLinkGLSL(vs,fs)
    let data = await fetch('psych.json').then(r=>r.json())
    window.geomPysch = setupGeometry(data)
}

/* Mouse movement setup: build data & waiting for and linking fragment and vertex WebGL shaders 
 * for mouse movement in part 2
 * @parameter {event}
*/
async function setupMouse(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('mouse_vertex_shader.glsl').then(res => res.text())
    let fs = await fetch('mouse_frag_shader.glsl').then(res => res.text())
    window.programMouse = compileAndLinkGLSL(vs,fs)
    let data = await fetch('obj1.json').then(r=>r.json())
    window.geomMouse = setupGeometry(data)
}

/**
 * Initializes WebGL and event handlers after page is fully loaded.
 * This example uses only `gl.clear` so it doesn't need any shaders, etc;
 * any real program would initialize models, shaders, and programs for each
 * display and store them for future use before calling `radioChanged` and
 * thus initializing the render.
 */
window.addEventListener('load',(event)=>{
    // resizeCanvas()
    window.gl = document.querySelector('canvas').getContext('webgl2')
    canvas_global = document.querySelector('canvas')
    console.log(canvas_global)
    console.log(canvas_global.offsetLeft)
    console.log(canvas_global.width)
    setupOther()
    setup()
    setupGPU()
    setupCPU()
    setupCollision()
    setupPsych()
    setupMouse()
    document.querySelectorAll('input[name="example"]').forEach(elem => {
        elem.addEventListener('change', radioChanged)
    })
    radioChanged()
})

window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX
    mouseY = e.clientY
    console.log((mouseX - canvas_global.offsetLeft) / canvas_global.width)
    console.log(-1*(mouseY + canvas_global.offsetTop) / canvas_global.height)
});
