import { getSelectedModel, initAPI, populateModels, setHostAddress, setSystemPrompt, submitRequest } from "./api";
import { textBoxBaseHeight } from "../const";

const faqString = `
**How can I expose the Ollama server?**

By default, Ollama allows cross origin requests from 127.0.0.1 and 0.0.0.0.

To support more origins, you can use the OLLAMA_ORIGINS environment variable:

\`\`\`
OLLAMA_ORIGINS=${window.location.origin} ollama serve
\`\`\`

Also see: https://github.com/jmorganca/ollama/blob/main/docs/faq.md
`;


// change settings of marked from default to remove deprecation warnings
// see conversation here: https://github.com/markedjs/marked/issues/2793
marked.use({
  mangle: false,
  headerIds: false
});

const autoFocusInput = () => {
  const userInput = document.getElementById('user-input') as HTMLTextAreaElement;
  userInput.focus();
}

/*
takes in model as a string
updates the query parameters of page url to include model name
*/
const updateModelInQueryString = (model: string) => {
  // make sure browser supports features
  if (window.history.replaceState && 'URLSearchParams' in window) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("model", model);
    // replace current url without reload
    const newPathWithQuery = `${window.location.pathname}?${searchParams.toString()}`
    window.history.replaceState(null, '', newPathWithQuery);
  }
}



// adjusts the padding at the bottom of scrollWrapper to be the height of the input box
const adjustPadding = () => {
  const inputBoxHeight = document.getElementById('input-area').offsetHeight;
  const scrollWrapper = document.getElementById('scroll-wrapper');
  scrollWrapper.style.paddingBottom = `${inputBoxHeight + 15}px`;
}

var autoScroller: ResizeObserver;
const setupListeners = () => {
  // sets up padding resize whenever input box has its height changed
  const autoResizePadding = new ResizeObserver(() => {
    adjustPadding();
  });
  autoResizePadding.observe(document.getElementById('input-area'));


  // variables to handle auto-scroll
  // we only need one ResizeObserver and isAutoScrollOn variable globally
  // no need to make a new one for every time submitRequest is called
  const scrollWrapper = document.getElementById('scroll-wrapper');
  let isAutoScrollOn = true;
  // autoscroll when new line is added

  // const 
  autoScroller = new ResizeObserver(() => {
    if (isAutoScrollOn) {
      scrollWrapper.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  });

  // event listener for scrolling
  let lastKnownScrollPosition = 0;
  let ticking = false;
  document.addEventListener("scroll", () => {
    // if user has scrolled up and autoScroll is on we turn it off
    if (!ticking && isAutoScrollOn && window.scrollY < lastKnownScrollPosition) {
      window.requestAnimationFrame(() => {
        isAutoScrollOn = false;
        ticking = false;
      });
      ticking = true;
    }
    // if user has scrolled nearly all the way down and autoScroll is disabled, re-enable
    else if (!ticking && !isAutoScrollOn &&
      window.scrollY > lastKnownScrollPosition && // make sure scroll direction is down
      window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 30 // add 30px of space--no need to scroll all the way down, just most of the way
    ) {
      window.requestAnimationFrame(() => {
        isAutoScrollOn = true;
        ticking = false;
      });
      ticking = true;
    }
    lastKnownScrollPosition = window.scrollY;
  });

  // Event listener for Ctrl + Enter or CMD + Enter
  document.getElementById('user-input').addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      submitRequest();
    }
  });

}





const deleteChat = () => {
  const selectedChat = document.getElementById("chat-select").value;
  localStorage.removeItem(selectedChat);
  updateChatList();
}

// const to =  save chat with a unique nam=> e
const saveChat = () => {
  const chatName = document.getElementById('userName').value;

  // Close the modal
  const bootstrapModal = bootstrap.Modal.getInstance(document.getElementById('nameModal'));
  bootstrapModal.hide();

  if (chatName === null || chatName.trim() === "") return;
  const history = document.getElementById("chat-history").innerHTML;
  const context = document.getElementById('chat-history').context;
  const systemPrompt = document.getElementById('system-prompt').value;
  const model = getSelectedModel();
  localStorage.setItem(chatName, JSON.stringify({ "history": history, "context": context, system: systemPrompt, "model": model }));
  updateChatList();
}

// const to =  load selected chat from dropdow=> n
const loadSelectedChat = () => {
  const selectedChat = document.getElementById("chat-select").value;
  const obj = JSON.parse(localStorage.getItem(selectedChat));
  document.getElementById("chat-history").innerHTML = obj.history;
  document.getElementById("chat-history").context = obj.context;
  document.getElementById("system-prompt").value = obj.system;
  updateModelInQueryString(obj.model)
  document.getElementById('chat-container').style.display = 'block';
}

const startNewChat = () => {
  document.getElementById("chat-history").innerHTML = null;
  document.getElementById("chat-history").context = null;
  document.getElementById('chat-container').style.display = 'none';
  updateChatList();
}

// const to =  update chat list dropdow=> n
const updateChatList = () => {
  const chatList = document.getElementById("chat-select");
  chatList.innerHTML = '<option value="" disabled selected>Select a chat</option>';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === "host-address" || key == "system-prompt") continue;
    const option = document.createElement("option");
    option.value = key;
    option.text = key;
    chatList.add(option);
  }
}

export const autoGrow = (element: HTMLTextAreaElement) => {
  const maxHeight = 200;  // This should match the max-height set in CSS
  // Count the number of lines in the textarea based on newline characters
  const numberOfLines = $(element).val().split('\n').length;

  // Temporarily reset the height to auto to get the actual scrollHeight
  $(element).css("height", "auto");
  let newHeight = element.scrollHeight;

  // If content is one line, set the height to baseHeight
  if (numberOfLines === 1) {
    newHeight = textBoxBaseHeight;
  } else if (newHeight > maxHeight) {
    newHeight = maxHeight;
  }

  $(element).css("height", newHeight + "px");
}

var isChatInitialized = false;
export const initChat = () => {
  if (isChatInitialized) {
    return;
  }

  isChatInitialized = true;
  initAPI();
  setupListeners();

  updateChatList();
  populateModels();
  adjustPadding();
  autoFocusInput();

  document.getElementById("delete-chat").addEventListener("click", deleteChat);
  document.getElementById("new-chat").addEventListener("click", startNewChat);
  document.getElementById("saveName").addEventListener("click", saveChat);
  document.getElementById("chat-select").addEventListener("change", loadSelectedChat);
  document.getElementById("host-address").addEventListener("change", setHostAddress);
  document.getElementById("system-prompt").addEventListener("change", setSystemPrompt);
}
