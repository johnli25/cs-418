/** @global IlliniOrange constant color */
const IlliniBlue = new Float32Array([0.00, 0.16, 0.84, 1])
const IlliniOrange = new Float32Array([0.2, 0.0, 0.8, 1])
const fogGray = new Float32Array([0.502, 0.502, 0.502, 0.6])

const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

/** @global global variables for holding size of grid and number of fractures*/
var gridXSize = 100;
var gridYSize = 100;
var fractures = 100;

/** @global grid/terrain */
terrain = {}

/** @global mp3 terrain prettification flags */
height_color_flag = false
shiny_flag = false
rocky_cliffs_flag = false
spheroid_flag = false

/**@global slot for texture read port */
var slot = 0; 

/** @global X, Y, and Z position for camera/eye */
var eyeCameraX = 0;
var eyeCameraY = 0;
var eyeCameraZ = 0;

/** @global x_angle and y_angle for camera/eye */
var x_angle = 0;
var y_angle = 0; 

/** @global toggle between ground and flight mode (vehicular mvmt) */
var toggleG = false;
var ground_mode = 0;

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

function fillGrid(width, height){
  let attribute = {}
  let positions = []
  let triangles = []
  let aTexCoord = []

  for (let i = 0; i < width + 1; i += 1){
      for (let j = 0; j < height + 1; j += 1){
          let coordinate = new Array(3)
          coordinate[0] = (j - (width / 2)) / ((width / 2)) // x
          coordinate[1] = (i - (height / 2)) / ((height / 2))
          coordinate[2] = 0
          positions.push(coordinate)
          aTexCoord.push(coordinate)
      }
  }

  for (let i = 0; i < width; i += 1){
      for (let j = 0; j < height; j += 1){
          let tri1 = new Array(3)
          let tri2 = new Array(3)
          let topleft = i*(width + 1) + j
          let topright = i*(width + 1) + j + 1
          let downleft = topleft + width + 1
          let downright = topleft + width + 2

          // combo 1: ALL orange
          tri1 = [topright, downleft, topleft] //swap topright and topleft <-> all black
          tri2 = [downright, downleft, topright] //swap downright and topright <-> all black

          triangles.push(tri1)
          triangles.push(tri2)
      }
  }
  terrain.attributes = attribute
  terrain.attributes.position = positions
  terrain.triangles = triangles
  terrain.attributes.aTexCoord = aTexCoord
}

function faultingMethod(fractures){
  for (let i = 0; i < fractures; i += 1){
    random = (Math.random() * (2.0000 * Math.PI - 0.0000) + 0.0000).toFixed(4)
    a = Math.sin(random)
    b = Math.cos(random)
    c = (Math.random() * (1 - (-1)) - 1).toFixed(4)
    for (let j = 0; j < terrain.attributes.position.length; j += 1){
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

    normals[i0][0] += n[0]
    normals[i0][1] += n[1]
    normals[i0][2] += n[2]

    normals[i1][0] += n[0]
    normals[i1][1] += n[1]
    normals[i1][2] += n[2]        

    normals[i2][0] += n[0]
    normals[i2][1] += n[1]
    normals[i2][2] += n[2]
  }
  for(let i=0; i<normals.length; i+=1) {
    normals[i] = normalize(normals[i])
  }
  data.attributes.normal = normals;
  console.log(data)
}

function verticalSeperation(data){
  x_min = 10
  x_max = -10
  z_min = 10
  z_max = -10
  for (let i = 0; i < data.attributes.position.length; i += 1){
    x_min = Math.min(x_min, data.attributes.position[i][0])
    x_max = Math.max(x_max, data.attributes.position[i][0])
    z_min = Math.min(z_min, data.attributes.position[i][2])
    z_max = Math.max(z_max, data.attributes.position[i][2])
  }
  h = (x_max - x_min)*(0.40)
  if (h != 0){
    for (let j = 0; j < data.attributes.position.length; j += 1){
      z = JSON.parse(JSON.stringify(data.attributes.position[j][2]))
      data.attributes.position[j][2] = h*(z - z_min)/(z_max - z_min) - h/2
    }
  }
}

function spheroidal_weathering(weathering, width, height){
  cnt = 0
  for (let j = 0; j < weathering; j += 1){
    for (let i = 0; i < terrain.attributes.position.length; i += 1){
      avg = 0.0;
      curr_x = i % (width + 1)
      curr_y = Math.floor(i / (height + 1))

      //calculate avg:
      for (let x = -3; x < 3; x += 1){
        for (let y = -3; y < 3; y += 1){
          x_cor = Math.max(0, Math.min(curr_x + x, width))
          y_cor = Math.max(0, Math.min(curr_y + y, height))
          avg += terrain.attributes.position[(x_cor)*width + y_cor][2] // z
        }
      }
      avg /= terrain.attributes.position.length
      cnt += 1
      original_z = terrain.attributes.position[i][2]
      terrain.attributes.position[i][2] = (original_z + avg) * 0.875
    }
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

    let lightdir = normalize([0,0,1])
    let halfway = normalize(add(lightdir, [0,0,1]))
    gl.uniform3fv(gl.getUniformLocation(program, 'lightdir'), lightdir)

    gl.uniform4fv(gl.getUniformLocation(program, 'color'), IlliniOrange)
    gl.uniform4fv(gl.getUniformLocation(program, 'fog_color'), fogGray)

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v,m))
    let bindPoint = gl.getUniformLocation(program, 'aTexCoord')
    gl.uniform1i(bindPoint, slot) // where `slot` is same it was in step 2 above
    gl.uniform1i(gl.getUniformLocation(program, 'image'), 0)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

/** @global */
var toggleG_cnt = 0;

/** Compute any time-varying or animated aspects of the scene */
function timeStep(milliseconds) {
    let seconds = milliseconds / 1000;
    window.m = m4mul(m4rotY(0), m4rotX(-Math.PI/2))
    if (keysBeingPressed['W'] || keysBeingPressed['w'])
        eyeCameraZ += 0.04
    if (keysBeingPressed['A'] || keysBeingPressed['a'])
        eyeCameraX -= 0.04
    if (keysBeingPressed['S'] || keysBeingPressed['s'])
        eyeCameraZ -= 0.04
    if (keysBeingPressed['D'] || keysBeingPressed['d'])
        eyeCameraX += 0.04
    // if (keysBeingPressed['t'])
    //     eyeCameraZ += 0.04
    // if (keysBeingPressed['v'])
    //     eyeCameraZ -= 0.04
    
    // the signs for rotations are "flipped" for some reason 
    if (keysBeingPressed['ArrowUp'])
        x_angle -= 0.04
    if (keysBeingPressed['ArrowDown'])
        x_angle += 0.04
    if (keysBeingPressed['ArrowLeft'])
        y_angle += 0.04
    if (keysBeingPressed['ArrowRight'])
        y_angle -= 0.04
    
    // vehicular camera mvmt (toggle between ground and flight)
    if ((keysBeingPressed['g'] || keysBeingPressed['G']) && (toggleG == false)) {
        toggleG_cnt += 1 
        ground_mode = toggleG_cnt % 2
        toggleG = true
    } 
    if ((keysBeingPressed['g']) == false)
        toggleG = false
    
    // 1) rotation around y-axis = move camera left/right 2) rotation around x-axis = move camera up/down
    if (ground_mode == false){
        origCameraY = 3
    } else {
        origCameraY = (1 - (-1))/gridXSize
    }
    window.v = m4mul(m4rotY(y_angle), m4rotX(x_angle), m4trans(eyeCameraX, eyeCameraY, eyeCameraZ), m4view([0,origCameraY,3], [0,0,0], [0,1,0]))
    draw()
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
        window.p = m4perspNegZ(1.0, 10, 0.79, canvas.width, canvas.height)
    }
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
    // let monkey = await fetch('monkey.json').then(res => res.json())
    // addNormals(monkey)

    fillGrid(100, 100)
    faultingMethod(100)
    addNormals(terrain)
    verticalSeperation(terrain)
    fillScreen()
    let img = new Image();
    img.crossOrigin = 'anonymous';
    // img.src = 'https://cs418.cs.illinois.edu/website/files/farm.jpg';
    img.src = 'farm.jpg'
    console.log(img)
    img.addEventListener('load', (event) => {
        slot = 0; // or a larger integer if this isn't the only texture
        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + slot);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(
            gl.TEXTURE_2D, // destination slot
            0, // the mipmap level this data provides; almost always 0
            gl.RGBA, // how to store it in graphics memory
            gl.RGBA, // how it is stored in the image object
            gl.UNSIGNED_BYTE, // size of a single pixel-color in HTML
            img, // source data
        );
        gl.generateMipmap(gl.TEXTURE_2D) // lets you use a mipmapping min filter
    });
    window.geom = setupGeometry(terrain)
    window.addEventListener('resize', fillScreen)
    requestAnimationFrame(timeStep)
}

window.addEventListener('load', setup)

// keyboard/camera motion: 
window.keysBeingPressed = {}
window.addEventListener('keydown', event => keysBeingPressed[event.key] = true)
window.addEventListener('keyup', event => keysBeingPressed[event.key] = false)

