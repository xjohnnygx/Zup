import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authorized } from "../security/authentication";
import { User } from "../types/user";
import { Contact } from "../types/contact";
import Inbox from "../components/Inbox";
import Chat from "../components/Chat";
import Profile from "../components/Profile";


function Main(): JSX.Element {

    const [client, setClient] = useState<User|null>(null);
    const [contact, setContact] = useState<Contact|null>(null);
    const [profile, setProfile] = useState(false);
    const [updateInbox, setUpdateInbox] = useState(false);
    const [onMobile, setOnMobile] = useState(!window.matchMedia("(min-width: 768px)").matches);
    const [visibilityChange, setVisibilityChange] = useState(false);
    const navigate = useNavigate();
    useEffect(function() {
        async function verify_authentication() {
            if (!(await authorized())) {
                navigate("/");
            }
            setClient(JSON.parse(sessionStorage.getItem("client") as string));
        }
        verify_authentication();
    },[]);

    useEffect(function() {
        document.addEventListener("visibilitychange", function() {
            if (document.visibilityState === "visible") {
                setVisibilityChange(state => !state);
            }
        });
    },[]);

    if (client) {
        if (onMobile) {
            if (contact) {
                return (
                    <Chat
                    client={client}
                    contact={contact}
                    setContact={setContact}
                    updateInbox={setUpdateInbox}
                    visibilityChange={visibilityChange}
                    />
                );
            }
            if (profile) {
                return (
                    <Profile
                    client={client}
                    setClient={setClient}
                    current_window={setProfile}
                    />
                );
            }
            return (
                <Inbox
                client={client}
                selectContact={setContact}
                set_profile_window={setProfile}
                updateInbox={updateInbox}
                visibilityChange={visibilityChange}
                />
            );
        }
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-3">
                        {(profile) ? (
                            <Profile
                            client={client}
                            setClient={setClient}
                            current_window={setProfile}
                            />
                        ) :
                        (
                            <Inbox
                            client={client}
                            selectContact={setContact}
                            set_profile_window={setProfile}
                            updateInbox={updateInbox}
                            visibilityChange={visibilityChange}
                            />
                        )}
                    </div>
                    <div className="col-9">
                        <Chat
                        client={client}
                        contact={contact}
                        setContact={setContact}
                        updateInbox={setUpdateInbox}
                        visibilityChange={visibilityChange}
                        />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="container-fluid"></div>
    );
}
  
  export default Main;