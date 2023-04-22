/** @global IlliniOrange constant color */
const IlliniBlue = new Float32Array([0.00, 0.16, 0.84, 1])
const IlliniOrange = new Float32Array([232.0/256.0, 74.0/256.0, 39.0/256.0, 1])
const backgroundFog = new Float32Array([0.702, 0.702, 0.702, 0.75])

const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

/** @global global variables for holding size of grid and number of fractures*/
var gridXSize = 100;
var gridYSize = 100;
var fractures = 100;

/** @global grid/terrain */
terrain = {}
example = {}

/** @global obj flags */
vtx_color_flag = false;
var vt_flag = false

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
var toggleG_cnt = 0;

/** @global toggle between fog and no-fog mode */
var toggleF = false;
var fog_mode = 0;
var toggleF_cnt = 0;

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

Math.blerp = function (z_x1_y1, z_x2_y1, z_x1_y2, z_x2_y2, x1, y1, x2, y2, x, y) {
  let q11 = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * z_x1_y1
  let q21 = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * z_x2_y1
  let q12 = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * z_x1_y2
  let q22 = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * z_x2_y2
  return q11 + q21 + q12 + q22
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
  h = (x_max - x_min)*(0.25)
  if (h != 0){
    for (let j = 0; j < data.attributes.position.length; j += 1){
      z = data.attributes.position[j][2]
      data.attributes.position[j][2] = h*(z - z_min)/(z_max - z_min) - h/2
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

function setupGeometryExample(geom) {
  var triangleArray = gl.createVertexArray()
  gl.bindVertexArray(triangleArray)

  for(let name in geom.attributes) {
      let data = geom.attributes[name]
      supplyDataBuffer(data, programExample, name)
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
    gl.clearColor(...backgroundFog) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)

    gl.bindVertexArray(geom.vao)

    let lightdir = normalize([0,0,1])
    let halfway = normalize(add(lightdir, [0,0,1]))
    gl.uniform3fv(gl.getUniformLocation(program, 'lightdir'), lightdir)

    gl.uniform4fv(gl.getUniformLocation(program, 'color'), IlliniOrange)
    gl.uniform4fv(gl.getUniformLocation(program, 'fog_color'), backgroundFog)

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v, m))

    // toggle fog
    if ((keysBeingPressed['f'] || keysBeingPressed['F']) && (toggleF == false)) {
      toggleF_cnt += 1
      fog_mode = toggleF_cnt % 2
      toggleF = true
    }
    if ((keysBeingPressed['f']) == false)
      toggleF = false

    gl.uniform1f(gl.getUniformLocation(program, 'fog_mode'), fog_mode)

    let bindPoint = gl.getUniformLocation(program, 'aTexCoord')
    gl.uniform1i(bindPoint, slot) // where `slot` is same it was in step 2 above
    gl.uniform1i(gl.getUniformLocation(program, 'image'), 0)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

function drawExample(milliseconds){
  let seconds = milliseconds / 1000
  gl.useProgram(programExample)

  gl.bindVertexArray(exampleGeom.vao)  // and the buffers

  let lightdir = normalize([0,0,1])
  gl.uniform3fv(gl.getUniformLocation(programExample, 'lightdir'), lightdir)
  gl.uniform4fv(gl.getUniformLocation(programExample, 'color'), IlliniOrange)
  gl.uniform1f(gl.getUniformLocation(programExample, 'vtx_color_flag'), vtx_color_flag)
  // console.log(vtx_color_flag)
  gl.uniformMatrix4fv(gl.getUniformLocation(programExample, 'p'), false, window.p)
  window.mExample = m4mul(m4trans(0, 0.69, 0), IdentityMatrix)
  window.mExample = m4mul(m4rotX(-Math.PI/2))

  gl.uniformMatrix4fv(gl.getUniformLocation(programExample, 'mv'), false, m4mul(window.v, window.mExample))
  let bindPoint = gl.getUniformLocation(programExample, 'aTexCoord')
  gl.uniform1i(bindPoint, slot) // where `slot` is same it was in step 2 above
  gl.uniform1i(gl.getUniformLocation(programExample, 'image'), 1)
  gl.drawElements(exampleGeom.mode, exampleGeom.count, exampleGeom.type, 0) // then draw things

  window.pending = requestAnimationFrame(drawExample)
}

/** Compute any time-varying or animated aspects of the scene */
function timeStep(milliseconds) {
    let seconds = milliseconds / 1000;
    if (keysBeingPressed['W'] || keysBeingPressed['w'])
        eyeCameraZ += 0.01
    if (keysBeingPressed['A'] || keysBeingPressed['a'])
        eyeCameraX += 0.01
    if (keysBeingPressed['S'] || keysBeingPressed['s'])
        eyeCameraZ -= 0.01
    if (keysBeingPressed['D'] || keysBeingPressed['d'])
        eyeCameraX -= 0.01
    
    // the signs for rotations are "flipped" for some reason 
    if (keysBeingPressed['arrowup'])
        x_angle -= 0.015
    if (keysBeingPressed['arrowdown'])
        x_angle += 0.015
    if (keysBeingPressed['arrowleft'])
        y_angle -= 0.015
    if (keysBeingPressed['arrowright'])
        y_angle += 0.015
    y_angle = Math.max(Math.min(y_angle, 100.0), -100.0)
    x_angle = Math.max(Math.min(x_angle, 100.0), -100.0)
    
    // vehicular camera mvmt: (toggle 'g' key between ground and flight)
    if ((keysBeingPressed['g'] || keysBeingPressed['G']) && (toggleG == false)) {
        toggleG_cnt += 1 
        ground_mode = toggleG_cnt % 2
        toggleG = true
    } 
    if ((keysBeingPressed['g']) == false)
        toggleG = false

    window.m = m4mul(m4rotX(-Math.PI/2))
    window.v = m4mul(m4rotY(y_angle), m4rotX(x_angle), m4trans(eyeCameraX, 0, eyeCameraZ), m4view([0,0.5,2.9], [10.0*y_angle,0.5,x_angle], [0,1,0]))
    // window.v = m4mul(m4trans(eyeCameraX, 0, eyeCameraZ), m4view([0, 0.20, 1.0], [0, 0.20, 0], [0,1,0]))
    // originally m4view([0,1,2.9], [0, 0 or 0.5, 0], [0,1,0])

    view_x = window.v[12]
    view_zy = window.v[14]
    view_x_floor = Math.floor(window.v[12] * 50.0) / 50.0
    view_zy_floor = Math.floor((window.v[14]) * 50.0)/ 50.0// can be interpreted as z or y in camera view coords. Also +1 offset
    view_x_ceil = Math.floor(window.v[12] * 50.0) / 50.0 + 0.02
    view_zy_ceil = Math.floor((window.v[14]) * 50.0) / 50.0 + 0.02
    // if ground_mode enabled, udpate view matrix with correct height (terrain height + offset)
    if (ground_mode == true && (Math.abs(view_x) <= 1 && Math.abs(view_zy) <= 1)) {
      // vehicular camera mvmt: grab view x,y,z coords and round them appropriately
      console.log("current x and y", view_x, "   ", view_zy)
      for (let j = 0; j < terrain.attributes.position.length - gridXSize - 1; j += 1){
        coor_x = terrain.attributes.position[j][0]
        coor_y = terrain.attributes.position[j][1]
        if (coor_x == view_x_floor && coor_y == view_zy_floor){
          z_x1_y1 = terrain.attributes.position[j][2]
          z_x2_y1 = terrain.attributes.position[j+1][2]
          z_x1_y2 = terrain.attributes.position[j+ gridXSize][2]
          z_x2_y2 = terrain.attributes.position[j+gridXSize+1][2]
          the_blerp = Math.blerp(z_x1_y1, z_x2_y1, z_x1_y2, z_x2_y2, coor_x, coor_y, view_x_ceil, view_zy_ceil, view_x, view_zy)
          // coor_z = terrain.attributes.position[j][2]
          coor_z = the_blerp
          break
        }
      }
      // window.v = m4mul(m4trans(0, coor_z - (1- (-1))/gridXSize - 0.15, 0), window.v)
      window.v[13] = coor_z - (2)/gridXSize - 0.15
    }
    draw()
    requestAnimationFrame(timeStep)

    if (keysBeingPressed['w'] || keysBeingPressed['s'] ||  keysBeingPressed['a'] || keysBeingPressed['d']){
      console.log("view", window.v) 
      console.log("view_x:", view_x_floor)
      console.log("view z y ", view_zy_floor)
      console.log("x floor: ", view_x_floor, "x ceil: ", view_x_ceil)
      // console.log(coor_z)
    }
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

async function setup(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2',
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    )
    let vs = await fetch('vertex_shader.glsl').then(res => res.text())
    let fs = await fetch('frag_shader.glsl').then(res => res.text())
    window.program = compileAndLinkGLSL(vs,fs)
    gl.enable(gl.DEPTH_TEST)

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

async function setupExample(){
  inputString = window.location.hash.substr(1)
  if (!inputString)
    inputString = 'example.obj' //make sure to change to example.obj at the end!

  exampleInput = await fetch(inputString).then(res => {if (res.status === 404) {
    console.log("404")
  } else {return res.text()}})
  
  if (!exampleInput) // if exampleInput == empty string
    return

  let texture_normal_copy_flag = false // flag for ensuring textures or normals are copied ONCE (and then no need to redeclare arrays later)
  let vn_flag = false
  vt_flag = false // convert to global
  let vn_vt_flag = false

  let attributes = {}
  let positions = []
  let triangles = []
  let vertex_colors = []
  var normals = []
  let normals_copy = []
  var textures = []
  let textures_copy = []
  let lines = exampleInput.split("\n");
  for (let i = 0; i < lines.length; i++){
    let line = lines[i]
    let line_split_trim = line.split(' ').map(item=>item.trim())

    // link ref for code below: https://stackoverflow.com/questions/19888689/remove-empty-strings-from-array-while-keeping-record-without-loop
    let line_split_trim_filtered = line_split_trim.filter(c=>c != '')
    // console.log(line_split_trim_filtered)
    // line_split_trim_filtered = line_split_trim_filtered.split('/')
    if (line[0] == '#' || line[0] == 'o')
      continue
    else if (line_split_trim_filtered[0] == 'v'){
      let obj_vertex = new Array();
      obj_vertex.push(parseFloat(line_split_trim_filtered[1]))
      obj_vertex.push(parseFloat(line_split_trim_filtered[2]))
      obj_vertex.push(parseFloat(line_split_trim_filtered[3]))
      positions.push(obj_vertex)
      vtx_color_flag = false // reset if necessary
      if (line_split_trim_filtered.length == 7){
        console.log("color flag TRUE")
        vtx_color_flag = true;
        let obj_vertex_color = new Array()
        obj_vertex_color.push(parseFloat(line_split_trim_filtered[4]))
        obj_vertex_color.push(parseFloat(line_split_trim_filtered[5]))
        obj_vertex_color.push(parseFloat(line_split_trim_filtered[6]))
        vertex_colors.push(obj_vertex_color)
      } else {
        let obj_vertex_color = new Array([IlliniOrange[0], IlliniOrange[1], IlliniOrange[2]]) // IlliniOrange
        vertex_colors.push(obj_vertex_color)
      }
    }
    else if (line_split_trim_filtered[0] == 'vn'){
      let normal = new Array();
      normal.push(parseFloat(line_split_trim_filtered[1]))
      normal.push(parseFloat(line_split_trim_filtered[2]))
      normal.push(parseFloat(line_split_trim_filtered[3]))
      normals_copy.push(normal)
      vn_flag = true
    }
    else if (line_split_trim_filtered[0] == 'vt'){
      let texture = new Array();
      texture.push(parseFloat(line_split_trim_filtered[1]))
      texture.push(parseFloat(line_split_trim_filtered[2]))
      // normal.push(parseFloat(line_split_trim_filtered[3]))
      textures_copy.push(texture)
      vt_flag = true
    }
    else if (line_split_trim_filtered[0] == 'f'){
      // console.log(line_split_trim_filtered)
      vertex1 = line_split_trim_filtered[1].split('/')
      vertex2 = line_split_trim_filtered[2].split('/')
      vertex3 = line_split_trim_filtered[3].split('/')

      let triangle = new Array();
      triangle.push(parseFloat(vertex1[0] - 1))
      triangle.push(parseFloat(vertex2[0] - 1))
      triangle.push(parseFloat(vertex3[0] - 1))
      triangles.push(triangle)
    
      if (vertex1.length >= 2){ //just need to check vertex1 for now (since vertex2 and vertex3 are same format)
        if (texture_normal_copy_flag == false){
          if (vn_flag)
            normals = new Array(normals_copy.length)
          if (vt_flag)
            textures = new Array(textures_copy.length)
          
          if (vt_flag && vn_flag)
            vn_vt_flag = true
          texture_normal_copy_flag = true
        }
        textures[parseInt(vertex1[0]) - 1] = textures_copy[parseInt(vertex1[1]) - 1]
        normals[parseInt(vertex1[0]) - 1] = normals_copy[parseInt(vertex1[2]) - 1]
        textures[parseInt(vertex2[0]) - 1] = textures_copy[parseInt(vertex2[1]) - 1]
        normals[parseInt(vertex2[0]) - 1] = normals_copy[parseInt(vertex2[2]) - 1]
        textures[parseInt(vertex3[0]) - 1] = textures_copy[parseInt(vertex3[1]) - 1]
        normals[parseInt(vertex3[0]) - 1] = normals_copy[parseInt(vertex3[2]) - 1]
      }

      if (line_split_trim_filtered.length >= 5){
        for (let i = 4; i < line_split_trim.length; i++){
          let new_tri = new Array();
          
          new_vertex_prev = line_split_trim_filtered[i-1].split('/')
          new_vertex = line_split_trim_filtered[i].split('/')
          new_tri.push(parseFloat(vertex1[0] - 1))
          new_tri.push(parseFloat(new_vertex_prev[0] - 1))
          new_tri.push(parseFloat(new_vertex[0] - 1))
          if (new_vertex.length >= 20){
            textures[parseInt(new_vertex[0])] = parseFloat(new_vertex[1])
            normals[parseInt(new_vertex[0])] = parseFloat(new_vertex[2])
          }

          triangles.push(new_tri)
        }
      }
    }
  }
  example.attributes = attributes
  example.attributes.position = positions
  example.attributes.vertex_color = vertex_colors

  example.triangles = triangles
  if (normals.length != 0){
    vn_flag = true
    example.attributes.normal = normals 
  }

  if (textures.length != 0){
    vt_flag = true
    example.attributes.aTexCoord = textures
  }

  console.log("example", example)
  console.log("normals: ", normals)
  console.log("textures: ", textures)

  window.gl = document.querySelector('canvas').getContext('webgl2',
    // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
    {antialias: false, depth:true, preserveDrawingBuffer:true}
  )

  let vs = await fetch('vertex_obj_shader.glsl').then(res => res.text())
  let fs = await fetch('frag_obj_shader.glsl').then(res => res.text())
  if (vn_vt_flag){
    console.log("hit")
    vs = await fetch('v_vn_vt_vtx_shader.glsl').then(res => res.text())
    fs = await fetch('v_vn_vt_frag_shader.glsl').then(res => res.text())
  } else if (vt_flag){
    vs = await fetch('v_vt_vertex_shader.glsl').then(res => res.text())
    fs = await fetch('v_vt_frag_shader.glsl').then(res => res.text())
  } else if (vn_flag){
    vs = await fetch('v_vn_vertex_shader.glsl').then(res => res.text())
    fs = await fetch('v_vn_frag_shader.glsl').then(res => res.text())
  }
  window.programExample = compileAndLinkGLSL(vs,fs)
  gl.enable(gl.DEPTH_TEST)
  setupTextureObj()
  window.exampleGeom = setupGeometryExample(example)
  requestAnimationFrame(drawExample)
}

function setupTextureObj(){
  if (!vt_flag)
    return
  // else if vt_flag == true
  let img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = 'thing.jpg'
  console.log(img)
  img.addEventListener('load', (event) => {
  slot = 1; // or a larger integer if this isn't the only texture
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
}

window.addEventListener('load', setup)
window.addEventListener('load', setupExample)
window.addEventListener('hashchange', setupExample)

// keyboard/camera motion: 
window.keysBeingPressed = {}
window.addEventListener('keydown', event => keysBeingPressed[event.key.toLowerCase()] = true)
window.addEventListener('keyup', event => keysBeingPressed[event.key.toLowerCase()] = false)

