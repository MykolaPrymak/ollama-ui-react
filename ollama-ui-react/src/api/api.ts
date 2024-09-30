
import { textBoxBaseHeight } from "../const";

const clipboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
</svg>`

let ollama_host: string | null;
// let rebuildRules = undefined;
export const initAPI = () => {
  // if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
  //   rebuildRules = async (domain) => {
  //     const domains = [domain];
  //     /** @type {chrome.declarativeNetRequest.Rule[]} */
  //     const rules = [{
  //       id: 1,
  //       condition: {
  //         requestDomains: domains
  //       },
  //       action: {
  //         type: 'modifyHeaders',
  //         requestHeaders: [{
  //           header: 'origin',
  //           operation: 'set',
  //           value: `http://${domain}`,
  //         }],
  //       },
  //     }];
  //     await chrome.declarativeNetRequest.updateDynamicRules({
  //       removeRuleIds: rules.map(r => r.id),
  //       addRules: rules,
  //     });
  //   }
  // }


  ollama_host = localStorage.getItem("host-address");
  if (!ollama_host) {
    ollama_host = 'http://localhost:11434'
  } else {
    const hostAddressInput = document.getElementById("host-address") as HTMLInputElement;
    if (hostAddressInput) {
      hostAddressInput.value = ollama_host;
    }
  }

  const ollama_system_prompt = localStorage.getItem("system-prompt");
  if (ollama_system_prompt) {
    const systemPromptInput = document.getElementById("system-prompt") as HTMLInputElement;
    if (systemPromptInput) {
      systemPromptInput.value = ollama_system_prompt;
    }
  }

  // if (rebuildRules) {
  //   rebuildRules(ollama_host);
  // }
}

export const setHostAddress = () => {
  ollama_host = document.getElementById("host-address").value;
  localStorage.setItem("host-address", ollama_host);
  populateModels();
  // if (rebuildRules) {
  //   rebuildRules(ollama_host);
  // }
}

// Fetch available models and populate the dropdown
export const populateModels = async () => {
  document.getElementById('send-button').addEventListener('click', submitRequest);

  try {
    const data = await getModels();

    const selectElement = document.getElementById('model-select');

    // set up handler for selection
    selectElement.onchange = (() => updateModelInQueryString(selectElement.value));

    data.models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model.name;
      option.innerText = model.name;
      selectElement.appendChild(option);
    });

    // select option present in url parameter if present
    const queryParams = new URLSearchParams(window.location.search);
    const requestedModel = queryParams.get('model');
    // update the selection based on if requestedModel is a value in options
    if ([...selectElement.options].map(o => o.value).includes(requestedModel)) {
      selectElement.value = requestedModel;
    }
    // otherwise set to the first element if exists and update URL accordingly
    else if (selectElement.options.length) {
      selectElement.value = selectElement.options[0].value;
      updateModelInQueryString(selectElement.value);
    }
  }
  catch (error) {
    document.getElementById('errorText').innerHTML =
      DOMPurify.sanitize(marked.parse(
        `Ollama-ui was unable to communitcate with Ollama due to the following error:\n\n`
        + `\`\`\`${error.message}\`\`\`\n\n---------------------\n`
        + faqString));
    let modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
  }
}

export const setSystemPrompt = () => {
  const systemPrompt = document.getElementById("system-prompt").value;
  localStorage.setItem("system-prompt", systemPrompt);
}

export const getModels = async () => {
  const response = await fetch(`${ollama_host}/api/tags`);
  const data = await response.json();
  return data;
}


// const to =  handle the user input and call the API function=> s
export const submitRequest = async () => {
  document.getElementById('chat-container').style.display = 'block';

  const input = document.getElementById('user-input').value;
  const selectedModel = getSelectedModel();
  const context = document.getElementById('chat-history').context;
  const systemPrompt = document.getElementById('system-prompt').value;
  const data = { model: selectedModel, prompt: input, context: context, system: systemPrompt };

  // Create user message element and append to chat history
  let chatHistory = document.getElementById('chat-history');
  let userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'mb-2 user-message';
  userMessageDiv.innerText = input;
  chatHistory.appendChild(userMessageDiv);

  // Create response container
  let responseDiv = document.createElement('div');
  responseDiv.className = 'response-message mb-2 text-start';
  responseDiv.style.minHeight = '3em'; // make sure div does not shrink if we cancel the request when no text has been generated yet
  const spinner = document.createElement('div');
  spinner.className = 'spinner-border text-light';
  spinner.setAttribute('role', 'status');
  responseDiv.appendChild(spinner);
  chatHistory.appendChild(responseDiv);

  // create button to stop text generation
  let interrupt = new AbortController();
  let stopButton = document.createElement('button');
  stopButton.className = 'btn btn-danger';
  stopButton.innerHTML = 'Stop';
  stopButton.onclick = (e) => {
    e.preventDefault();
    interrupt.abort('Stop button pressed');
  }
  // add button after sendButton
  const sendButton = document.getElementById('send-button');
  sendButton.insertAdjacentElement('beforebegin', stopButton);

  // change autoScroller to keep track of our new responseDiv
  // TODO: enable this
  // autoScroller.observe(responseDiv);

  postRequest(data, interrupt.signal)
    .then(async response => {
      await getResponse(response, (parsedResponse: { response: any; done: any; context: any; }) => {
        let word = parsedResponse.response;
        if (parsedResponse.done) {
          chatHistory.context = parsedResponse.context;
          // Copy button
          let copyButton = document.createElement('button');
          copyButton.className = 'btn btn-secondary copy-button';
          copyButton.innerHTML = clipboardIcon;
          copyButton.onclick = () => {
            navigator.clipboard.writeText(responseDiv.hidden_text).then(() => {
              console.log('Text copied to clipboard');
            }).catch(err => {
              console.error('Failed to copy text:', err);
            });
          };
          responseDiv.appendChild(copyButton);
        }
        // add word to response
        if (word != undefined && word != "") {
          if (responseDiv.hidden_text == undefined) {
            responseDiv.hidden_text = "";
          }
          responseDiv.hidden_text += word;
          responseDiv.innerHTML = DOMPurify.sanitize(marked.parse(responseDiv.hidden_text)); // Append word to response container
        }
      });
    })
    .then(() => {
      stopButton.remove(); // Remove stop button from DOM now that all text has been generated
      spinner.remove();
    })
    .catch(error => {
      if (error !== 'Stop button pressed') {
        console.error(error);
      }
      stopButton.remove();
      spinner.remove();
    });

  // Clear user input
  const element = document.getElementById('user-input');
  element.value = '';
  $(element).css("height", textBoxBaseHeight + "px");
}

// Function to send a POST request to the API
export const postRequest = (data, signal) => {

  const URL = `${ollama_host}/api/generate`;
  return fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    signal: signal
  });
}

// const to =  stream the response from the server
export const getResponse = async (response, callback) => {
  const reader = response.body.getReader();
  let partialLine = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    // Decode the received value and split by lines
    const textChunk = new TextDecoder().decode(value);
    const lines = (partialLine + textChunk).split('\n');
    partialLine = lines.pop(); // The last line might be incomplete

    for (const line of lines) {
      if (line.trim() === '') continue;
      const parsedResponse = JSON.parse(line);
      callback(parsedResponse); // Process each response word
    }
  }

  // Handle any remaining line
  if (partialLine.trim() !== '') {
    const parsedResponse = JSON.parse(partialLine);
    callback(parsedResponse);
  }
}

// const to =  get the selected mode=> l
export const getSelectedModel = () => {
  return document.getElementById('model-select').value;
}