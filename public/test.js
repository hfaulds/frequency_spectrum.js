(function() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

  var pitchElem = null;
  var frequencySpectrum = null;

  var audioContext = new AudioContext();
  var analyser = null;

  var buflen = 1024;
  var freqData = new Float32Array(buflen);

  window.onload = function() {
    pitchElem = document.getElementById('pitch');
    frequencySpectrum = document.getElementById('frequencySpectrum').getContext('2d');
    requestUserMedia({audio:true}, gotStream);
  }

  function convertToMono(input) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);
    return merger;
  }

  function error() {
    alert('Stream generation failed.');
  }

  function requestUserMedia(request, callback) {
    try {
      navigator.getUserMedia(request, callback, error);
    } catch (e) {
      alert('getUserMedia threw exception :' + e);
    }
  }

  function gotStream(stream) {
    var mediaStreamSource = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    convertToMono(mediaStreamSource).connect(analyser);
    render();
  }

  function findLoudestFreq() {
    var i = 0;
    var maxAmplitude = freqData[0];
    var maxAmplitudeFreq = 0;

    while(++i < freqData.length) {
      if(freqData[i] > maxAmplitude) {
        maxAmplitudeFreq = i;
        maxAmplitude = freqData[i];
      }
    }

    return maxAmplitudeFreq;
  }

  function renderFrequencySpectrum(maxAmplitudeFreq) {
    var i = 0;
    frequencySpectrum.strokeStyle = "rgb(0,0,0)";
    while(++i < freqData.length) {
      if(i == maxAmplitudeFreq) {
        frequencySpectrum.strokeStyle = "rgb(200,0,0)";
      }
      frequencySpectrum.beginPath();
      frequencySpectrum.moveTo(i, 0);
      frequencySpectrum.lineTo(i, (freqData[i] - analyser.minDecibels) * 2);
      frequencySpectrum.stroke();
    }
  }

  function render(time) {
    frequencySpectrum.setTransform(1, 0, 0, 1, 0, 0);
    frequencySpectrum.clearRect(0, 0, 2048, 400);
    analyser.getFloatFrequencyData(freqData);

    maxAmplitudeFreq = findLoudestFreq();
    renderFrequencySpectrum(maxAmplitudeFreq);

    pitchElem.innerText = maxAmplitudeFreq;

    window.requestAnimationFrame(render);
  }
})();
