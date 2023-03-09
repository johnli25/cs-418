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

    window.program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
}

function supplyDataBuffer(data, program, vsIn, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    let f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    let loc = gl.getAttribLocation(program, vsIn)
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

function setupGeometry(geom) {
    // a "vertex array object" or VAO records various data provision commands
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    // Object.entries({k1:v1, k2:v2}) returns [[k1,v1],[k2,v2]]
    // [a, b, c].forEach(func) calls func(a), then func(b), then func(c)
    Object.entries(geom.attributes).forEach(([name,data]) => {
        // goal 1: get data from CPU memory to GPU memory 
        // createBuffer allocates an array of GPU memory
        let buf = gl.createBuffer()
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

/**
 * Animation callback for the first display. Should be invoked as 
 * `window.pending = requestAnimationFrame(draw1)`
 * and invokes that on itself as well; to stop it, call
 * `cancelAnimationFrame(window.pending)`
 *
 * Fills the screen with Illini Orange
 */
function draw1(milliseconds) {
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

const m4rotX = (ang) => { // around x axis
    let c = Math.cos(ang), s = Math.sin(ang);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}

function draw3() {
    // gl.clearColor(1, 0.373, 0.02, 1)
    // gl.clear(gl.COLOR_BUFFER_BIT) 
    gl.useProgram(program)
    // let rot_mat = m4rotX(3.14)
    let rot_mat = new Float32Array([1,0,0,0,
                      0,0,0,0,
                      0,0,0,0,
                      0,0,0,0])
    let matrixBindPoints = gl.getUniformLocation(program, 'rot_mat') // getUniformLocation finds and allocates address space/location of variable
    gl.uniformMatrix4fv(matrixBindPoints, false, rot_mat)

    window.pending = requestAnimationFrame(draw3)
    gl.useProgram(program)        // pick the shaders
    gl.bindVertexArray(geom.vao)  // and the buffers
    gl.drawElements(geom.mode, geom.count, geom.type, 0) // then draw things
}

/** Callback for when the radio button selection changes */
function radioChanged() {
    let chosen = document.querySelector('input[name="example"]:checked').value
    cancelAnimationFrame(window.pending)
    if (chosen == 3)
        console.log("hi")
    window.pending = requestAnimationFrame(window['draw'+chosen])
}

/** Resizes the canvas to be a square that fits on the screen with at least 20% vertical padding */
function resizeCanvas() {
    let c = document.querySelector('canvas')
    c.width = c.parentElement.clientWidth
    c.height = document.documentElement.clientHeight * 0.8
    console.log(c.width, c.height)
    if (c.width > c.height) c.width = c.height
    else c.height = c.width
}

async function setup(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('vertex_shader_mp2.glsl').then(res => res.text())
    let fs = await fetch('fragment_shader_mp2.glsl').then(res => res.text())
    compileAndLinkGLSL(vs,fs)
    let data = await fetch('illini.json').then(r=>r.json())
    console.log(data)
    window.geom = setupGeometry(data)
}

/**
 * Initializes WebGL and event handlers after page is fully loaded.
 * This example uses only `gl.clear` so it doesn't need any shaders, etc;
 * any real program would initialize models, shaders, and programs for each
 * display and store them for future use before calling `radioChanged` and
 * thus initializing the render.
 */
window.addEventListener('load',(event)=>{
    resizeCanvas()
    window.gl = document.querySelector('canvas').getContext('webgl2')
    setup()
    document.querySelectorAll('input[name="example"]').forEach(elem => {
        elem.addEventListener('change', radioChanged)
    })
    radioChanged()
})