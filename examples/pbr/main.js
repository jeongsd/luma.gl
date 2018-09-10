/* global Controls, Scene, luma, $, dat, document */
var controls;

const BASE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master';

// Update model from dat.gui change
function updateModel(value, gl, glState, viewMatrix, projectionMatrix, backBuffer, frontBuffer) {
  const error = document.getElementById('error');
  glState.scene = null;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const canvas2d = document.getElementById('canvas2d');
  frontBuffer.clearRect(0, 0, canvas2d.width, canvas2d.height);
  document.getElementById('loadSpinner').style.display = 'block';
  if (controls) {
    controls.resetCamera();
  }

  // glTF-WebGL-PBR/master/models/DamagedHelmet/glTF/DamagedHelmet.gltf
  $.ajax({
    url: `${BASE_URL}/models/${value}/glTF/${value}.gltf`,
    dataType: 'json',
    crossDomain: true,
    async: true,
    error: (jqXhr, textStatus, errorThrown) => {
      error.innerHTML += `Failed to load model: ${errorThrown}<br>`;
    },
    success: gltf => {
      const scene = new Scene(gl, glState, `${BASE_URL}/models/${value}/glTF/`, gltf);
      scene.projectionMatrix = projectionMatrix;
      scene.viewMatrix = viewMatrix;
      scene.backBuffer = backBuffer;
      scene.frontBuffer = frontBuffer;
      glState.scene = scene;
    }
  });
}

function main() {
  const canvas = document.getElementById('canvas');
  const canvas2d = document.getElementById('canvas2d');
  const error = document.getElementById('error');
  if (!canvas) {
    error.innerHTML += 'Failed to retrieve the canvas element<br>';
    return;
  }
  let canvasWidth = -1;
  let canvasHeight = -1;
  canvas.hidden = true;

  const gl = canvas.getContext('webgl', {});
  if (!gl) {
    error.innerHTML += 'Failed to get the rendering context for WebGL<br>';
    return;
  }

  const ctx2d = canvas2d.getContext('2d');

  const {vs, fs} = getShaders();
  glState = {
    uniforms: {},
    attributes: {},
    vertSource: vs,
    fragSource: fs,
    scene: null,
    hasLODExtension:gl.getExtension('EXT_shader_texture_lod'),
    hasDerivativesExtension:gl.getExtension('OES_standard_derivatives'),
    hasSRGBExt:gl.getExtension('EXT_SRGB')
  };

  var projectionMatrix = mat4.create();
  function resizeCanvasIfNeeded() {
    var width = Math.max(1, window.innerWidth);
    var height = Math.max(1, window.innerHeight);
    if (width !== canvasWidth || height !== canvasHeight) {
      canvas.width = canvas2d.width = canvasWidth = width;
      canvas.height = canvas2d.height = canvasHeight = height;
      gl.viewport(0, 0, width, height);
      mat4.perspective(projectionMatrix, 45.0 * Math.PI / 180.0, width / height, 0.01, 100.0);
    }
  }

  // Create cube maps
  var envMap = 'papermill';
  //loadCubeMap(gl, envMap, 'environment');
  loadCubeMap(gl, envMap, 'diffuse', glState);
  loadCubeMap(gl, envMap, 'specular', glState);
  // Get location of mvp matrix uniform
  glState.uniforms['u_MVPMatrix'] = { 'funcName': 'uniformMatrix4fv' };
  // Get location of model matrix uniform
  glState.uniforms['u_ModelMatrix'] = { 'funcName': 'uniformMatrix4fv' };
  // Get location of normal matrix uniform
  glState.uniforms['u_NormalMatrix'] = { 'funcName': 'uniformMatrix4fv' };

  // Light
  glState.uniforms['u_LightDirection'] = { 'funcName': 'uniform3f', 'vals': [0.0, 0.5, 0.5] };
  glState.uniforms['u_LightColor'] = { 'funcName': 'uniform3f', 'vals': [1.0, 1.0, 1.0] };

  // Camera
  glState.uniforms['u_Camera'] = { 'funcName': 'uniform3f', vals: [0.0, 0.0, -4.0] };

  // Model matrix
  var modelMatrix = mat4.create();

  // View matrix
  var viewMatrix = mat4.create();
  var eye = vec3.fromValues(0.0, 0.0, 4.0);
  var at = vec3.fromValues(0.0, 0.0, 0.0);
  var up = vec3.fromValues(0.0, 1.0, 0.0);
  mat4.lookAt(viewMatrix, eye, at, up);

  // get scaling stuff
  glState.uniforms['u_ScaleDiffBaseMR'] = { 'funcName': 'uniform4f', vals: [0.0, 0.0, 0.0, 0.0] };
  glState.uniforms['u_ScaleFGDSpec'] = { 'funcName': 'uniform4f', vals: [0.0, 0.0, 0.0, 0.0] };
  glState.uniforms['u_ScaleIBLAmbient'] = { 'funcName': 'uniform4f', vals: [1.0, 1.0, 1.0, 1.0] };

  // Load scene
  var defaultModelName = 'DamagedHelmet';
  updateModel(defaultModelName, gl, glState, viewMatrix, projectionMatrix, canvas, ctx2d);

  // Set clear color
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  // Enable depth test
  gl.enable(gl.DEPTH_TEST);

  var redrawQueued = false;
  var redraw = function() {
    if (!redrawQueued) {
      redrawQueued = true;
      window.requestAnimationFrame(function() {
        redrawQueued = false;
        resizeCanvasIfNeeded();
        var scene = glState.scene;
        if (scene) {
          scene.drawScene(gl);
        }
      });
    }
  };

  controls = new Controls(canvas2d, redraw);

  // Initialize GUI
  const gui = new dat.GUI();
  const folder = gui.addFolder('Metallic-Roughness Material');

  const text = { Model: defaultModelName };
  folder.add(text, 'Model', ['MetalRoughSpheres', 'AppleTree', 'Avocado', 'BarramundiFish', 'BoomBox', 'Corset', 'DamagedHelmet', 'FarmLandDiorama', 'NormalTangentTest', 'Telephone', 'TextureSettingsTest', 'Triangle', 'WaterBottle', 'InterpolatedNormalsTest', 'NonUniformScalingTest']).onChange(function(value) {
    updateModel(value, gl, glState, viewMatrix, projectionMatrix, canvas, ctx2d);
  });
  folder.open();

  const light = gui.addFolder('Directional Light');
  const lightProps = { lightColor: [255, 255, 255], lightScale: 1.0, lightRotation: 75, lightPitch: 40 };

  const updateLight = function(value) {
    glState.uniforms['u_LightColor'].vals = [lightProps.lightScale * lightProps.lightColor[0] / 255,
    lightProps.lightScale * lightProps.lightColor[1] / 255,
    lightProps.lightScale * lightProps.lightColor[2] / 255];

    var rot = lightProps.lightRotation * Math.PI / 180;
    var pitch = lightProps.lightPitch * Math.PI / 180;
    glState.uniforms['u_LightDirection'].vals = [Math.sin(rot) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(rot) * Math.cos(pitch)];

    redraw();
  };

  light.addColor(lightProps, 'lightColor').onChange(updateLight);
  light.add(lightProps, 'lightScale', 0, 10).onChange(updateLight);
  light.add(lightProps, 'lightRotation', 0, 360).onChange(updateLight);
  light.add(lightProps, 'lightPitch', -90, 90).onChange(updateLight);

  light.open();


  updateLight();

  // mouseover scaling

  var scaleVals = {
    IBL: 1.0
  };
  function updateMathScales(v) {
    var el = scaleVals.pinnedElement ? scaleVals.pinnedElement : scaleVals.activeElement;
    var elId = el ? el.attr('id') : null;

    glState.uniforms['u_ScaleDiffBaseMR'].vals = [
      elId == 'mathDiff' ? 1.0 : 0.0, elId == 'baseColor' ?
        1.0 : 0.0, elId == 'metallic' ? 1.0 : 0.0, elId == 'roughness' ? 1.0 : 0.0
    ];
    glState.uniforms['u_ScaleFGDSpec'].vals = [
      elId == 'mathF' ? 1.0 : 0.0, elId == 'mathG' ?
        1.0 : 0.0, elId == 'mathD' ? 1.0 : 0.0, elId == 'mathSpec' ? 1.0 : 0.0
    ];
    glState.uniforms['u_ScaleIBLAmbient'].vals = [scaleVals.IBL, scaleVals.IBL, 0.0, 0.0];

    redraw();
  }

  gui.add(scaleVals, 'IBL', 0, 4).onChange(updateMathScales);

  function setActiveComponent(el) {
    if (scaleVals.activeElement) {
      scaleVals.activeElement.removeClass('activeComponent');
    }
    if (el && !scaleVals.pinnedElement) {
      el.addClass('activeComponent');
    }
    scaleVals.activeElement = el;

    if (!scaleVals.pinnedElement) {
      updateMathScales();
    }
  }

  function setPinnedComponent(el) {
    if (scaleVals.activeElement) {
      if (el) {
        scaleVals.activeElement.removeClass('activeComponent');
      }
      else {
        scaleVals.activeElement.addClass('activeComponent');
      }
    }

    if (scaleVals.pinnedElement) {
      scaleVals.pinnedElement.removeClass('pinnedComponent');
    }
    if (el) {
      el.addClass('pinnedComponent');
    }

    scaleVals.pinnedElement = el;

    updateMathScales();
  }

  function createMouseOverScale() {
    var localArgs = arguments;
    var el = $(localArgs[0]);
    el.hover(
      function(ev) {
        setActiveComponent(el);
      },
      function(ev) {
        setActiveComponent(null);
      });

    el.click(
      function(ev) {
        if (scaleVals.pinnedElement) {
          setPinnedComponent(null);
        }
        else {
          setPinnedComponent(el);
        }
        ev.stopPropagation();
      }
    );
  };

  createMouseOverScale('#mathDiff', 'diff');
  createMouseOverScale('#mathSpec', 'spec');
  createMouseOverScale('#mathF', 'F');
  createMouseOverScale('#mathG', 'G');
  createMouseOverScale('#mathD', 'D');
  createMouseOverScale('#baseColor', 'baseColor');
  createMouseOverScale('#metallic', 'metallic');
  createMouseOverScale('#roughness', 'roughness');

  $('#pbrMath').click(function(ev) {
    if (scaleVals.pinned && scaleVals.pinnedElement) {
      $(scaleVals.pinnedElement).removeClass('pinnedComponent');
    }
    scaleVals.pinned = false;
  });

  updateMathScales();

  function format255(p) {
    const str = p.toString();
    return ' '.repeat(3).substring(str.length) + str;
  }

  // picker
  const pixelPickerText = document.getElementById('pixelPickerText');
  const pixelPickerColor = document.getElementById('pixelPickerColor');
  const pixelPickerPos = { x: 0, y: 0 };
  let pixelPickerScheduled = false;
  function sample2D() {
    pixelPickerScheduled = false;
    const x = pixelPickerPos.x;
    const y = pixelPickerPos.y;
    const p = ctx2d.getImageData(x, y, 1, 1).data;
    pixelPickerText.innerHTML =
      'r:  ' + format255(p[0]) + ' g:  ' + format255(p[1]) + ' b:  ' + format255(p[2]) +
      '<br>r: ' + (p[0] / 255).toFixed(2) + ' g: ' + (p[1] / 255).toFixed(2) + ' b: ' + (p[2] / 255).toFixed(2);
    pixelPickerColor.style.backgroundColor = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';
  }
  $(canvas2d).mousemove(e => {
    const pos = $(canvas2d).position();
    pixelPickerPos.x = e.pageX - pos.left;
    pixelPickerPos.y = e.pageY - pos.top;
    if (!pixelPickerScheduled) {
      pixelPickerScheduled = true;
      window.requestAnimationFrame(sample2D);
    }
  });

  // Redraw the scene after window size changes.
  $(window).resize(redraw);

  function tick() {
    animate(controls.roll);
    redraw();
    requestAnimationFrame(tick);
  }
  // Uncomment for turntable
  // tick();
}

let prev = Date.now();
function animate(angle) {
  const curr = Date.now();
  const elapsed = curr - prev;
  prev = curr;
  controls.roll = angle + ((Math.PI / 4.0) * elapsed) / 5000.0;
}

function getShaders() {
  return {
    vs: `\
attribute vec4 a_Position;
#ifdef HAS_NORMALS
attribute vec4 a_Normal;
#endif
#ifdef HAS_TANGENTS
attribute vec4 a_Tangent;
#endif
#ifdef HAS_UV
attribute vec2 a_UV;
#endif

${luma.pbr.vs}

void main()
{
#ifdef HAS_TANGENTS
  pbr_setPositionNormalTangentUV(a_Position, a_Normal, a_Tangent, a_UV);
#else
  pbr_setPositionNormalTangentUV(a_Position, a_Normal, vec4(0.), a_UV);
#endif
  gl_Position = u_MVPMatrix * a_Position;
}
`,
  fs: `\
${luma.pbr.fs}

void main()
{
  gl_FragColor = pbr_filterColor(gl_FragColor);
}
`
  };
}
