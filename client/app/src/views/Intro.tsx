import Buttons from "../components/Buttons";
import Sign_in from "../components/SignIn";
import Sign_up from "../components/SignUp";
import VerificationCode from "../components/VerificationCode";
import { authorized } from "../security/authentication";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { New_User } from "../types/user";


function Intro(): JSX.Element {

    const navigate = useNavigate();
    useEffect(function() {
        async function verify_authentication() {
            if (await authorized()) {
                navigate("/main");
            }
        }
        verify_authentication();
    },[]);


    const form: New_User = {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    }

    const [signIn_window, set_SignIn_window] = useState(false);
    const [signUp_window, set_SignUp_window] = useState(false);
    const [verificationCode_window, set_VerificationCode_window] = useState(false);
    const [user, setUser] = useState<New_User>(form);

    if (signIn_window) {
        return (
            <Sign_in
            current_window={set_SignIn_window}
            />
        );
    }

    if (signUp_window) {
        return (
            <Sign_up
            current_window={set_SignUp_window}
            verificationCode_window={set_VerificationCode_window}
            set_payload={setUser}
            />
        );
    }

    if (verificationCode_window) {
        return (
            <VerificationCode
            current_window={set_VerificationCode_window}
            signUp_window={set_SignUp_window}
            payload={user}
            />
        );
    }

    return (
        <Buttons
        signIn_window={set_SignIn_window}
        signUp_window={set_SignUp_window}
        />
    );
}
  
  export default Intro;