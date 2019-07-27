// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
KNN Classification on Webcam Images with poseNet. Built with p5.js
=== */
let video;
// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let poseNet;
let poses = [];
let canvasX = 640
let canvasY = 480 

function setup() {
  const canvas = createCanvas(canvasX, canvasY);
  canvas.parent('videoContainer');
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create the UI buttons
  createButtons();

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    if (typeof results !== 'undefined') {
      // the variable is defined
      poses = results;
    }
  });
  // Hide the video element, and just show the canvas
  video.hide();

  console.log("Loading the pretrained dataset")

}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
}

function modelReady(){
  select('#status').html('model Loaded')
  knnClassifier.load('./myKNN.json', updateCounts);

}

// Add the current frame from the video to the classifier
function addExample(label) {
  // Convert poses results to a 2d array [[score0, x0, y0],...,[score16, x16, y16]]
  const poseArray = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);

  // Add an example with a label to the classifier
  knnClassifier.addExample(poseArray, label);
  updateCounts();
}

// Predict the current frame.
function classify() {
  // Get the total number of labels from knnClassifier
  const numLabels = knnClassifier.getNumLabels();
  if (numLabels <= 0) {
    console.error('There is no examples in any label');
    return;
  }

  

  try { 
    // Convert poses results to a 2d array [[score0, x0, y0],...,[score16, x16, y16]]
    const poseArray = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);

    // Use knnClassifier to classify which label do these features belong to
    // You can pass in a callback function `gotResults` to knnClassifier.classify function
    knnClassifier.classify(poseArray, gotResults);
  } catch(err) {
    console.log('cacca');
  }
}

let old_command = 'None'
function sendCommand(command){
   if (command != old_command){
      old_command = command
      socket.emit('message',  "/action/"+command);
   }

  console.log(command);
  
  let num = 0
  var points = new Array(16);
  var arrayLength = points.length;
  for (var i = 0; i < arrayLength; i++) {
      points[i] = 0.0
  }
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
      // For each pose detected, loop through all the keypoints
      let pose = poses[i].pose;
      for (let j = 0; j < pose.keypoints.length; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = pose.keypoints[j];
        // Only draw an ellipse is the pose probability is bigger than 0.2
        if (keypoint.score > 0.2) {
          if (num < points.length){
            points[num] = keypoint.position.x/canvasX 
            points[num+1] = keypoint.position.y/canvasY
            num += 2
          }
        }
      }
    }

    message = "/wek/inputs "
    // message = ""
    for (var i = 0; i < arrayLength; i++) {
       message = message.concat(points[i].toString())
       if(i < 15){
       message = message.concat(" ")}
    }
  // socket.emit('message',  "/wek/inputs", 5.0, 0.0, 1.0, 2.0);
  socket.emit('message',  message);
  // socket.emit('message', '/1/push1 f, 1.0');
  // socket.emit('message', '/wek/inputs/ 1.0');

}
// A util function to create UI buttons
function createButtons() {
  // When the A button is pressed, add the current frame
  // from the video with a label of "A" to the classifier
  // A util function to create UI buttons

  // Load saved classifier dataset
buttonSetData = select('#load');
buttonSetData.mousePressed(loadMyKNN);
//
// // Get classifier dataset
// buttonGetData = select('#save');
// buttonGetData.mousePressed(saveMyKNN);
}

// Show the results
function gotResults(err, result) {
  // console.log(result);
  // Display any error
  if (err) {
    console.error(err);
  }

  if (result.confidencesByLabel) {
    const confidences = result.confidencesByLabel;
    // result.label is the label that has the highest confidence
    if (result.label) {
      sendCommand(result.label)
      select('#result').html(result.label);
      select('#confidence').html(`${confidences[result.label] * 100} %`);
    }

  }

  try {
    classify();
  } catch(err) {
    console.error(err);
    console.log('cacca');
  }
}

// Update the example count for each label
function updateCounts() {
  const counts = knnClassifier.getCountByLabel();

  classify()
}

// Clear the examples in one label
function clearLabel(classLabel) {
  knnClassifier.clearLabel(classLabel);
  updateCounts();
}

// Clear all the examples in all labels
function clearAllLabels() {
  knnClassifier.clearAllLabels();
  updateCounts();
}

// Save dataset as myKNNDataset.json
function saveMyKNN() {
  console.log("saveMyKNN")
    knnClassifier.save('myKNN');
}

// Load dataset to the classifier
function loadMyKNN() {
  console.log("loadMyKNN")
    knnClassifier.load('./myKNN.json', updateCounts);

}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
      // console.log('partA.position.x, partA.position.y, partB.position.x, partB.position.y');
    }
  }
}

var socket = io('http://127.0.0.1:8081');
socket.on('connect', function() {
     // sends to socket.io server the host/port of oscServer
     // and oscClient
     socket.emit('config',
         {
             server: {
                 port: 3333,
                 host: '127.0.0.1'
             },
             client: {
                 port: 6448,
                 host: '192.168.10.144'
             }
         }
     );
 });



//  socket.on('message', function(obj) {
//      var status = document.getElementById("status");
//      status.innerHTML = obj[0];
//      console.log(obj);
//  });