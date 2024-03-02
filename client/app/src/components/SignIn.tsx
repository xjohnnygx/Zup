import { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { User_Log } from "../types/user";
import { formFilled } from "../utils/forms";
import { validEmail } from "../utils/email";


type SignIn_Props = {
    current_window: React.Dispatch<React.SetStateAction<boolean>>;
};

function SignIn(props: SignIn_Props): JSX.Element {

    const user: User_Log = {
        email: "",
        password: "",
    };

    const navigate = useNavigate();
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

    async function successful_response(response: Response): Promise<void> {
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token_type", data.token_type);
        navigate("/main");
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
            const response: Response = await fetch("http://192.168.0.7:8080/sign_in", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData)
            });
            switch (response.status) {
                case 200:
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
            >sign in</h1>

            <form onSubmit={(event) => sendForm(event)} className="pt-5">
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
                        value="enter"
                        />
                    </div>
                </div>
            </form>
        </div>
    );
  }
  
  export default SignIn;