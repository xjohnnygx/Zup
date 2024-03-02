import { useState, ChangeEvent } from "react";
import { New_User } from "../types/user";
import { formFilled } from "../utils/forms";
import { validEmail } from "../utils/email";


type SignUp_Props = {
    current_window: React.Dispatch<React.SetStateAction<boolean>>;
    verificationCode_window: React.Dispatch<React.SetStateAction<boolean>>;
    set_payload: React.Dispatch<React.SetStateAction<New_User>>;
};

function SignUp(props: SignUp_Props): JSX.Element {

    const user: New_User = {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    };

    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState(user);

    const store_value = (event: ChangeEvent<HTMLInputElement>): void => {
        const name: string = event.target.name;
        const value: string = event.target.value;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    function successful_response(): void {
        props.set_payload(formData);
        props.current_window(false);
        props.verificationCode_window(true);
    }

    async function sendForm(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        try {
            if (!formFilled(formData)) {
                setErrorMessage("The form must be filled!");
                return;
            }
            if (!validEmail(formData.email)) {
                setErrorMessage("Invalid email address");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setErrorMessage("Password does not match!");
                return;
            }
            const response: Response = await fetch("http://192.168.0.7:8080/request_authentication_code", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData.email)
            });
            switch (response.status) {
                case 200:
                    successful_response();
                    break;
                case 409:
                    setErrorMessage(await response.json());
                    break;
                default:
                    console.error(await response.json());
                    alert(`something went wrong\nunable to process the request.`);
            }
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }

    return (
        <div className="container d-flex flex-column align-items-center pt-5">
            <h1
            className="lead"
            style={{
                fontSize: "80px",
            }}
            >sign up</h1>
            <form onSubmit={(event) => sendForm(event)} className="pt-5">
                <input
                className="form-control rounded-2 p-2"
                type="text"
                name="username"
                placeholder="username"
                maxLength={20}
                onChange={store_value}/>

                <input
                className="form-control rounded-2 p-2"
                type="email"
                name="email"
                placeholder="email"
                maxLength={50}
                onChange={store_value}/>

                <input
                className="form-control rounded-2 p-2"
                type="password"
                name="password"
                placeholder="password"
                maxLength={50}
                onChange={store_value}/>

                <input
                className="form-control rounded-2 p-2"
                type="password"
                name="confirmPassword"
                placeholder="confirm password"
                maxLength={50}
                onChange={store_value}/>

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
                        onClick={() => props.current_window(false)}
                        />
                    </div>
                    <div className="col">
                        <input
                        className="bg-blue"
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
                        value="create account"
                        />
                    </div>
                </div>
            </form>
        </div>
    );
  }
  
  export default SignUp;