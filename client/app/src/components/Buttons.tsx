import image1 from "../externals/61c380b79608b4e57f416924_texting.jpeg";
import image2 from "../externals/image2.jpg";
import { useState } from "react";

type ButtonsProps = {
    signIn_window: React.Dispatch<React.SetStateAction<boolean>>;
    signUp_window: React.Dispatch<React.SetStateAction<boolean>>;
};

function Buttons(props: ButtonsProps): JSX.Element {

    const [onMobile, setOnMobile] = useState(!window.matchMedia("(min-width: 768px)").matches);

    return (
        <div className="container-fluid p-0">
            {(!onMobile) && 
                (
                    <>
                    <div className="row">
                        <div className="col">
                            <img
                            style={{
                                position: "absolute",
                                bottom: "5vh",
                                left: "5vh",
                                width: "40vw",
                                height: "auto",
                                borderRadius: "20px",
                            }}
                            src={image1}/>
                        </div>
                        <div className="col">
                            <div
                            style={{
                                position: "absolute",
                                bottom: "5vh",
                                right: "10vw",
                                width: "40vw",
                                height: "50vh",
                                borderRadius: "20px",
                                backgroundColor: "rgba(255, 255, 0, 0.5)",
                                zIndex: -1
                            }}/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <div
                            style={{
                                position: "absolute",
                                top: "5vh",
                                left: "10vw",
                                width: "40vw",
                                height: "50vh",
                                borderRadius: "20px",
                                backgroundColor: "rgba(160, 0, 160, 0.164)",
                                zIndex: -1
                            }}/>
                        </div>
                        <div className="col">
                            <img
                            style={{
                                position: "absolute",
                                top: "5vh",
                                right: "5vh",
                                width: "40vw",
                                height: "auto",
                                borderRadius: "20px",
                            }}
                            src={image2}/>
                        </div>
                    </div>
                    </>
                )
            }
            <div className="container-fluid" style={{ position: "absolute", top: 0 }}>
                <div className="container-fluid d-flex justify-content-center pt-5">
                    <h1
                    style={{
                        margin: "50px",
                        fontSize: "200px",
                        fontWeight: "bolder"
                    }}
                    >Zup!</h1>
                </div>
                <div className="container-fluid d-flex justify-content-center">

                    <button
                    className="btn bg-teal text-white"
                    style={{
                        width: "200px",
                        borderRadius: "10px",
                        margin: "5px",
                        fontSize: "40px",
                        fontWeight: "bold"
                    }}
                    onClick={() => props.signIn_window(true)}
                    >sign in</button>

                    <button
                    className="btn bg-pink text-white"
                    style={{
                        width: "200px",
                        borderRadius: "10px",
                        margin: "5px",
                        fontSize: "40px",
                        fontWeight: "bold"
                    }}
                    onClick={() => props.signUp_window(true)}
                    >sign up</button>
                </div>
            </div>
        </div>
    );
}

export default Buttons;