import { New_User } from "../types/user";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StopWatch from "./StopWatch";


type VerificationCode_Props = {
    current_window: React.Dispatch<React.SetStateAction<boolean>>;
    signUp_window: React.Dispatch<React.SetStateAction<boolean>>;
    payload: New_User;
};

function VerificationCode(props: VerificationCode_Props): JSX.Element {

    delete props.payload.confirmPassword;

    const navigate = useNavigate();
    const input = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState("");

    async function successful_response(response: Response): Promise<void> {
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token_type", data.token_type);
        navigate("/main");
    }

    async function sendForm(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        try {
            if (input.current && input.current.value) {
                const response: Response = await fetch("http://192.168.0.7:8080/sign_up?authentication_code=" + (input.current.value), {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(props.payload)
                });
                switch (response.status) {
                    case 201:
                        successful_response(response);
                        break;
                    case 401:
                        setErrorMessage(await response.json());
                        break;
                    default:
                        console.error(await response.json());
                        alert(`something went wrong\nunable to process the request.`);
                }
            }
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }

    function handle_window(): void {
        props.current_window(false);
        props.signUp_window(true);
    }

    return (
        <div className="container d-flex flex-column align-items-center pt-5">

            <h1
            className="lead"
            style={{
                fontSize: "70px",
            }}
            >verify email</h1>

            <p className="mb-0 pt-5">An email was sent to <strong>{props.payload.email}</strong></p>
            <p>please enter the code received in order to validate your new account.</p>

            <StopWatch minutes={2} seconds={59}/>

            <form onSubmit={(event) => sendForm(event)}>
                <input
                className="form-control rounded-2 p-2"
                ref={input}
                type="text"
                name="code"
                placeholder="enter code"
                maxLength={4}/>

                { errorMessage && <p style={{color: "red"}}>{ errorMessage }</p> }

                <div className="row pt-5">
                    <div className="col">
                        <input
                        className="bg-silver"
                        style={{
                            width: "160px",
                            padding: "10px",
                            border: "none",
                            borderRadius: "10px",
                            color: "white",
                            fontSize: "20px",
                            fontWeight: "bold",
                        }}
                        type="button"
                        value="← Go back"
                        onClick={handle_window}
                        />
                    </div>
                    <div className="col">
                        <input
                        className="bg-pink"
                        style={{
                            width: "160px",
                            padding: "10px",
                            border: "none",
                            borderRadius: "10px",
                            color: "white",
                            fontSize: "20px",
                            fontWeight: "bold",
                        }}
                        type="submit"
                        value="verify"
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}

export default VerificationCode;