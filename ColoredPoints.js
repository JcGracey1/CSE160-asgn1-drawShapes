// ColoredPoints.js
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	//gl = getWebGLContext(canvas);
  gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}	
  // enable blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablestoGLSL() {
	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
	console.log('Failed to intialize shaders.');
	return;
	}

	// // Get the storage location of a_Position
	a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
	console.log('Failed to get the storage location of a_Position');
	return;
	}

	// Get the storage location of u_FragColor
	u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
	if (!u_FragColor) {
	console.log('Failed to get the storage location of u_FragColor');
	return;
	}

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size){
    console.log('Failed to get the storage location of u_Size');
    return;    
  }
	
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 8;
let g_selectedOpacity = 1.0;

function addActionsForHtmlUI(){
  // button events (shape type)
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0];};
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0];};
  document.getElementById('clearButton').onclick = function() {g_shapesList = []; renderAllShapes();}
  document.getElementById('beeButton').onclick = function() { drawBee();};

  document.getElementById('pointButton').onclick = function() {g_selectedType = POINT};
  document.getElementById('triangleButton').onclick = function() {g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType = CIRCLE};
  // slider events
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100;});

  document.getElementById('segmentsSlide').addEventListener('mouseup', function() { g_selectedSegments = this.value;});

  document.getElementById('opacitySlide').addEventListener('mouseup', function() { g_selectedOpacity = this.value/100;});

  // size slider events
  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value;});

}

function main() {
	setupWebGL();
	connectVariablestoGLSL();

  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {if (ev.buttons == 1) click(ev);};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}



var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];
function click(ev) {

  let [x,y] = convertCoordinatesEventToGL(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) {
    point = new Circle();
  }
  point.position = [x, y];
  //point.color = g_selectedColor.slice();
  point.color = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], g_selectedOpacity];
  point.size = g_selectedSize;
  point.segments = g_selectedSegments;
  g_shapesList.push(point);

  renderAllShapes();

}

function convertCoordinatesEventToGL(ev){
	var x = ev.clientX; // x coordinate of a mouse pointer
	var y = ev.clientY; // y coordinate of a mouse pointer
	var rect = ev.target.getBoundingClientRect();
  
	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

	return ([x, y]);  
}

function renderAllShapes() {

  var startTime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(let i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHtml('numdot: ' + len + ' ms: ' + Math.floor(duration) + ' fps: ' + Math.floor(1000 / duration)/10, "numdot");
}

function sendTextToHtml(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log('No html element with id=' + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}

function drawBee(){
  const yellow = [1.0, 1.0, 0.0, 1.0];
  const black = [0.0, 0.0, 0.0, 1.0];
  const white = [1.0, 1.0, 1.0, 1.0];

  // Body:
  const bodyTriangle1 = new Triangle();
  bodyTriangle1.customVertices = [
    -0.5, -0.4,  // Bottom-left corner
    0.5, -0.4,   // Bottom-right corner
    -0.5, 0.4    // Top-left corner
  ];
  bodyTriangle1.color = yellow;
  g_shapesList.push(bodyTriangle1);

  const bodyTriangle2 = new Triangle();
  bodyTriangle2.customVertices = [
    0.5, -0.4,   // Bottom-right corner
    0.5, 0.4,    // Top-right corner
    -0.5, 0.4    // Top-left corner
  ];
  bodyTriangle2.color = yellow;
  g_shapesList.push(bodyTriangle2);

  // stinger:
  const stingerTriangle = new Triangle();
  stingerTriangle.customVertices = [
    0.5, -0.2,   // Bottom-right corner
    0.8, 0,    // Top-right corner
    0.5, 0.2    // Top-left corner
  ];
  stingerTriangle.color = white;
  g_shapesList.push(stingerTriangle);

  // eye:
  const eyeTriangle1 = new Triangle();
  eyeTriangle1.customVertices = [
    -0.5, 0.0,  // Bottom-left of square
    -0.35, 0.0, // Bottom-right of square
    -0.5, 0.25    // Top-left of square
  ];
  eyeTriangle1.color = black;
  g_shapesList.push(eyeTriangle1);
  
  const eyeTriangle2 = new Triangle();
  eyeTriangle2.customVertices = [
    -0.35, 0.0, // Bottom-right of square
    -0.35, 0.25,  // Top-right of square
    -0.5, 0.25    // Top-left of square
  ];
  eyeTriangle2.color = black;
  g_shapesList.push(eyeTriangle2);

  //stripes:
  const stripeTriangle1 = new Triangle();
  stripeTriangle1.customVertices = [
    0.3, -0.4,   // Bottom point of the triangle, near the stinger
    0.35, 0.4,    // Top-right of the stripe
    0.25, 0.4     // Top-left of the stripe
  ];
  stripeTriangle1.color = black;
  g_shapesList.push(stripeTriangle1);

  const stripeTriangle2 = new Triangle();
  stripeTriangle2.customVertices = [
    0.1, -0.4,   // Bottom point of the triangle, near the stinger
    0.15, 0.4,    // Top-right of the stripe
    0.05, 0.4     // Top-left of the stripe
  ];
  stripeTriangle2.color = black;
  g_shapesList.push(stripeTriangle2);

  //wing:
  const wingTriangle = new Triangle();
  wingTriangle.customVertices = [
    0, 0.6,    // Point of the wing, located above the body (centered on top)
    0.25, 0.3,  // Right side of the wing
    -0.25, 0.3  // Left side of the wing
  ];
  wingTriangle.color = [1.0, 1.0, 1.0, 0.7];
  g_shapesList.push(wingTriangle);

  renderAllShapes();
}