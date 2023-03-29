/** @global IlliniOrange constant color */
const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

/** @global global variables for holding size of grid and number of fractures*/
var gridXSize;
var gridYSize;
var fractures;

/** @global grid/terrain */
terrain = {}

function fillGrid(width, height){
    let attribute = {}
    let positions = []
    let triangles = []

    for (let i = 0; i < width + 1; i += 1){
        for (let j = 0; j < height + 1; j += 1){
            let coordinate = new Array(3)
            coordinate[0] = (i - (width / 2)) / ((width / 2)) // x
            coordinate[1] = (j - (height / 2)) / ((height / 2))
            coordinate[2] = 0
            // positions[i * gridXSize + j] = coordinate
            positions.push(coordinate)
        }
    }

    for (let i = 0; i < width; i += 1){
        for (let j = 0; j < height; j += 1){
            let tri1 = new Array(3)
            let tri2 = new Array(3)
            let topleft = j*width + i 
            let topright = j*width + i + 1
            let downleft = topleft + width // + 1
            let downright = topleft + width + 1 //+ 2
            tri1 = [topleft, topright, downleft]
            tri2 = [topright, downleft, downright]

            triangles.push(tri1)
            triangles.push(tri2)
        }
    }
    terrain.attributes = attribute
    terrain.attributes.position = positions
    terrain.triangles = triangles
}

function faultingMethod(fractures){
  for (let i = 0; i < fractures; i += 1){
    random = (Math.random() * (2.0000 * Math.PI - 0.0000) + 0.0000).toFixed(4)
    a = Math.sin(random)
    b = Math.cos(random)
    c = (Math.random() * (1 - (-1)) - 1).toFixed(4)
    // console.log("a b c: ", a, b, c)
    for (let j = 0; j < terrain.attributes.position.length; j += 1){
      // console.log(terrain.attributes.position[j])
      coor_x = terrain.attributes.position[j][0]
      coor_y = terrain.attributes.position[j][1]
      coor_z = terrain.attributes.position[j][2]
      if (a * coor_x + b * coor_y - c > 0){
        terrain.attributes.position[j][2] += 0.03
      } else {
        terrain.attributes.position[j][2] -= 0.03
      }
    }
  }
}

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
    
    return program
}

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
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

/**
 * Resizes the canvas to completely fill the screen
 */
// function fillScreen() {
//     let canvas = document.querySelector('canvas')
//     document.body.style.margin = '0'
//     canvas.style.width = '100vw'
//     canvas.style.height = '100vh'
//     canvas.width = canvas.clientWidth
//     canvas.height = canvas.clientHeight
//     canvas.style.width = ''
//     canvas.style.height = ''
//     window.p = m4perspNegZ(1,9, 0.7, canvas.width, canvas.height)
//     if (window.gl) {
//         gl.viewport(0,0, canvas.width, canvas.height)
//         window.p = m4perspNegZ(1,9, 0.4, gl.canvas.width, gl.canvas.height)
//         draw()
//     }
// }

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

/**
 * Draw one frame
 */
function draw() {
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)

    gl.bindVertexArray(geom.vao)

    gl.uniform4fv(gl.getUniformLocation(program, 'color'), IlliniOrange)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v,m))
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

/** Compute any time-varying or animated aspects of the scene */
function timeStep(milliseconds) {
    let seconds = milliseconds / 1000;
    
    window.m = m4mul(m4rotY(seconds), m4rotX(-Math.PI/2))
    window.v = m4view([1,1,3], [0,0,0], [0,1,0])
    draw()
    console.log("timestep + draw")
    requestAnimationFrame(timeStep)
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
        window.p = m4perspNegZ(2.0, 10, 1.0, canvas.width, canvas.height)
    }
}

function addNormals(data) {
  cnt = 0
  let normals = new Array(data.attributes.position.length)
  for(let i=0; i<normals.length; i+=1) normals[i] = new Array(3).fill(0)
  for([i0,i1,i2] of data.triangles) {
    // find the vertex positions
    let p0 = data.attributes.position[i0]
    let p1 = data.attributes.position[i1]
    let p2 = data.attributes.position[i2]
    // find the edge vectors and normal
    let e0 = sub(p0,p2)
    let e1 = sub(p1,p2)
    let n = cross(e0,e1)

    // if (n[0] == 0 && n[1] == 0 && n[2] == 0){
    //     console.log("n: ", n)
    //     console.log("e0: ", e0)
    //     console.log("e1: ", e1)
    //     console.log("normals: ", normals)
    // }

    // loop over x, y and z
    // for(let j=0; j<3; j+=1) {
    //     // add a coordinate of a normal to each of the three normals
    //     normals[i0][j] += n[j]
    //     normals[i1][j] += n[j]
    //     normals[i2][j] += n[j]
    // }
    temp1 = normals[i0]
    temp2 = normals[i1]
    temp3 = normals[i2]
    // if (normals[i0][0] == 0 && normals[i0][1] == 0 && normals[i0][2] == 0){
    //   console.log("normals previously: ", normals[i0])
    // }

    normals[i0][0] += n[0]
    normals[i0][1] += n[1]
    normals[i0][2] += n[2]
    // if (normals[i0][0] == 0 && normals[i0][1] == 0 && normals[i0][2] == 0){
    //     // console.log("i0 normals prev: ", temp1)
    //     console.log("normals NOW: ", normals[i0])
    //     console.log("normals[0]: ", normals[i0][0] += n[0])
    //     console.log("normals[1]: ", normals[i0][1] += n[1])
    //     console.log("normals[2]: ", normals[i0][2] += n[2])
    //     cnt += 1
    //     console.log("n: ", n)
    // }

    normals[i1][0] += n[0]
    normals[i1][1] += n[1]
    normals[i1][2] += n[2]        

    normals[i2][0] += n[0]
    normals[i2][1] += n[1]
    normals[i2][2] += n[2]

    // if (normals[i1][0] == 0 && normals[i1][1] == 0 && normals[i1][2] == 0){
    //     console.log("i1 normals prev: ", temp2)
    //     console.log("normals NOW: ", normals[i1])
    //     console.log("normals[0]: ", normals[i1][0] += n[0])
    //     console.log("normals[1]: ", normals[i1][1] += n[1])
    //     console.log("normals[2]: ", normals[i1][2] += n[2])
    // }
    // if (normals[i2][0] == 0 && normals[i2][1] == 0 && normals[i2][2] == 0){
    //     console.log("i2 normals prev: ", temp3)
    //     console.log("normals NOW: ", normals[i2])
    //     console.log("normals[0]: ", normals[i2][0] += n[0])
    //     console.log("normals[1]: ", normals[i2][1] += n[1])
    //     console.log("normals[2]: ", normals[i2][2] += n[2])
    // }
  }
  for(let i=0; i<normals.length; i+=1) {
    if (normals[i][0] == 0 && normals[i][1] == 0 && normals[i][2] == 0){
      console.log("index: ", i)
      // console.log(data.attributes.position[i])
    }
    normals[i] = normalize(normals[i])
  }
  data.attributes.normal = normals;
  console.log(data)
}

async function setup(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2',
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    )
    let vs = await fetch('vertex_shader.glsl').then(res => res.text())
    let fs = await fetch('frag_shader.glsl').then(res => res.text())
    window.program = compileAndLinkGLSL(vs,fs)
    gl.enable(gl.DEPTH_TEST)
    let monkey = await fetch('monkey.json').then(res => res.json())
    // addNormals(terrain)
    addNormals(monkey)
    fillGrid(100, 100)
    addNormals(terrain)
    faultingMethod(100)
    window.geom = setupGeometry(terrain)
    fillScreen()
    window.addEventListener('resize', fillScreen)
    requestAnimationFrame(timeStep)
}

async function setupScene(scene, options) {
    console.log("To do: render",scene,"with options",options)
    gridXSize = options.resolution
    gridYSize = options.resolution
    fractures = options.slices
    fillGrid(gridXSize, gridYSize)
    addNormals(terrain)
    faultingMethod(fractures)
    // console.log(terrain)
}

/**
 * This function maps the controlOptions to an on-screen form and sends
 * changes in the on-screen form to the `setupScene` callback. 
 * 
 * You do not need to understand this code for any part of this class, but
 * its internal comments can help you do so if you are personally interested.
 */
window.addEventListener('load', event=> {
    let c = document.querySelector('#set1')
    // loop over the key:value pairs in the controlOptions object
    setup()
    Object.entries(controlOptions).forEach(([key,opt]) => {
        // make a radio button in a label for each item
        let r = document.createElement('input')
        r.type = 'radio'
        r.name = 'controlOptions'
        r.value = key
        let l = document.createElement('label')
        l.append(r)
        l.append(' ' + opt.label)
        c.append(l)
        // also listen for the radio button being selected to configure options
        r.addEventListener('change', event => {
            let k = event.target.value
            // erase any options from previous selections
            let d = document.querySelector('#set2')
            while (d.firstChild) d.firstChild.remove()
            // loop over each of the selected item's options
            if (opt.options) Object.entries(opt.options).forEach(([key,opt2]) => {
                if (opt2.type == 'radio') {
                    // if it's a radio-type, it's actually a list of options;
                    Object.entries(opt2.options).forEach(([v,l]) => {
                        // make one radio button and label for option
                        let rb = document.createElement('input')
                        rb.type = 'radio'
                        rb.name = key
                        rb.value = v
                        let lab = document.createElement('label')
                        lab.append(rb)
                        lab.append(l)
                        d.append(lab)
                    })
                    // and select the first radio button by default
                    d.querySelector('input[name="'+key+'"]').click()
                } else {
                    // not a radio, so it's a number, checkbox, or text type
                    // make an appropriate input element and label
                    let num = document.createElement('input')
                    num.type = opt2.type
                    num.name = key
                    num.value = opt2.default // for number, text
                    if (num.value != opt2.default)
                        num.checked = opt2.default // for checkbox
                    num.step = 'any' // for number; ignored otherwise
                    let lab = document.createElement('label')
                    lab.append(num)
                    lab.append(opt2.label)
                    d.append(lab)
                }
            })
        })
    })
    // select the first radio button by default
    c.querySelector('input[type="radio"]').click()
    
    // register a callback for the button too
    let b = document.querySelector('.controls input[type="submit"]')
    b.addEventListener('click', event => {
        event.preventDefault() // don't send the server a POST action
        // retrieve form data
        let form = document.querySelector('form')
        let data = new FormData(form)
        // extract and delete the top-level form item
        let scene = data.get('controlOptions')
        data.delete('controlOptions')
        // copy other content, converting number types and adding defaults as needed
        let options = Object.fromEntries(Array.from(data.entries()).map(([k,v])=>{
            let t = controlOptions[scene].options?.[k]?.['type']
            let d = controlOptions[scene].options?.[k]?.['default']
            if (t == 'number') return [k, Number(v)||d||0]
            if (t == 'checkbox') return [k, v == 'true']
            return [k,v]
        }))
        // add any missing options if they have defaults
        if (controlOptions[scene].options) Object.entries(controlOptions[scene].options).forEach(([k,v])=>{
            if (!(k in options)) {
                 if (v.type == 'checkbox') options[k] = false;
                 else if ('default' in v) options[k] = v.default
            }
        })
        // send the result to the scene generating callback function
        setupScene(scene, options)
        // setup()
    })
})
