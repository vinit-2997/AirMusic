


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
console.log('played 2');

// // //create a synth and connect it to the master output (your speakers)
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
  