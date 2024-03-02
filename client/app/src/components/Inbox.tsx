import { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { User } from "../types/user";
import { Contact } from "../types/contact";
import { Hash } from "../security/encryption";
import { UTC_to_Local } from "../utils/dates";
import { cropText } from "../utils/text";
import { ImgDisplayer } from "../utils/imageDisplayer";


type Inbox_Props = {
    client: User;
    selectContact: React.Dispatch<React.SetStateAction<Contact|null>>;
    set_profile_window: React.Dispatch<React.SetStateAction<boolean>>;
    updateInbox: boolean;
    visibilityChange: boolean;
};

function Inbox(props: Inbox_Props): JSX.Element {

    const navigate = useNavigate();
    const input = useRef<HTMLInputElement|null>(null);
    const [refresh, setRefresh] = useState(false);
    const [disableContactBtn, setDisableContactBtn] = useState(true);
    const [inbox, setInbox] = useState<Contact[]>([]);
    const [imgSrc, setImgSrc] = useState<string|null>(null);
    const [display, setDisplay] = useState(false);

    async function request_inbox(): Promise<void> {
        try {
            const response: Response = await fetch("http://192.168.0.7:8080/request_inbox?client=" + Hash(props.client.code));
            switch (response.status) {
                case 200:
                    setInbox(await response.json());
                    break;
                case 401:
                    navigate("/");
                    break;
                default:
                    alert("unable to load conversations.");
            }
        }
        catch (error) {
            console.error(error);
            alert("unable to load conversations.");
        }
    }


    function handleInputChange(): void {
        if (input.current && !(/^\s*$/.test(input.current.value))) {
            setDisableContactBtn(false);
            return;
        }
        setDisableContactBtn(true);
    }

    async function add_contact(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        try {
            if (input.current && (input.current.value.length === 10)) {
                const response: Response = await fetch("http://192.168.0.7:8080/add_contact", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        client: props.client.code,
                        contact: input.current.value
                    })
                });
                switch (response.status) {
                    case 200:
                        input.current.value = "";
                        setDisableContactBtn(true);
                        setRefresh(state => !state);
                        return;
                    case 409:
                        input.current.value = "";
                        setDisableContactBtn(true);
                        alert(await response.json());
                        return;
                    default:
                        input.current.value = "";
                        setDisableContactBtn(true);
                        alert(`contact '${input.current.value}' not found.`);
                        return;
                }
            }
            if (input.current) input.current.value = "";
            setDisableContactBtn(true);
            alert("invalid code");
        }
        catch (error) {
            console.error(error);
            setDisableContactBtn(true);
            alert(`something went wrong\nunable to process the request.`);
        }
    }

    async function remove_conversation(contact: Contact): Promise<void> {
        try {
            const response: Response = await fetch("http://192.168.0.7:8080/remove_conversation", {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    client: props.client.code,
                    contact: contact.code
                })
            });
            if (response.status !== 200) {
                alert(`something went wrong\nunable to process the request.`);
                return;
            }
            setRefresh(state => !state);
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }


    function handleImageClick(img: string|null): void {
        setImgSrc(img);
        setDisplay(true);
    }

    useEffect(function() {
        request_inbox();
    },[refresh, props.updateInbox, props.visibilityChange]);

    if (inbox.length > 0) {
        return (
            <div
            className="container-fluid d-flex flex-column align-items-center p-0"
            style={{
                maxHeight: "100vh",
                overflowY: "auto",
            }}>
                <div
                style={{ cursor: "pointer" }}
                className="container d-flex flex-column align-items-center pt-3 cursor-pointer"
                onClick={() => props.set_profile_window(true)}>
                    <img
                    className="rounded-circle"
                    style={{ height: "100px" }}
                    src={("http://192.168.0.7:8080/media" + (props.client.photo_url || "/default_user_photo.jpg"))}
                    alt="photo"
                    />
                    <p className="lead fs-4">me</p>
                </div>
                <div className="container d-flex flex-column align-items-center mt-4">
                    <h1
                    className="lead"
                    style={{
                        fontSize: "30px"
                    }}
                    >Add Contact</h1>

                    <form
                    className="d-flex flex-column align-items-center"
                    style={{ width: "80%" }}
                    onSubmit={event => add_contact(event)}
                    >
                        <input
                        className="form-control rounded-2 p-2"
                        type="text"
                        ref={input}
                        placeholder="enter your friend's code here"
                        maxLength={10}
                        onChange={handleInputChange}
                        />

                        <input
                        style={{
                            marginTop: 10,
                            width: "100px",
                            padding: "5px",
                            border: "none",
                            backgroundColor: (disableContactBtn ? "rgba(13, 109, 253, 0.39)":"rgb(13, 110, 253)"),
                            borderRadius: "5px",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                        type="submit"
                        value="save"
                        disabled={disableContactBtn}
                        />
                    </form>
                </div>

                <div className="container d-flex flex-column align-items-center mt-5">
                    <h1
                    className="lead"
                    style={{
                        fontSize: "35px"
                    }}
                    >conversations</h1>
                    <ul>
                        {inbox.map((contact, index) => 
                            <Dropdown
                            key={index}
                            className="container d-flex flex-column align-items-center pb-3 mt-2 shadow"
                            style={{
                                left: -15,
                                backgroundColor: "rgba(141, 0, 160, 0.082)",
                                borderRadius: "20px"
                            }}>
                                <Dropdown.Toggle
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    color: "black"
                                }}/>
                                <Dropdown.Menu>
                                    <Dropdown.Item
                                    onClick={() => remove_conversation(contact)}>
                                    remove conversation
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                                <img
                                style={{
                                    width: "60%",
                                    borderRadius: "20px",
                                    cursor: "pointer"
                                }}
                                onClick={() => handleImageClick(contact.photo)}
                                src={("http://192.168.0.7:8080/media" + (contact.photo || "/default_user_photo.jpg"))}
                                alt="photo"
                                />
                                <div
                                className="container d-flex flex-column align-items-center text-center"
                                style={{ cursor: "pointer" }}
                                onClick={() => props.selectContact(contact)}>
                                    <p className="lead fs-3 mb-0">{contact.username}</p>
                                    <p style={{ fontSize: "70%" }}>{contact.code}</p>
                                    <p className="mb-0">{cropText(contact.message, 20)}</p>
                                    {contact.dateTime && 
                                    <span style={{ fontSize: "80%" }}
                                    >{UTC_to_Local(contact.dateTime)}</span>}
                                </div>
                            </Dropdown>
                        )}
                    </ul>
                    <ImgDisplayer
                    setTrigger={setDisplay}
                    trigger={display}
                    src={imgSrc}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
        className="container-fluid d-flex flex-column align-items-center p-0"
        style={{
            maxHeight: "100vh",
            overflowY: "auto",
        }}>
            <div
            style={{ cursor: "pointer" }}
            className="container d-flex flex-column align-items-center pt-3 cursor-pointer"
            onClick={() => props.set_profile_window(true)}>
                <img
                className="rounded-circle"
                style={{ height: "100px" }}
                src={("http://192.168.0.7:8080/media" + (props.client.photo_url || "/default_user_photo.jpg"))}
                alt="photo"
                />
                <p className="lead fs-4">me</p>
            </div>
            <div className="container d-flex flex-column align-items-center mt-4">
                <h1
                className="lead"
                style={{
                    fontSize: "30px"
                }}
                >Add Contact</h1>

                <form
                className="d-flex flex-column align-items-center"
                style={{ width: "80%" }}
                onSubmit={event => add_contact(event)}
                >
                    <input
                    className="form-control rounded-2 p-2"
                    type="text"
                    ref={input}
                    placeholder="enter your friend's code here"
                    maxLength={10}
                    onChange={handleInputChange}
                    />

                    <input
                    style={{
                        marginTop: 10,
                        width: "100px",
                        padding: "5px",
                        border: "none",
                        backgroundColor: (disableContactBtn ? "rgba(13, 109, 253, 0.39)":"rgb(13, 110, 253)"),
                        borderRadius: "5px",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}
                    type="submit"
                    value="save"
                    disabled={disableContactBtn}
                    />
                </form>
            </div>
            <div className="container d-flex flex-column align-items-center mt-5">
                <h1
                className="lead"
                style={{
                    fontSize: "35px"
                }}
                >conversations</h1>
                <p className="mt-5 text-center">Your contacts and conversations will appear here.</p>
            </div>
        </div>
    );
  }
  
  export default Inbox;