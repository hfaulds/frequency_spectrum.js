(function() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

  var pitchElem = null;
  var freqSpectrum0 = null;
  var freqSpectrum1 = null;
  var freqSpectrum2 = null;
  var freqSpectrum3 = null;

  var audioContext = new AudioContext();
  var analyser = null;

  var buflen = 1024;
  var freqData = new Float32Array(buflen);

  window.onload = function() {
    pitchElem = document.getElementById('pitch');
    freqSpectrum0 = document.getElementById('freqSpectrum0').getContext('2d');
    freqSpectrum1 = document.getElementById('freqSpectrum1').getContext('2d');
    freqSpectrum2 = document.getElementById('freqSpectrum2').getContext('2d');
    freqSpectrum3 = document.getElementById('freqSpectrum3').getContext('2d');
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

  function findLoudestFreq(series) {
    var i = 0;
    var maxAmplitude = series[0];
    var maxAmplitudeFreq = 0;

    while(++i < series.length) {
      if(series[i] > maxAmplitude) {
        maxAmplitudeFreq = i;
        maxAmplitude = series[i];
      }
    }

    return maxAmplitudeFreq;
  }

  function downSample(series, scale) {
    var newSampleCount = series.length / scale;
    var downSampledSeries = new Float32Array(newSampleCount);

    for(var i=0; i < newSampleCount; i++) {
      var downSampledValue = 0;
      for(var j=0; j < scale; j++) {
        downSampledValue += series[i*scale+j];
      }
      downSampledSeries[i] = downSampledValue / scale;
    }
    return downSampledSeries;
  }

  function renderFrequencySpectrum(canvas, series, maxAmplitudeFreq, scale) {
    canvas.setTransform(1, 0, 0, 1, 0, 0);
    canvas.clearRect(0, 0, 2048, 10000);
    var i = 0;
    canvas.strokeStyle = "rgb(0,0,0)";
    while(++i < series.length) {
      if(i == maxAmplitudeFreq) {
        canvas.strokeStyle = "rgb(200,0,0)";
      }
      canvas.beginPath();
      canvas.moveTo(i, 0);
      canvas.lineTo(i, series[i] * scale);
      canvas.stroke();
    }
  }

  function productOf() {
    var series = arguments;
    var samples = series[0].length;

    var product = new Float32Array(series[0]);

    for(var i=1; i < series.length; i++) {
      for(var j=0; j < samples; j++) {
        product[j] *= series[i][j];
      }
    }

    return product;
  }

  function render(time) {
    analyser.getFloatFrequencyData(freqData);

    for(var i=0; i < freqData.length; i++) {
      var f = (freqData[i] - analyser.minDecibels) * 
        (analyser.maxDecibels - analyser.minDecibels) *
        0.01;
      if (f<0) f=0; 
      freqData[i] = f;
    }

    freqData2 = downSample(freqData, 2);
    freqData3 = downSample(freqData, 3);

    hsp = productOf(freqData, freqData2, freqData3);

    maxAmplitudeFreq = findLoudestFreq(hsp);

    renderFrequencySpectrum(freqSpectrum0, freqData, maxAmplitudeFreq, 4);
    renderFrequencySpectrum(freqSpectrum1, freqData2, maxAmplitudeFreq, 4);
    renderFrequencySpectrum(freqSpectrum2, freqData3, maxAmplitudeFreq, 4);

    renderFrequencySpectrum(freqSpectrum3, hsp, maxAmplitudeFreq, 0.1);

    pitchElem.innerText = maxAmplitudeFreq;

    window.requestAnimationFrame(render);
  }
})();
