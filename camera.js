/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from '@tensorflow-models/posenet';
import dat from 'dat.gui';
import Stats from 'stats.js';

import {drawBoundingBox, drawKeypoints, drawSkeleton, drawGrid, isMobile, toggleLoadingUI, tryResNetButtonName, tryResNetButtonText, updateTryResNetButtonDatGuiCss} from './demo_util';

// const videoWidth = 800;
// const videoHeight = 600;

const videoWidth = screen.width;
const videoHeight = screen.height;

const stats = new Stats();

var left_up_1 = false;
var left_up_2 = false;
var left_down_1 = false;
var left_down_2 = false;

var right_up_1 = false;
var right_up_2 = false;
var right_down_1 = false;
var right_down_2 = false;



//drums
player.loader.decodeAfterLoading(audioContext, '_drum_35_17_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_40_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_42_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_51_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_50_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_48_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_41_1_JCLive_sf2_file');
// const synth = new Tone.MembraneSynth().toMaster();
// const notes = ["G2", [null, "G2"], null, "Bb2", "C3"];

// const synthPart = new Tone.Sequence(
//   function(time, note) {
//     synth.triggerAttackRelease(note, "10hz", time);
//   },
//   notes,
//   "8n"
// );

// getAudioContext().resume()

// synthPart.start();

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = isMobile() ? 0.50 : 0.75;
const defaultMobileNetStride = 16;
const defaultMobileNetInputResolution = 200;

const defaultResNetMultiplier = 1.0;
const defaultResNetStride = 32;
const defaultResNetInputResolution = 250;

const guiState = {
  algorithm: 'single-pose',
  input: {
    architecture: 'MobileNetV1',
    outputStride: defaultMobileNetStride,
    inputResolution: defaultMobileNetInputResolution,
    multiplier: defaultMobileNetMultiplier,
    quantBytes: defaultQuantBytes
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  multiPoseDetection: {
    maxPoseDetections: 5,
    minPoseConfidence: 0.15,
    minPartConfidence: 0.1,
    nmsRadius: 30.0,
  },
  output: {
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    showBoundingBox: false,
  },
  net: null,
};

/**
 * Sets up dat.gui controller on the top-right of the window
 */
function setupGui(cameras, net) {
  guiState.net = net;

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }

  const gui = new dat.GUI({width: 300});

  let architectureController = null;
  guiState[tryResNetButtonName] = function() {
    architectureController.setValue('ResNet50')
  };
  gui.add(guiState, tryResNetButtonName).name(tryResNetButtonText);
  updateTryResNetButtonDatGuiCss();

  // The single-pose algorithm is faster and simpler but requires only one
  // person to be in the frame or results will be innaccurate. Multi-pose works
  // for more than 1 person
  const algorithmController =
      gui.add(guiState, 'algorithm', ['single-pose', 'multi-pose']);

  // The input parameters have the most effect on accuracy and speed of the
  // network
  let input = gui.addFolder('Input');
  // Architecture: there are a few PoseNet models varying in size and
  // accuracy. 1.01 is the largest, but will be the slowest. 0.50 is the
  // fastest, but least accurate.
  architectureController =
      input.add(guiState.input, 'architecture', ['MobileNetV1', 'ResNet50']);
  guiState.architecture = guiState.input.architecture;
  // Input resolution:  Internally, this parameter affects the height and width
  // of the layers in the neural network. The higher the value of the input
  // resolution the better the accuracy but slower the speed.
  let inputResolutionController = null;
  function updateGuiInputResolution(
      inputResolution,
      inputResolutionArray,
  ) {
    if (inputResolutionController) {
      inputResolutionController.remove();
    }
    guiState.inputResolution = inputResolution;
    guiState.input.inputResolution = inputResolution;
    inputResolutionController =
        input.add(guiState.input, 'inputResolution', inputResolutionArray);
    inputResolutionController.onChange(function(inputResolution) {
      guiState.changeToInputResolution = inputResolution;
    });
  }

  // Output stride:  Internally, this parameter affects the height and width of
  // the layers in the neural network. The lower the value of the output stride
  // the higher the accuracy but slower the speed, the higher the value the
  // faster the speed but lower the accuracy.
  let outputStrideController = null;
  function updateGuiOutputStride(outputStride, outputStrideArray) {
    if (outputStrideController) {
      outputStrideController.remove();
    }
    guiState.outputStride = outputStride;
    guiState.input.outputStride = outputStride;
    outputStrideController =
        input.add(guiState.input, 'outputStride', outputStrideArray);
    outputStrideController.onChange(function(outputStride) {
      guiState.changeToOutputStride = outputStride;
    });
  }

  // Multiplier: this parameter affects the number of feature map channels in
  // the MobileNet. The higher the value, the higher the accuracy but slower the
  // speed, the lower the value the faster the speed but lower the accuracy.
  let multiplierController = null;
  function updateGuiMultiplier(multiplier, multiplierArray) {
    if (multiplierController) {
      multiplierController.remove();
    }
    guiState.multiplier = multiplier;
    guiState.input.multiplier = multiplier;
    multiplierController =
        input.add(guiState.input, 'multiplier', multiplierArray);
    multiplierController.onChange(function(multiplier) {
      guiState.changeToMultiplier = multiplier;
    });
  }

  // QuantBytes: this parameter affects weight quantization in the ResNet50
  // model. The available options are 1 byte, 2 bytes, and 4 bytes. The higher
  // the value, the larger the model size and thus the longer the loading time,
  // the lower the value, the shorter the loading time but lower the accuracy.
  let quantBytesController = null;
  function updateGuiQuantBytes(quantBytes, quantBytesArray) {
    if (quantBytesController) {
      quantBytesController.remove();
    }
    guiState.quantBytes = +quantBytes;
    guiState.input.quantBytes = +quantBytes;
    quantBytesController =
        input.add(guiState.input, 'quantBytes', quantBytesArray);
    quantBytesController.onChange(function(quantBytes) {
      guiState.changeToQuantBytes = +quantBytes;
    });
  }

  function updateGui() {
    if (guiState.input.architecture === 'MobileNetV1') {
      updateGuiInputResolution(
          defaultMobileNetInputResolution,
          [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]);
      updateGuiOutputStride(defaultMobileNetStride, [8, 16]);
      updateGuiMultiplier(defaultMobileNetMultiplier, [0.50, 0.75, 1.0]);
    } else {  // guiState.input.architecture === "ResNet50"
      updateGuiInputResolution(
          defaultResNetInputResolution,
          [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]);
      updateGuiOutputStride(defaultResNetStride, [32, 16]);
      updateGuiMultiplier(defaultResNetMultiplier, [1.0]);
    }
    updateGuiQuantBytes(defaultQuantBytes, [1, 2, 4]);
  }

  updateGui();
  input.open();
  // Pose confidence: the overall confidence in the estimation of a person's
  // pose (i.e. a person detected in a frame)
  // Min part confidence: the confidence that a particular estimated keypoint
  // position is accurate (i.e. the elbow's position)
  let single = gui.addFolder('Single Pose Detection');
  single.add(guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
  single.add(guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);

  let multi = gui.addFolder('Multi Pose Detection');
  multi.add(guiState.multiPoseDetection, 'maxPoseDetections')
      .min(1)
      .max(20)
      .step(1);
  multi.add(guiState.multiPoseDetection, 'minPoseConfidence', 0.0, 1.0);
  multi.add(guiState.multiPoseDetection, 'minPartConfidence', 0.0, 1.0);
  // nms Radius: controls the minimum distance between poses that are returned
  // defaults to 20, which is probably fine for most use cases
  multi.add(guiState.multiPoseDetection, 'nmsRadius').min(0.0).max(40.0);
  multi.open();

  let output = gui.addFolder('Output');
  output.add(guiState.output, 'showVideo');
  output.add(guiState.output, 'showSkeleton');
  output.add(guiState.output, 'showPoints');
  output.add(guiState.output, 'showBoundingBox');
  output.open();


  architectureController.onChange(function(architecture) {
    // if architecture is ResNet50, then show ResNet50 options
    updateGui();
    guiState.changeToArchitecture = architecture;
  });

  algorithmController.onChange(function(value) {
    switch (guiState.algorithm) {
      case 'single-pose':
        multi.close();
        single.open();
        break;
      case 'multi-pose':
        single.close();
        multi.open();
        break;
    }
  });
}

/**
 * Sets up a frames per second panel on the top-left of the window
 */
function setupFPS() {
  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  document.getElementById('main').appendChild(stats.dom);
}

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  // since images are being fed from a webcam, we want to feed in the
  // original image and then just flip the keypoints' x coordinates. If instead
  // we flip the image, then correcting left-right keypoint pairs requires a
  // permutation on all the keypoints.
  const flipPoseHorizontal = true;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {
    if (guiState.changeToArchitecture) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.changeToArchitecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
      });
      toggleLoadingUI(false);
      guiState.architecture = guiState.changeToArchitecture;
      guiState.changeToArchitecture = null;
    }

    if (guiState.changeToMultiplier) {
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: +guiState.changeToMultiplier,
        quantBytes: guiState.quantBytes
      });
      toggleLoadingUI(false);
      guiState.multiplier = +guiState.changeToMultiplier;
      guiState.changeToMultiplier = null;
    }

    if (guiState.changeToOutputStride) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: +guiState.changeToOutputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.quantBytes
      });
      toggleLoadingUI(false);
      guiState.outputStride = +guiState.changeToOutputStride;
      guiState.changeToOutputStride = null;
    }

    if (guiState.changeToInputResolution) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: +guiState.changeToInputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.quantBytes
      });
      toggleLoadingUI(false);
      guiState.inputResolution = +guiState.changeToInputResolution;
      guiState.changeToInputResolution = null;
    }

    if (guiState.changeToQuantBytes) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.changeToQuantBytes
      });
      toggleLoadingUI(false);
      guiState.quantBytes = guiState.changeToQuantBytes;
      guiState.changeToQuantBytes = null;
    }

    // Begin monitoring code for frames per second
    stats.begin();

    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;
    switch (guiState.algorithm) {
      case 'single-pose':
        const pose = await guiState.net.estimatePoses(video, {
          flipHorizontal: flipPoseHorizontal,
          decodingMethod: 'single-person'
        });
        poses = poses.concat(pose);

        // console.log(pose);
        // console.log('x ' + poses[0].keypoints[9].position.x);
        // console.log('y ' +poses[0].keypoints[9].position.y);
        // console.lg(pose);

        //left hand 






        // drawSegment([videoWidth/2,0], [videoWidth/2,videoHeight], colorGrid,scale, ctx);
        // drawSegment([0,videoHeight/2], [videoWidth,videoHeight/2], colorGrid,scale, ctx);

        
        // drawSegment([0, videoWidth/4], [videoHeight, videoWidth/4], colorGrid,scale, ctx);
        // drawSegment([0, (3*videoWidth)/4], [videoHeight, (3*videoWidth)/4], colorGrid,scale, ctx);




        if(poses[0].keypoints[9].position.x<(videoWidth/4) && poses[0].keypoints[9].position.y<(videoHeight/2))
        {
          if(left_up_1==false)
          {
            console.log('left-up-1');
            player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
            left_up_1=true;
            left_up_2 = false;
            left_down_1 = false;
            left_down_2 = false;
          }
          
          //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
        }

        if(poses[0].keypoints[9].position.x>(videoWidth/4) && poses[0].keypoints[9].position.x<(videoWidth/2) && poses[0].keypoints[9].position.y<(videoHeight/2))
        {
          if(left_up_2==false)
          {
            console.log('left-up-2');
            player.queueWaveTable(audioContext, audioContext.destination, _drum_40_1_JCLive_sf2_file, 0, 40, 3);
            left_up_1=false;
            left_up_2 = true;
            left_down_1 = false;
            left_down_2 = false;
          }

          
          //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
        }

        if(poses[0].keypoints[9].position.x>(videoWidth/2) && poses[0].keypoints[9].position.x<((3*videoWidth)/4) && poses[0].keypoints[9].position.y<(videoHeight/2))
        {
          //console.log('left-up-3');
        }

        if(poses[0].keypoints[9].position.x>((3*videoWidth)/4) && poses[0].keypoints[9].position.y<(videoHeight/2))
        {
         // console.log('left-up-4');
        }


        //below left
        if(poses[0].keypoints[9].position.x<(videoWidth/4) && poses[0].keypoints[9].position.y>(videoHeight/2))
        {
          if(left_down_1==false)
          {
            console.log('left-down-1');
            player.queueWaveTable(audioContext, audioContext.destination, _drum_48_1_JCLive_sf2_file, 0, 48, 3);
            left_up_1=false;
            left_up_2 = false;
            left_down_1 = true;
            left_down_2 = false;
          }

          
          //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
        }

        if(poses[0].keypoints[9].position.x>(videoWidth/4) && poses[0].keypoints[9].position.x<(videoWidth/2) && poses[0].keypoints[9].position.y>(videoHeight/2))
        {
          if(left_down_2==false)
          {
            console.log('left-down-2');
            player.queueWaveTable(audioContext, audioContext.destination, _drum_51_1_JCLive_sf2_file, 0, 51, 3);
            left_up_1=false;
            left_up_2 = false;
            left_down_1 = false;
            left_down_2 = true;
          }
          
          //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
        }

        if(poses[0].keypoints[9].position.x>(videoWidth/2) && poses[0].keypoints[9].position.x<((3*videoWidth)/4) && poses[0].keypoints[9].position.y>(videoHeight/2))
        {
          //console.log('left-down-3');
        }

        if(poses[0].keypoints[9].position.x>((3*videoWidth)/4) && poses[0].keypoints[9].position.y>(videoHeight/2))
        {
         // console.log('left-down-4');
        }



//right hand

if(poses[0].keypoints[10].position.x<(videoWidth/4) && poses[0].keypoints[10].position.y<(videoHeight/2))
{
  //console.log('right-up-1');
  //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
}

if(poses[0].keypoints[10].position.x>(videoWidth/4) && poses[0].keypoints[10].position.x<(videoWidth/2) && poses[0].keypoints[10].position.y<(videoHeight/2))
{
  //console.log('right-up-2');
  //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
}

if(poses[0].keypoints[10].position.x>(videoWidth/2) && poses[0].keypoints[10].position.x<((3*videoWidth)/4) && poses[0].keypoints[10].position.y<(videoHeight/2))
{
  if(right_up_1==false)
  {
    console.log('right-up-1');
    playKey(4*12+7);
    right_up_1=true;
    right_up_2 = false;
    right_down_1 = false;
    right_down_2 = false;
  }
  
}

if(poses[0].keypoints[10].position.x>((3*videoWidth)/4) && poses[0].keypoints[10].position.y<(videoHeight/2))
{
  
  if(right_up_2==false)
  {
    console.log('right-up-2');
    playKey(4*12+0);
    right_up_1=false;
    right_up_2 = true;
    right_down_1 = false;
    right_down_2 = false;
  }
  
}


//below left
if(poses[0].keypoints[10].position.x<(videoWidth/4) && poses[0].keypoints[10].position.y>(videoHeight/2))
{
  //console.log('right-down-1');
  //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
}

if(poses[0].keypoints[10].position.x>(videoWidth/4) && poses[0].keypoints[10].position.x<(videoWidth/2) && poses[0].keypoints[10].position.y>(videoHeight/2))
{
  //console.log('right-down-2');
  //player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
}

if(poses[0].keypoints[10].position.x>(videoWidth/2) && poses[0].keypoints[10].position.x<((3*videoWidth)/4) && poses[0].keypoints[10].position.y>(videoHeight/2))
{
  if(right_down_1==false)
  {
    console.log('right-down-1');
    playKey(5*12+3);
    right_up_1=false;
    right_up_2 = false;
    right_down_1 = true;
    right_down_2 = false;
  }
  
}

if(poses[0].keypoints[10].position.x>((3*videoWidth)/4) && poses[0].keypoints[10].position.y>(videoHeight/2))
{
  if(right_down_2==false)
  {
    console.log('right-down-2');
    playKey(5*12+10);
    right_up_1=false;
    right_up_2 = false;
    right_down_1 = false;
    right_down_2 = true;
  }
}
 



//         if(poses[0].keypoints[9].position.x<(videoWidth/2) && poses[0].keypoints[9].position.y<(videoHeight/2))
//         {
//           console.log('left hand first quadrant');
//           player.queueWaveTable(audioContext, audioContext.destination, _drum_35_17_JCLive_sf2_file, 0, 35, 3);
//         }

//         if(poses[0].keypoints[9].position.x>(videoWidth/2) && poses[0].keypoints[9].position.y<(videoHeight/2))
//         {
//           console.log('left hand second quadrant');
//         }

//         if(poses[0].keypoints[9].position.x<(videoWidth/2) && poses[0].keypoints[9].position.y>(videoHeight/2))
//         {
//           console.log('left hand third quadrant');
//           player.queueWaveTable(audioContext, audioContext.destination, _drum_40_1_JCLive_sf2_file, 0, 40, 3);
//         }

//         if(poses[0].keypoints[9].position.x>(videoWidth/2) && poses[0].keypoints[9].position.y>(videoHeight/2))
//         {
//           console.log('left hand fourth quadrant');
//         }



// //right hand

//       if(poses[0].keypoints[10].position.x<(videoWidth/2) && poses[0].keypoints[10].position.y<(videoHeight/2))
//       {
//         console.log('left hand first quadrant');
//       }

//       if(poses[0].keypoints[10].position.x>(videoWidth/2) && poses[0].keypoints[10].position.y<(videoHeight/2))
//       {
//         console.log('left hand second quadrant');
//         player.queueWaveTable(audioContext, audioContext.destination, _drum_42_1_JCLive_sf2_file, 0, 42, 3);
//       }

//       if(poses[0].keypoints[10].position.x<(videoWidth/2) && poses[0].keypoints[10].position.y>(videoHeight/2))
//       {
//         console.log('left hand third quadrant');
//       }

//       if(poses[0].keypoints[10].position.x>(videoWidth/2) && poses[0].keypoints[10].position.y>(videoHeight/2))
//       {
//         console.log('left hand fourth quadrant');
//         player.queueWaveTable(audioContext, audioContext.destination, _drum_51_1_JCLive_sf2_file, 0, 51, 3);
//       }

        
//9 10 left right
        // if(poses[0].keypoints[1].position.y<200)
        // {
    
        //   Tone.Transport.start();
        //   console.log('playing sound');
        // }

        // else{
        //   Tone.Transport.stop();
        //   console.log('stopping sound');
        // }

        // console.log('hi');
        // console.log(poses[0].keypoints[1].position.y);
        // console.log(poses[0].keypoints[1].position.x);
          // var x = event.clientX;
          // var y = event.clientY;
          // console.log(x);
          // console.log(y);

          // var coords = "X coords: " + x + ", Y coords: " + y;

        

        minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
        break;
      case 'multi-pose':
        let all_poses = await guiState.net.estimatePoses(video, {
          flipHorizontal: flipPoseHorizontal,
          decodingMethod: 'multi-person',
          maxDetections: guiState.multiPoseDetection.maxPoseDetections,
          scoreThreshold: guiState.multiPoseDetection.minPartConfidence,
          nmsRadius: guiState.multiPoseDetection.nmsRadius
        });

        poses = poses.concat(all_poses);
        minPoseConfidence = +guiState.multiPoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.multiPoseDetection.minPartConfidence;
        break;
    }

    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    }

    // For each pose (i.e. person) detected in an image, loop through the poses
    // and draw the resulting skeleton and keypoints if over certain confidence
    // scores
    poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {

        drawGrid(ctx);

        if (guiState.output.showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
        }
        if (guiState.output.showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx);
          // drawSegment
        }
        if (guiState.output.showBoundingBox) {
          drawBoundingBox(keypoints, ctx);
        }
      }
    });

    // End monitoring code for frames per second
    stats.end();

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

/**
 * Kicks off the demo by loading the posenet model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */
export async function bindPage() {
  toggleLoadingUI(true);
  const net = await posenet.load({
    architecture: guiState.input.architecture,
    outputStride: guiState.input.outputStride,
    inputResolution: guiState.input.inputResolution,
    multiplier: guiState.input.multiplier,
    quantBytes: guiState.input.quantBytes
  });
  toggleLoadingUI(false);

  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    let info = document.getElementById('info');
    info.textContent = 'this browser does not support video capture,' +
        'or this device does not have a camera';
    info.style.display = 'block';
    throw e;
  }

  setupGui([], net);
  setupFPS();
  detectPoseInRealTime(video, net);
}

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// kick off the demo
bindPage();
