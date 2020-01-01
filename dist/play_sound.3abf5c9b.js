// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"play_sound.js":[function(require,module,exports) {
// var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
// var audioContext = new AudioContextFunc();
// var player=new WebAudioFontPlayer();
player.loader.decodeAfterLoading(audioContext, '_drum_35_17_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_40_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_42_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_51_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_50_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_48_1_JCLive_sf2_file');
player.loader.decodeAfterLoading(audioContext, '_drum_41_1_JCLive_sf2_file');
player.queueWaveTable(audioContext, audioContext.destination, _drum_40_1_JCLive_sf2_file, 0, 40, 3);
console.log('played 1');
player.queueWaveTable(audioContext, audioContext.destination, _drum_42_1_JCLive_sf2_file, 0, 42, 3);
console.log('played 2'); // // //create a synth and connect it to the master output (your speakers)
// // var synth = new Tone.Synth().toMaster()
// // //play a middle 'C' for the duration of an 8th note
// // synth.triggerAttackRelease('C4', '8n')
// // console.log('playing sound');
// // (function() {
// //     // Membrane Synth https://tonejs.github.io/docs/r12/MembraneSynth
//     const synth = new Tone.MembraneSynth().toMaster();
//     const notes = ["G2", [null, "G2"], null, "Bb2", "C3"];
//     const synthPart = new Tone.Sequence(
//       function(time, note) {
//         synth.triggerAttackRelease(note, "10hz", time);
//       },
//       notes,
//       "8n"
//     );
//     // getAudioContext().resume()
//     synthPart.start();
//     Tone.Transport.start();
//     console.log('playing sound');
//     /**
//      * Play Controls
//      */
//     // let playing = false;
//     // document.querySelector("body").addEventListener("click", function() {
//     //   if (!playing) {
//     //     Tone.Transport.start();
//     //     playing = true;
//     //     console.log('playing sound');
//     //   } else {
//     //     Tone.Transport.stop();
//     //   }
//     // });
// //   })();
},{}]},{},["play_sound.js"], null)
//# sourceMappingURL=/play_sound.3abf5c9b.js.map