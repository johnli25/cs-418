/** @global Useful constant colors and other matrices (like Identity) */
const IlliniBlue = new Float32Array([0.00, 0.16, 0.84, 1])
const IlliniOrange = new Float32Array([232.0/256.0, 74.0/256.0, 39.0/256.0, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

// vector ops
const add = (x,y) => x.map((e,i)=>e+y[i])
const sub = (x,y) => x.map((e,i)=>e-y[i])
const mul = (x,s) => x.map(e=>e*s)
const div = (x,s) => x.map(e=>e/s)
const dot = (x,y) => x.map((e,i)=>e*y[i]).reduce((s,t)=>s+t)
const mag = (x) => Math.sqrt(dot(x,x))
const normalize = (x) => div(x,mag(x))
const cross = (x,y) => x.length == 2 ?
  x[0]*y[1]-x[1]*y[0] :
  x.map((e,i)=> x[(i+1)%3]*y[(i+2)%3] - x[(i+2)%3]*y[(i+1)%3])

// matrix ops
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

// graphics matrices
const m4trans = (dx,dy,dz) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, dx,dy,dz,1])
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
const m4fixAxes = (f, up) => { // f to -z, up to near +y
  f = normalize(f)
  let r = normalize(cross(f,up))
  let u = cross(r,f)
  return new Float32Array([
    r[0],u[0],-f[0],0,
    r[1],u[1],-f[1],0,
    r[2],u[2],-f[2],0,
    0,0,0,1
  ])
}
const m4scale = (sx,sy,sz) => new Float32Array([sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1])
const m4view = (eye, center, up) => m4mul(m4fixAxes(sub(center,eye), up), m4trans(-eye[0],-eye[1],-eye[2]))
const m4perspNegZ = (near, far, fovy, width, height) => {
  let sy = 1/Math.tan(fovy/2);
  let sx = sy*height/width;
  return new Float32Array([sx,0,0,0, 0,sy,0,0, 0,0,-(far+near)/(far-near),-1, 0,0,(2*far*near)/(near-far),0]);
}

// quaternion
const m4fromQ = (q) => { 
  let n = dot(q,q)
  let s = n ? 2/n : 0
  let xx = s*q[1]*q[1], xy = s*q[1]*q[2], xz = s*q[1]*q[3], xw = s*q[1]*q[0]
  let yy = s*q[2]*q[2], yz = s*q[2]*q[3], yw = s*q[2]*q[0]
  let zz = s*q[3]*q[3], zw = s*q[3]*q[0]
  return new Float32Array([
    1-yy-zz, xy+zw, xz-yw, 0,
    xy-zw, 1-xx-zz, yz+xw, 0,
    xz+yw, yz-xw, 1-xx-yy, 0,
    0,0,0,1,
  ])
}
const m4toQ = (m) => {
  let a00 = m[0], a11 = m[5], a22 = m[10]
  if (a00 + a11 + a22 > 0)
    return normalize([a00+a11+a22+1, m[6]-m[9], m[8]-m[2], m[1]-m[4]])
  if ((a00 > a11) && (a00 > a22))
    return normalize([m[6]-m[9], a00-a11-a22+1, m[1]+m[4], m[8]-m[2]])
  if (a11 > a22)
    return normalize([m[8]-m[2], m[1]+m[4], a11-a00-a22+1, m[6]+m[9]])
  return normalize([m[1]-m[4], m[2]+m[8], m[6]+m[9], a22-a00-a11+1])
}

// interpolation
const lerp = (t,p0,p1) => add(mul(p0,1-t), mul(p1,t))
const lbez = (t, ...p) => {
  while(p.length > 1) p = p.slice(1).map((e,i) => lerp(t,p[i],e))
  return p[0]
}
const bezcut = (t, ...p) => {
  let front = [], back = []
  while(p.length > 0) {
    front.push(p[0])
    back.unshift(p[p.length-1])
    p = p.slice(1).map((e,i) => lerp(t,p[i],e))
  }
  return [front, back]
}
const slerp = (t,q0,q1) => {
  let d = dot(q0,q1)
  if (d > 0.9999) return normalize(lerp(t,q0,q1))
  let o = Math.acos(d), den = Math.sin(o)
  return add(mul(q0, Math.sin((1-t)*o)/den), mul(q1, Math.sin(t*o)/den))
}
const qlerp = (t,q0,q1) => {
  let d = dot(q0,q1)
  if (d < 0) { q1 = mul(q1,-1); d = -d; }
  if (d > 0.9999) return normalize(lerp(t,q0,q1))
  let o = Math.acos(d), den = Math.sin(o)
  return add(mul(q0, Math.sin((1-t)*o)/den), mul(q1, Math.sin(t*o)/den))
}

const sbez = (t, ...p) => {
  while(p.length > 1) p = p.slice(1).map((e,i) => slerp(t,p[i],e))
  return p[0]
}
const qbez = (t, ...p) => {
  while(p.length > 1) p = p.slice(1).map((e,i) => qlerp(t,p[i],e))
  return p[0]
}

/** @global sphere variable for holding sphere */
var sphere;

/**
 * Sends per-vertex data to the GPU and connects it to a VS input
 * 
 * @param data    a 2D array of per-vertex data (e.g. [[x,y,z,w],[x,y,z,w],...])
 * @param program a compiled and linked GLSL program
 * @param vsIn    the name of the vertex shader's `in` attribute
 * @param mode    (optional) gl.STATIC_DRAW, gl.DYNAMIC_DRAW, etc
 * 
 * @returns the ID of the buffer in GPU memory; useful for changing data later
 */
function supplyDataBuffer(data, program, vsIn, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    let f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    let loc = gl.getAttribLocation(program, vsIn)
    // console.log("data", data)
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

/**
 * Creates a Vertex Array Object and puts into it all of the data in the given
 * JSON structure, which should have the following form:
 * 
 * ````
 * {"triangles": a list of of indices of vertices
 * ,"attributes":
 *  {name_of_vs_input_1: a list of 1-, 2-, 3-, or 4-vectors, one per vertex
 *  ,name_of_vs_input_2: a list of 1-, 2-, 3-, or 4-vectors, one per vertex
 *  }
 * }
 * ````
 * 
 * @returns an object with four keys:
 *  - mode = the 1st argument for gl.drawElements
 *  - count = the 2nd argument for gl.drawElements
 *  - type = the 3rd argument for gl.drawElements
 *  - vao = the vertex array object for use with gl.bindVertexArray
 */
function setupGeometry(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let name in geom.attributes) {
        let data = geom.attributes[name]
        supplyDataBuffer(data, program, name)
    }

    var indices = new Uint16Array(geom.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: triangleArray
    }
}

/** @global which represents "sphere" class: */
/** @global scale and translation reference arrays (for drawing 50+ spheres) */
scale = new Array()
trans = new Array() // retains original translations/positions (for resetting purposes too)
criticalStartPts = new Array()
colors = new Array()
for (let i = 0; i < 50; i += 1){
  rand_trans = new Array()
  rand_trans.push(parseFloat((Math.random() * (10 - (-10)) - 10).toFixed(4)))
  rand_trans.push(parseFloat((Math.random() * (5- (-5)) - 5).toFixed(4)))
  rand_trans.push(parseFloat((Math.random() * (2 - (-2)) - 2).toFixed(4)))
  trans.push(rand_trans)
  rand_trans_copy = JSON.parse(JSON.stringify(rand_trans))
  criticalStartPts.push(rand_trans_copy)
  scale.push(Math.random() * 0.15)
}

console.log("trans start", trans)

for (let i = 0; i < 50; i += 1){
  color = new Float32Array([Math.random(), Math.random(), Math.random(), 1])
  colors.push(color)
}

prevTime = Array.from(Array(50), dummyName => Array(3).fill(0))
prevTime[0][0] = 0.0
// console.log("prevtime", prevTime)
sphereCurrentY = new Array(50).fill(0)
sphereCurrentX = new Array(50).fill(0)
sphereCurrentZ = new Array(50).fill(0)
sphereRadius = new Array(50).fill(0)
sphereCurrentVelocityX = Array.from({length: 50}, () => (Math.random() * (2 - (-2)) - 2)) //replace '0' with Math.rand() later
sphereCurrentVelocityY= Array.from({length: 50}, () => (Math.random() * (2- (-2)) - 2)) //replace '0' with Math.rand() later
sphereCurrentVelocityZ = Array.from({length: 50}, () => (Math.random() * (2 - (-2)) - 2)) //replace '0' with Math.rand() later
// console.log("start x velo", sphereCurrentVelocityX)
// console.log("start y velo", sphereCurrentVelocityY)
// console.log("start z velo", sphereCurrentVelocityZ)
scale[0] = 0.15 //dummy initialization

/** function for drawing the 50 spheres (with varying positions, velocities, colors, and scaling factors).
 * incorporates x,y,z motions, drag, gravity, invisible bounding box collisions, etc.
 * @param milliseconds
 */
function draw(milliseconds){
    real_ms = milliseconds % 5000
    console.log(real_ms)
    if (real_ms >= 4980 && real_ms <= 5000){
      console.log("reset")
      reset()
    }
    gl.clearColor(0.075, 0.16, 0.292, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)
    gl.bindVertexArray(geom.vao)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p)
    window.v = m4view([1,1,3], [0,0,0], [0,1,0])

    let lightdir = normalize([0,0,1])
    gl.uniform3fv(gl.getUniformLocation(program, 'lightdir'), lightdir)

    gl.uniform3fv(gl.getUniformLocation(program, 'lightcolor'), [1,0.75,1])
    for (let i = 0; i < 50; i += 1){
        // console.log("sphere: ", i, "and current Y speed rn: " , sphereCurrentVelocityY[i])
        // console.log("current position: ", sphereCurrentY[i])
        sphereCurrentX[i] = criticalStartPts[i][0] + sphereCurrentVelocityX[i] * (real_ms - prevTime[i][0]) * 0.01
        sphereCurrentY[i] = criticalStartPts[i][1] + sphereCurrentVelocityY[i] * (real_ms - prevTime[i][1]) * 0.01
        sphereCurrentZ[i] = criticalStartPts[i][2] + sphereCurrentVelocityZ[i] * (real_ms - prevTime[i][2]) * 0.01
        sphereCurrentVelocityY[i] += -0.000980665 * (real_ms - prevTime[i][1]) * 0.01 // euler's approx method for velocity

        // if (milliseconds <= 8000){ //debug 
        //     // console.log("sphere # ", i, ": ", window.m)
        // } else {
        //     throw new Error("beyond 4 s")
        // }
        // console.log(sphereCurrentVelocityX)
        if (sphereCurrentY[i] <= -5.9){ // if y_position hits floor, negate velocity and travel other way
            criticalStartPts[i][1] = -5.9
            sphereCurrentVelocityY[i] *= -1.0
            // console.log("curr velocity: ", sphereCurrentVelocityY[i])
            prevTime[i][1] = real_ms
        }

        if (sphereCurrentY[i] >= 5.9){ // if y_position hits floor, negate velocity and travel other way
          criticalStartPts[i][1] = 5.9
          sphereCurrentVelocityY[i] *= -0.2
          prevTime[i][1] = real_ms
        }
        if (sphereCurrentX[i] <= -5.9){ // if x_position hits left, negate velocity and travel other way
          criticalStartPts[i][0] = -5.9
          sphereCurrentVelocityX[i] *= -0.7
          prevTime[i][0] = real_ms
        }
        if (sphereCurrentX[i] >= 5.9){ // if x_position hits right, negate velocity and travel other way
          criticalStartPts[i][0] = 5.9
          sphereCurrentVelocityX[i] *= -0.7
          prevTime[i][0] = real_ms
        }
        if (sphereCurrentZ[i] <= -4.1){ // if z_position hits back, negate velocity and travel other way
          criticalStartPts[i][2] = -4.1
          sphereCurrentVelocityZ[i] *= -0.7
          prevTime[i][2] = real_ms
        }
        if (sphereCurrentZ[i] >= 4.1){ // if z_position hits front, negate velocity and travel other way
          criticalStartPts[i][2] = 4.1
          sphereCurrentVelocityZ[i] *= -0.7
          prevTime[i][2] = real_ms
        }

      trans_mat = m4trans(sphereCurrentX[i], sphereCurrentY[i], sphereCurrentZ[i])
      window.m = m4mul(m4scale(scale[i], scale[i], scale[i]), trans_mat) // 1. set spheres to correct size

      gl.uniform4fv(gl.getUniformLocation(program, 'color'), colors[i])

      gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v, m))
      gl.drawElements(geom.mode, geom.count, geom.type, 0) // then draw things
    }

    window.pending = requestAnimationFrame(draw)
}

function reset(){ //function for reseting global variables, buffers, etc.
  sphereCurrentVelocityX = Array.from({length: 50}, () => (Math.random() * (2 - (-2)) - 2)) //replace '0' with Math.rand() later
  sphereCurrentVelocityY= Array.from({length: 50}, () => (Math.random() * (2- (-2)) - 2)) //replace '0' with Math.rand() later
  sphereCurrentVelocityZ = Array.from({length: 50}, () => (Math.random() * (2 - (-2)) - 2)) //replace '0' with Math.rand() later
  prevTime = Array.from(Array(50), dummyName => Array(3).fill(0))
  prevTime[0][0] = 0.0
  sphereCurrentY = Array.from({length: 50}, () => (0))
  sphereCurrentX = Array.from({length: 50}, () => (0))
  sphereCurrentZ = Array.from({length: 50}, () => (0))
  criticalStartPts = JSON.parse(JSON.stringify(trans))
  console.log("trans", trans)
  console.log("start pts", criticalStartPts)
  console.log("sphereCurrentVelocityX", sphereCurrentVelocityX)
  console.log("sphereCurrentVelocityY", sphereCurrentVelocityY)
  console.log("sphereCurrentVelocityZ", sphereCurrentVelocityZ)
  console.log("prevTime", prevTime)
  console.log("sphereCurrentX", sphereCurrentX)
  console.log("sphereCurrentY", sphereCurrentY)
  console.log("sphereCurrentZ", sphereCurrentZ)
  // throw new Error("check reset vars")
}

/** Resizes the canvas to completely fill the screen */
function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        window.p = m4perspNegZ(0.01, 100.0, 0.69, canvas.width, canvas.height)
    }
}

/**
 * Given the source code of a vertex and fragment shader, compiles them,
 * and returns the linked program.
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
    window.v = m4view([1,1,3], [0,0,0], [0,1,0])
    
    return program
}

async function setup(event){
    window.gl = document.querySelector('canvas').getContext('webgl2',
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    )
    let vs = await fetch('vertex_shader.glsl').then(res => res.text())
    let fs = await fetch('frag_shader.glsl').then(res => res.text())
    window.program = compileAndLinkGLSL(vs,fs)
    gl.enable(gl.DEPTH_TEST)

    let sphere_json = await fetch('sphere.json').then(res => res.json())
    sphere = sphere_json
    console.log(sphere)
    window.geom = setupGeometry(sphere)
    fillScreen()
    window.addEventListener('resize', fillScreen)
    requestAnimationFrame(draw)
}

window.addEventListener('load', setup)

