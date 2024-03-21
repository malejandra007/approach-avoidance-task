jsPsych.plugins["choice-approach-avoidance"] = (function() {

    var plugin = {};
  
    plugin.info = {
      name: "choice-approach-avoidance",
      parameters: {
        card_left: {
            type: jsPsych.plugins.parameterType.IMAGE,
            pretty_name: 'Card Left',
            default: undefined,
            description: 'The image for the left card option.'
        },
        card_right: {
            type: jsPsych.plugins.parameterType.IMAGE,
            pretty_name: 'Card Right',
            default: undefined,
            description: 'The image for the right card option.'
        },
        background: {
            type: jsPsych.plugins.parameterType.IMAGE,
            pretty_name: 'Background',
            default: null,
            description: 'The image to be used as the background.'
        },
        day: {
            type: jsPsych.plugins.parameterType.IMAGE,
            pretty_name: 'Day',
            default: null,
            description: 'The image to be used as the day number'
        }, 
        choices: {
            type: jsPsych.plugins.parameterType.KEYS,
            pretty_name: 'Choices',
            default: ['a', 'k'],
            description: 'The valid responses for this trial'
        },
        trial_duration: {
            type: jsPsych.plugins.parameterType.INT,
            pretty_name: 'Trial Duration',
            default: null,
            description: 'How long to show the trial'
        },
        current_energy: {
            type: jsPsych.plugins.parameterType.INT,
            pretty_name: 'Current Energy',
            default: 3,
            description: 'The current energy level of the participant.'
        }
        // Add other parameters as needed
      }
    };
  
    plugin.trial = function(display_element, trial) {
        //clear the display
        display_element.innerHTML = '';

        // Create the HTML for the background
        var html = '<div class="background-img" style="position: relative; width: 90vw; height: 90vh; background-image: url(\'' + trial.background + '\'); background-size: cover; background-position: center center; background-repeat: no-repeat;">';

        // Add the HTML for the left card
        html += '<div style="position: absolute; top: 30%; left: 23%; transform: translate(-50%);">';
        html += '<img src="' + trial.card_left + '" style="width:70%;">';
        html += '</div>';

        // Add the HTML for the right card
        html += '<div style="position: absolute; top: 30%; right: -13%; transform: translate(-50%);">';
        html += '<img src="' + trial.card_right + '" style="width:70%;">';
        html += '</div>';

         // Add the HTML for the day image
        html += '<div style="position: absolute; top: 0; right: 0;">';
        html += '<img src="' + trial.day + '" style="width:40%; margin-left:80px;">';
        html += '</div>';

        // Add the HTML for the current energy image
        // Ensure that the current_energy value is clamped between 1 and 5
        var clampedEnergy = Math.max(1, Math.min(trial.current_energy, 5));
        html += '<div style="position: absolute; top: 0; left: 50%; transform: translate(-50%, 0);">';
        html += '<img src="media/energy_' + clampedEnergy + '.png" style="width:10%;">';
        html += '</div>';

        // Close the background div
        html += '</div>';

        // Set the innerHTML of the display element to the generated HTML
        display_element.innerHTML = html;

      var response_made = false;
      var outcome = {
        chosen_image: null, 
        current_energy: trial.current_energy,
        loss: 0 
      };
      // Set up the response listener
      var after_response = function(info) {
        // Handle the response
        response_made = true;
        jsPsych.pluginAPI.clearTimeout(trial_timeout);

        var chosenImage = '';
        if (info.key === 'a') {
          chosenImage = trial.card_left;
          console.log('Left key pressed.');
        } else if (info.key === 'k') {
          chosenImage = trial.card_right;
          console.log('Right key pressed');
        } else {
          // handle no response 
          chosenImage = null;
          console.log('No valid key press detected.');
        }

        //Energy change based on outcome
        if (chosenImage && chosenImage.includes('gain')) {
          // Parse the filename to extract the probabilities and points
          var match = /option_bar_gain(\d+)_energy(\d+)_alien(\d+)\.png/.exec(chosenImage);
          if (match) {
            var gainProbability = parseInt(match[1], 10);
            var gainPoints = parseInt(match[2], 10);
            var loseProbability = parseInt(match[3], 10);
  
            // Randomly determine the outcome based on the probabilities
            var randomPercent = Math.random() * 100;
            if (randomPercent < gainProbability) {
              // Gain points
              outcome.current_energy += gainPoints;
              outcome.loss = 0;
              console.log('Gained points:', gainPoints);
            } else if (randomPercent < gainProbability + loseProbability) {
              // Lose all points
              outcome.current_energy = 0;
              outcome.loss = 1;
              console.log('Lost all points');
            } else {
              console.log('No change in points');
            }
          }
        } else if (chosenImage && chosenImage.includes('wait')) {
          // Subtract 1 point for 'wait' option
          outcome.current_energy = Math.max(0, outcome.current_energy - 1);
          outcome.loss = 1;
          console.log('Chosen image is a wait option. Lose 1 point.');
        } else {
          // Handle other cases if necessary
          console.log('No valid image chosen or other outcome.');
        }
  
        // Provide feedback based on the outcome
        var imagePath;
        if (outcome.chosen_image && outcome.chosen_image.includes('wait')) {
          imagePath = 'media/you_waited_blank.png'; // Feedback for choosing the wait option
        } else if (outcome.chosen_image === 'too_slow') {
          imagePath = 'media/too_slow_blank.png'; // Feedback for being too slow
        } else if (outcome.loss === 1 && outcome.current_energy === 0) {
          imagePath = 'media/you_got_robbed_blank.png'; // Feedback for being robbed 
        } else if (outcome.loss === 0 && outcome.chosen_image.includes('gain')) {
          // Construct the feedback image path dynamically based on the gainPoints
          imagePath = 'media/you_gained_' + gainPoints + '_points.png'; // Feedback for gaining points
        }
        display_element.innerHTML = '<div class="feedback-img" style="width: 90vw; height: 90vh; overflow: hidden; display: flex; justify-content: center; align-items: center;">' +
        '<img src="' + imagePath + '" style="max-width: 90vw; max-height: 90vh; width: auto; height: auto; object-fit: contain;"></div>';

  
      // End the trial after the feedback is displayed
        jsPsych.pluginAPI.setTimeout(function() {
          jsPsych.finishTrial({
            chosen_image: outcome.chosen_image,
            current_energy: outcome.current_energy, // Include current_energy in the trial data
            loss: outcome.loss
          });
        }, 2000);
      };
  
      // Start the response listener
      jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      });

      // Set a timeout to end the trial if no response is made within the trial duration
      var trial_timeout = jsPsych.pluginAPI.setTimeout(function() {
        if (!response_made) {
          // If no response has been made, show the "too slow" image and deduct a point
          display_element.innerHTML = '<img src="media/too_slow_blank.png" style="width: 90vw; height: 90vh;">';
          var new_energy = Math.max(0, trial.current_energy - 1); // Ensure energy doesn't go below 0
          outcome.loss = 1;
          outcome.chosen_image = 'too slow';
          outcome.current_energy = new_energy; //update current energy

        //end trial after showing too slow image 
        jsPsych.pluginAPI.setTimeout(function() {
          jsPsych.finishTrial({
            chosen_image: outcome.chosen_image,
            current_energy: outcome.current_energy, // Include current_energy in the trial data
            loss: outcome.loss
        });
      }, 2000);
    }
  }, trial.trial_duration);

};
  return plugin;
})();
