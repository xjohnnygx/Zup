import { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { User } from "../types/user";
import { Contact } from "../types/contact";
import { Hash } from "../security/encryption";
import { UTC_to_Local } from "../utils/dates";
import { Message } from "../types/message";
import { Attachment } from "../types/attachment";
import { ImgDisplayer } from "../utils/imageDisplayer";
import { cropText } from "../utils/text";
import back_arrow from "../externals/back_arrow.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFile,
    faMicrophone
} from "@fortawesome/free-solid-svg-icons";


type Chat_Props = {
    client: User;
    contact: Contact|null;
    setContact: React.Dispatch<React.SetStateAction<Contact|null>>;
    updateInbox: React.Dispatch<React.SetStateAction<boolean>>;
    visibilityChange: boolean;
};

function Chat(props: Chat_Props): JSX.Element {

    const [messageWebsocket, setMessageWebsocket] = useState<WebSocket|null>(null);
    const [notificationWebsocket, setNotificationWebsocket] = useState<WebSocket|null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder|null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [textField, setTextField] = useState(true);
    const [uploadButton, setUploadButton] = useState(true);
    const [recordButton, setRecordButton] = useState(true);
    const [cancelButton, setCancelButton] = useState(false);
    const [sendButton, setSendButton] = useState(false);
    const [centerButtons, setCenterButtons] = useState(false);
    const [display, setDisplay] = useState(false);
    const [abort, setAbort] = useState(false);
    const [files, setFiles] = useState<string[]|null>(null);
    const [imgSrc, setImgSrc] = useState<string|null>(null);
    const [amount, setAmount] = useState(50);
    const [conversation, setConversation] = useState<(Message|Attachment)[]>([]);
    const [reference, setReference] = useState<Message|null>(null);
    const chatRef = useRef<HTMLUListElement>(null);
    const textFieldRef = useRef<HTMLTextAreaElement>(null);
    const uploadButtonRef = useRef<HTMLInputElement>(null);
    const sendButtonRef = useRef<HTMLInputElement>(null);


    function onMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function connect(): void {
        const newMessageWebsocket = new WebSocket("ws://192.168.0.7:8080/message?client=" + Hash(props.client.code));
        const newNotificationWebsocket = new WebSocket("ws://192.168.0.7:8080/notification?client=" + Hash(props.client.code));
        newMessageWebsocket.onmessage = function(event: MessageEvent): void {
            const payload = JSON.parse(event.data);
            switch (payload.type) {
                case "message":
                    const message = payload.message as Message;
                    setConversation(state => [...state, message]);
                    chatRef.current && (chatRef.current.scrollTop = chatRef.current.scrollHeight);
                    break;
                case "attachment":
                    const attachments = payload.attachments as Attachment[];
                    setConversation(state => [...state, ...attachments]);
                    chatRef.current && (chatRef.current.scrollTop = chatRef.current.scrollHeight);
                    break;
                default:
                    return;
            }
        };
        newNotificationWebsocket.onmessage = function(event: MessageEvent): void {
            const payload = JSON.parse(event.data);
            switch (payload.task) {
                case "update chat":
                    setRefresh(state => !state);
                    break;
                case "update inbox":
                    props.updateInbox(state => !state);
                    break;
                default:
                    return;
            }
        };
        newMessageWebsocket.onerror = function(event: Event): void {
            const error: ErrorEvent = event as ErrorEvent;
            console.error(error);
        };
        newNotificationWebsocket.onerror = function(event: Event): void {
            const error: ErrorEvent = event as ErrorEvent;
            console.error(error);
        };
        setMessageWebsocket(newMessageWebsocket);
        setNotificationWebsocket(newNotificationWebsocket);
    }


    async function fetch_conversation(): Promise<void> {
        if (props.contact !== null) {
            try {
                const response: Response = await fetch("http://192.168.0.7:8080/display_conversation", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        client: props.client.code,
                        contact: props.contact?.code,
                        amount: amount
                    })
                });
                if (response.status !== 200) {
                    alert("unable to load conversation. try reloading the page");
                    return;
                }
                setConversation(await response.json());
            }
            catch (error) {
                console.error(error);
                alert("unable to load conversation. try reloading the page");
            }
        }
    }


    async function delete_message(message: Message|Attachment): Promise<void> {
        try {
            const response: Response = await fetch("http://192.168.0.7:8080/delete_message", {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    client: props.client.userID,
                    type: message.instanceType,
                    id: ("messageID" in message) ? message.messageID : message.attachmentID
                })
            });
            if (response.status !== 200) {
                alert(`something went wrong\nunable to process the request.`);
                return;
            }
            if (notificationWebsocket) {
                notificationWebsocket.readyState !== 1 && connect();
                notificationWebsocket.send(JSON.stringify(await response.json()));
                props.updateInbox(state => !state);
                setRefresh(state => !state);
            }
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }


    function handleDisplayer(src: string|null): void {
        setImgSrc(src);
        setDisplay(true);
    }

    function display_media(mediaType: string, url: string): JSX.Element {
        const src = ("http://192.168.0.7:8080/media" + url);
        switch (mediaType) {
          case "image":
            return <img
                    className="container"
                    style={{ cursor: "pointer" }}
                    src={src}
                    alt="Image"
                    onClick={() => handleDisplayer(url)}
                    />;
          case "video":
            return <video className="container" controls src={src} />;
          case "audio":
            return <audio className="container" controls src={src} />;
          default:
            return <a href={src}>document</a>
        }
    }


    function display_message(message: Message|Attachment, index: number): JSX.Element {
        return (
            ("messageID" in message) ?
                (
                    <Dropdown
                    key={index}
                    style={{
                        width: "70%",
                        left: (message.sender === props.client.userID) ? "26%" : 0
                    }}
                    className={
                        (message.sender === props.client.userID) ? 
                        "container d-flex flex-column align-items-center bg-teal text-white rounded-5 m-2" :
                        "container d-flex flex-column align-items-center bg-pink text-white rounded-5 m-2"
                    }>
                        <Dropdown.Toggle
                        style={{
                            backgroundColor: "transparent",
                            border: "none"
                        }}/>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setReference(message)}>
                                reply
                            </Dropdown.Item>
                            {(message.sender === props.client.userID) &&
                            <Dropdown.Item onClick={() => delete_message(message)}>
                                delete for everyone
                            </Dropdown.Item>}
                        </Dropdown.Menu>
                        {message.reference &&
                        <div
                        style={{
                            width: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            textAlign: "center"
                        }}
                        className="rounded-3 pt-3"
                        >
                            <p>{cropText(message.reference, 30)}</p>
                        </div>}
                        <div style={{ textAlign: "center", overflowWrap: "break-word", wordWrap: "break-word", wordBreak: "break-word" }}>
                            <p style={{ overflowWrap: "break-word", wordWrap: "break-word", wordBreak: "break-word" }}>{message.text}</p>
                            <span style={{ fontSize: "80%" }}>{UTC_to_Local(message.dateTime)}</span>
                        </div>
                    </Dropdown>
                ) :
                (
                    <Dropdown
                    key={index}
                    style={{
                        width: "70%",
                        left: (message.sender === props.client.userID) ? "26%" : 0
                    }}
                    className={
                        (message.sender === props.client.userID) ? 
                        "container d-flex flex-column align-items-center bg-transparent rounded-5 m-2" :
                        "container d-flex flex-column align-items-center bg-transparent rounded-5 m-2"
                    }>
                        <Dropdown.Toggle
                        style={{
                            backgroundColor: "transparent",
                            color: "black",
                            border: "none"
                        }}/>
                        <Dropdown.Menu>
                        {(message.sender === props.client.userID) &&
                            <Dropdown.Item onClick={() => delete_message(message)}>
                                delete for everyone
                            </Dropdown.Item>}
                        </Dropdown.Menu>
                        {display_media(message.type.split("/")[0], message.url)}
                        <span style={{ fontSize: "80%" }}>{UTC_to_Local(message.dateTime)}</span>
                    </Dropdown>
                )
        );
    }


    async function upload(data: FormData): Promise<void> {
        try {
            const response: Response = await fetch("http://192.168.0.7:8080/uploads",{
                method: "POST",
                body: data
            });
            if (response.status !== 200) {
                alert(`something went wrong\nunable to process the request.`);
                return;
            }
            const attachments: Attachment[] = await response.json();
            if (messageWebsocket) {
                messageWebsocket.readyState !== 1 && connect();
                messageWebsocket.send(JSON.stringify({
                    type: "attachment",
                    sender: props.client.code,
                    recipient: props.contact?.code,
                    attachments: attachments
                }));
            }
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }


    async function startRecording(): Promise<void> {
        setAudioChunks([]);
        try {
            const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            const newMediaRecorder = new MediaRecorder(stream);
            newMediaRecorder.addEventListener("dataavailable", function(event: BlobEvent) {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            });
            newMediaRecorder.addEventListener("start", function(event: Event) {
                setCenterButtons(true);
                setReference(null);
                setUploadButton(false);
                setTextField(false);
                setRecordButton(false);
                setCancelButton(true);
                setSendButton(true);
            });
            newMediaRecorder.addEventListener("stop", function(event: Event) {
                setCenterButtons(false);
                setUploadButton(true);
                setTextField(true);
                setRecordButton(true);
                setCancelButton(false);
                setSendButton(false);
                if (abort) {
                    setAbort(false);
                    setAudioChunks([]);
                    return;
                }
                const timestamp: string = new Date().toISOString().replace(/[-:.]/g, '');
                const audioBlob: Blob = new Blob(audioChunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("files", audioBlob, ("audio" + timestamp + ".wav"));
                formData.append("metadata", JSON.stringify({
                    sender: props.client.code,
                    recipient: props.contact?.code
                }));
                upload(formData);
                setAudioChunks([]);
            });
            newMediaRecorder.addEventListener("error", function(event: Event) {
                const error = event as ErrorEvent;
                console.error(error);
                alert("unable to record audio");
            });
    
            newMediaRecorder.start();
            setMediaRecorder(newMediaRecorder);
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }


    function cancelRecording(): void {
        if (mediaRecorder) {
            setAbort(true);
            mediaRecorder.stop();
        }
    }


    function handleFileChange(): void {
        const selectedFiles = uploadButtonRef.current?.files;
        if ((selectedFiles) && (selectedFiles.length > 0)) {
            const fileNames = Array.from(selectedFiles).map(file => file.name);
            setCenterButtons(true);
            setReference(null);
            setTextField(false);
            setRecordButton(false);
            setSendButton(true);
            setFiles(fileNames);
        }
    };


    function handleInputChange(): void {
        if (textFieldRef.current && textFieldRef.current.value) {
            setUploadButton(false);
            setRecordButton(false);
            setSendButton(true);
            return;
        }
        setUploadButton(true);
        setRecordButton(true);
        setSendButton(false);
    }


    function Send(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (messageWebsocket && notificationWebsocket) {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                notificationWebsocket.readyState !== 1 && connect();
                notificationWebsocket.send(JSON.stringify({
                    notify_user: props.contact?.code,
                    operation: "update inbox"
                }));
                props.updateInbox(state => !state);
                return;
            }
            if (
                uploadButtonRef.current && 
                uploadButtonRef.current.files && 
                uploadButtonRef.current.files.length > 0 &&
                uploadButtonRef.current.value
                ) {
                const formData = new FormData();
                const selectedFiles = uploadButtonRef.current.files;
                for (var i = 0; i < selectedFiles.length; ++i) {
                    formData.append("files", selectedFiles[i])
                }
                formData.append("metadata", JSON.stringify({
                    sender: props.client.code,
                    recipient: props.contact?.code
                }));
                upload(formData);
                setCenterButtons(false);
                setTextField(true);
                setRecordButton(true);
                setSendButton(false);
                setFiles(null);
                uploadButtonRef.current.value = "";
                notificationWebsocket.readyState !== 1 && connect();
                notificationWebsocket.send(JSON.stringify({
                    notify_user: props.contact?.code,
                    operation: "update inbox"
                }));
                props.updateInbox(state => !state);
                return;
            }
            if (
                chatRef.current &&
                textFieldRef.current &&
                !(/^\s*$/.test(textFieldRef.current.value))
                ) {
                if (messageWebsocket.readyState !== 1 && notificationWebsocket.readyState !== 1) {
                    connect();
                }
                messageWebsocket.send(JSON.stringify({
                    type: "message",
                    sender: props.client.code,
                    recipient: props.contact?.code,
                    text: textFieldRef.current.value,
                    reference: (reference) ? reference.messageID : 0
                }));
                notificationWebsocket.send(JSON.stringify({
                    notify_user: props.contact?.code,
                    operation: "update inbox"
                }));
                setReference(null);
                setUploadButton(true);
                setRecordButton(true);
                setSendButton(false);
                textFieldRef.current.value = "";
                textFieldRef.current.style.height = "auto";
                props.updateInbox(state => !state);
            }
            return;
        }
        connect();
    }
      

    useEffect(function() {
        fetch_conversation();
    }, [
        refresh,
        amount,
        props.contact,
        props.visibilityChange
    ]);

    useEffect(function() {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    },[conversation]);

    useEffect(function() {
        connect();
    },[]);

    if (props.contact !== null) {
        return (
            <div
            className="container-fluid d-flex flex-column align-items-center p0 m0"
            style={{ height: "100vh" }}
            >
                <div className="container-fluid rounded-5 shadow">
                    <div className="row align-items-center">
                        <div className="col-1">
                            <img
                            style={{
                                width: "50px",
                                cursor: "pointer",
                            }}
                            onClick={() => props.setContact(null)}
                            src={back_arrow}
                            />
                        </div>
                        <div className="col">
                            <div
                            // style={{ marginLeft: -20 }}
                            className="container d-flex flex-column align-items-center pt-3"
                            >
                                <img
                                className="rounded-circle"
                                style={{
                                    height: "100px",
                                    cursor: "pointer",
                                }}
                                onClick={() => handleDisplayer(props.contact && props.contact.photo)}
                                src={("http://192.168.0.7:8080/media" + (props.contact.photo || "/default_user_photo.jpg"))}
                                alt="photo"
                                />
                                <p className="lead fs-3">{props.contact.username}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <ul
                className="container"
                ref={ chatRef }
                onScroll={(event) => {
                    if (event.currentTarget.scrollTop <= 0) {
                        setAmount(amount => (amount * 2));
                    }
                }}
                style={{
                    maxHeight: "500px",
                    overflowY: "auto",
                    overflowX: "hidden"
                }}>
                    {conversation.map((message, index) => display_message(message, index))}
                </ul>
                {(reference) && (
                <div>
                    <strong>
                        <span
                        style={{ cursor: "pointer" }}
                        onClick={() => setReference(null)}
                        >&times;</span>
                    </strong>
                    <p>{cropText(reference.text, 30)}</p>
                </div>
                )}
                {(files && files.length > 0) && (
                <div>
                    <strong>
                        <span
                        style={{ cursor: "pointer" }}
                        onClick={function() {
                            if (uploadButtonRef.current) {
                                uploadButtonRef.current.value = "";
                                setCenterButtons(false);
                                setTextField(true);
                                setRecordButton(true);
                                setSendButton(false);
                                setFiles(null);
                            }
                        }}>&times;</span>
                    </strong>
                    <ul>
                        {files.map((filename, index) => <p key={index} className="mb-0">{filename}</p>)}
                    </ul>
                </div>
                )}
                <form className="container" onSubmit={event => Send(event)}>
                    <div className="row m-0 p-0">
                        {(uploadButton) && (
                            <>
                                <FontAwesomeIcon
                                title="attach"
                                className="col-1 mt-4"
                                onClick={() => uploadButtonRef.current?.click()}
                                style={{
                                    cursor: "pointer",
                                    fontSize: "150%",
                                    display: (files && files.length > 0) ? "none" : "block"
                                }}
                                icon={ faFile }
                                />
                                <input
                                type="file"
                                ref={ uploadButtonRef }
                                multiple
                                onChange={ handleFileChange }
                                hidden
                                />
                            </>
                        )}

                        {(textField) && (
                            <textarea
                            rows={1}
                            className="col p-2 rounded-5 border-0 shadow mt-3 mb-2"
                            placeholder="message"
                            ref={ textFieldRef }
                            onChange={ handleInputChange }
                            onKeyDown={ event => {
                                if (onMobile()) return;
                                if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    sendButtonRef.current?.click();
                                }
                            }}
                            onFocus={event => {
                                event.currentTarget.style.outline = "none";
                            }}
                            onInput={
                                (event) => {
                                    event.currentTarget.style.height = "auto";
                                    event.currentTarget.style.height = event.currentTarget.scrollHeight + "px";
                                }
                            }/>
                        )}

                        {(recordButton) && 
                        <FontAwesomeIcon
                        title="record audio"
                        className="col-1 mt-4"
                        style={{ cursor: "pointer", fontSize: "150%" }}
                        icon={ faMicrophone }
                        onClick={ startRecording }
                        />}

                        {(cancelButton) && 
                        <input
                        className="col mb-4 border-0 bg-transparent text-danger fw-bold"
                        type="button"
                        value="Cancel"
                        onClick={ cancelRecording }
                        />}

                        {(sendButton) && 
                        <input
                        ref={ sendButtonRef }
                        className={(centerButtons ? "col mb-4 " : "col-2 mt-3 ") + "border-0 bg-transparent text-primary fw-bold"}
                        type="submit"
                        value="Send"
                        />}
                    </div>
                </form>
                <ImgDisplayer
                setTrigger={setDisplay}
                trigger={display}
                src={imgSrc}
                />
            </div>
        );
    }

    return (
        <div
        className="container-fluid d-flex flex-column align-items-center p-0 bg-purple"
        style={{ height: "100vh" }}
        >
            <h1
            style={{
                marginTop: "20vh",
                fontSize: "200px",
                fontWeight: "bolder",
                color: "white"
            }}>Zup!</h1>
        </div>
    );
}
  
  export default Chat;