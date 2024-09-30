import React, { useEffect } from "react";

import { autoGrow, initChat } from "../../api/chat";

const ChatHistory: React.FC = () => (
    <div id="scroll-wrapper">
        <div id="chat-container" className="card">
            <div className="card-body">
                <div id="chat-history"></div>
            </div>
        </div>
    </div>
);

const ErrorModal: React.FC = () => (
    <div className="modal fade" id="errorModal" tabIndex={-1}>
        <div className="modal-dialog modal-xl">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Unable to access Ollama server</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body">
                    <p id="errorText"></p>
                </div>
            </div>
        </div>
    </div>
);

const NameModal: React.FC = () => (
    <div className="modal fade" id="nameModal" tabIndex={-1} aria-labelledby="nameModalLabel" aria-hidden="true">
        <div className="modal-dialog">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title" id="nameModalLabel">Enter Your Name</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                    <input type="text" className="form-control" id="userName" placeholder="Your Name" />
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" className="btn btn-primary" id="saveName">Save</button>
                </div>
            </div>
        </div>
    </div>
);

const UserInput: React.FC = () => (
    <div className="container p-2 card" id="input-area">
        <div className="input-group">
            <textarea className="form-control" id="user-input" placeholder="Type your question here..." onInput={evt => autoGrow(evt.target)}></textarea>
            <button id="send-button" className="btn btn-primary">Send</button>
        </div>
    </div>
);

const OllamaConfig: React.FC = () => (
    <div className="p-2 flex-grow-1 bd-highlight">
        <label htmlFor="system-prompt" className="me-2" style={{ fontSize: 'normal' }}>System Prompt</label>
        <input id="system-prompt" className="form-control" type="text" placeholder="You are a helpful assistant" style={{ width: 'auto' }} />
        <label htmlFor="host-address" className="me-2" style={{ fontSize: 'normal' }}>Hostname</label>
        <input id="host-address" className="form-control" type="text" placeholder="http://localhost:11434" style={{ width: 'auto' }} />
    </div>
);

const SavedChatSelect: React.FC = () => (
    <>
        <label htmlFor="chat-select" className="me-2" style={{ fontSize: 'normal' }}>History:</label>
        <select id="chat-select" className="form-select me-2" style={{ width: 'auto' }} defaultValue="">
            <option value="" disabled /*selected*/>Select a chat</option>
        </select>
    </>
);

const OllamaModelSelect: React.FC = () => (
    <>
        <label htmlFor="model-select" className="me-2" style={{ fontSize: 'normal' }}>Model:</label>
        <select className="form-select me-5" id="model-select" style={{ width: 'auto' }} defaultValue=""></select>
    </>
);

const ChatActions: React.FC = () => (
    <div className="p-auto flex-grow-1 bd-highlight">
        <div className="d-flex flex-column">
            <button id="new-chat" className="btn btn-dark mb-2" type="button">Reset</button>
            <button id="save-chat" className="btn btn-secondary mb-2" type="button" data-bs-toggle="modal" data-bs-target="#nameModal">Save</button>
            <button id="delete-chat" className="btn btn-danger" type="button">Delete</button>
        </div>
    </div>
);

export const Chat: React.FC = () => {
    useEffect(() => {
        initChat();
    }, [])

    return (<>
        <div className="container">
            <ChatHistory />
        </div>

        <div className="position-fixed w-100" style={{ zIndex: 9999, top: 0, height: '200px', background: 'linear-gradient(180deg, black, transparent)' }}>
            <div className="position-fixed w-100" style={{ zIndex: 9999, top: 0, height: '200px', background: 'linear-gradient(180deg, black, transparent)' }}>
                <div className="d-flex justify-content-between align-items-center m-0" style={{ padding: '16px' }}>
                    <h1>Chat with Ollama</h1>
                    {/* Model dropdown */}
                    <div className="d-flex align-items-center m-1">
                        <OllamaConfig />

                        <div className="d-flex align-items-center m-2">
                            <div className="p-2 flex-grow-1 bd-highlight">
                                <OllamaModelSelect />
                                <SavedChatSelect />
                            </div>
                            <ChatActions />
                        </div>
                    </div>
                </div>

                <UserInput />

                {/* Modal */}
                <NameModal />
                <ErrorModal />
            </div>
        </div>
    </>)
};

export default Chat;