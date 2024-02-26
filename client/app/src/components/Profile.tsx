import { useNavigate } from "react-router-dom";
import { User } from "../types/user";
import { useState, useRef, ChangeEvent, SyntheticEvent } from "react";
import { Hash } from "../security/encryption";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCamera, faPenToSquare, faUpload } from "@fortawesome/free-solid-svg-icons";
import ReactCrop, { makeAspectCrop, type Crop, centerCrop } from 'react-image-crop';
import { ImgDisplayer } from "../utils/imageDisplayer";
import 'react-image-crop/dist/ReactCrop.css';

const minimum_size = 200; // px

type Profile_Props = {
    client: User;
    setClient: React.Dispatch<React.SetStateAction<User|null>>;
    current_window: React.Dispatch<React.SetStateAction<boolean>>;
};

function Profile(props: Profile_Props): JSX.Element {

    const navigate = useNavigate();
    const [photoForm, setPhotoForm] = useState(false);
    const [usernameForm, setUsernameForm] = useState(false);
    const [enableTextField, setEnableTextField] = useState(false);
    const [photoCropper, setPhotoCropper] = useState(false);
    const [crop, setCrop] = useState<Crop>();
    const [imageSrc, setImageSrc] = useState<string|null>(null);
    const [display, setDisplay] = useState(false);
    const uploadButtonRef = useRef<HTMLInputElement>(null);
    const textFieldRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);


    async function remove_photo(): Promise<void> {
        try {
            const response: Response = await fetch("http://127.0.0.1:8080/remove_photo?client=" + (Hash(props.client.code)), {
                method: "DELETE",
            });
            if (response.status !== 200) {
                alert(`something went wrong\nunable to process the request.`);
                return;
            }
            props.setClient({
                ...props.client,
                photo_url: null
            });
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }


    async function update_photo(data: FormData): Promise<void> {
        try {
            const response: Response = await fetch("http://127.0.0.1:8080/update_photo", {
                method: "PUT",
                body: data
            });
            if (response.status !== 200) {
                alert(`something went wrong\nunable to process the request.`);
                return;
            }
            const newURL = await response.json();
            props.setClient({
                ...props.client,
                photo_url: newURL
            });
        }
        catch (error) {
            console.error(error);
            alert(`something went wrong\nunable to process the request.`);
        }
    }


    async function update_username(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        if (textFieldRef.current && !(/^\s*$/.test(textFieldRef.current.value))) {
            event.preventDefault();
            try {
                const response: Response = await fetch("http://127.0.0.1:8080/update_username", {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        username: textFieldRef.current.value,
                        client: props.client.userID,
                    }),
                });
    
                if (response.status !== 200) {
                    alert(`Something went wrong. Unable to process the request.`);
                    setUsernameForm(false)
                    return;
                }
    
                props.setClient({
                    ...props.client,
                    username: textFieldRef.current.value,
                });
                setUsernameForm(false)
            } catch (error) {
                console.error(error);
                alert(`Something went wrong. Unable to process the request.`);
                setUsernameForm(false)
            }
        }
    }
    


    function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
        if (event.target.files) {
            const file: File = event.target.files[0];
            const reader: FileReader = new FileReader();
            reader.addEventListener("load", function() {
                const image: HTMLImageElement = new Image();
                const url = (reader.result as string);
                image.src = url;
                image.addEventListener("load", function() {
                    if (image.width < minimum_size || image.height < minimum_size) {
                        alert("Image must be at least 200 x 200 pixels.");
                        setImageSrc(null);
                        return;
                    }
                    setImageSrc(url);
                    setPhotoCropper(true);
                });
            });
            reader.addEventListener("error", function() {
                alert(`something went wrong\nunable to process the request.`);
            });
            reader.readAsDataURL(file);
        }
    }
    


    function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
        if (!(/^\s*$/.test(event.target.value))) {
            setEnableTextField(true);
        }
        else {
            setEnableTextField(false);
        }
    }


    function onImageLoad(event: SyntheticEvent<HTMLImageElement, Event>): void {
        const { width, height } = event.currentTarget;
        const cropDetails = makeAspectCrop(
            { unit: "%", width: width },
            1,
            width,
            height
        );
        const crop = centerCrop(cropDetails, width, height);
        setCrop(crop);
    }


    function cropImage(): void {
        if (
            crop &&
            imageRef.current &&
            canvasRef.current &&
            uploadButtonRef.current &&
            uploadButtonRef.current.files
            ) {
            const file = uploadButtonRef.current.files[0];
            const image = imageRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            const cropX_px = (crop.x * image.naturalWidth) / 100;
            const cropY_px = (crop.y * image.naturalHeight) / 100;
            const cropWidth_px = (crop.width * image.naturalWidth) / 100;
            const cropHeight_px = (crop.height * image.naturalHeight) / 100;
            canvas.width = cropWidth_px;
            canvas.height = cropHeight_px;
            context?.drawImage(
                image,
                cropX_px,
                cropY_px,
                image.naturalWidth,
                image.naturalHeight,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight
            );
            canvas.toBlob(function(blob) {
                if (blob) {
                    const formData: FormData = new FormData();
                    formData.append("photo", blob, file.name);
                    formData.append("client", props.client.code);
                    update_photo(formData);
                }
            });
            setPhotoCropper(false);
        }
    }


    function sign_out(): void {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");
        sessionStorage.removeItem("client");
        navigate("/");
    }

    return (
        <div
        className="container-fluid d-flex flex-column align-items-center p-0"
        style={{
            height: "100vh",
            overflowY: "auto",
        }}>
            <div className="container d-flex flex-column align-items-center mt-5">
                <img
                style={{
                    width: "60%",
                    borderRadius: "20px",
                    cursor: "pointer"
                }}
                onClick={() => setDisplay(true)}
                src={("http://127.0.0.1:8080/media" + (props.client.photo_url || "/default_user_photo.jpg"))}
                alt="photo"
                />
                <div className="row">
                    <div className="col m-3">
                        <FontAwesomeIcon
                        title="upload photo"
                        style={{ cursor: "pointer" }}
                        onClick={() => uploadButtonRef.current?.click()}
                        icon={ faCamera }/>
                        <input
                        type="file"
                        name="photo"
                        ref={ uploadButtonRef }
                        accept="image/*"
                        onChange={event => handleFileChange(event)}
                        hidden
                        />
                    </div>
                    <div className="col m-3">
                        <FontAwesomeIcon
                        title="remove photo"
                        style={{ cursor: "pointer" }}
                        onClick={() => remove_photo()}
                        icon={ faTrash }/>
                    </div>
                </div>
                <p className="mb-0" style={{ fontSize: "90%" }}>username</p>
                <p className="lead fs-3 mb-0" style={{ marginTop: -8 }}>{props.client.username}</p>
                <span>
                    <FontAwesomeIcon
                    title="edit username"
                    style={{ cursor: "pointer" }}
                    onClick={() => setUsernameForm(true)}
                    icon={ faPenToSquare }/>
                </span>
                <p className="mt-3 mb-0" style={{ fontSize: "90%" }}>email</p>
                <p>{props.client.email}</p>
                <p className="mb-0" style={{ fontSize: "90%" }}>code</p>
                <p style={{ fontSize: "90%" }}>{props.client.code}</p>
            </div>
            {/* image displayer */}
            <ImgDisplayer
            setTrigger={setDisplay}
            trigger={display}
            src={props.client.photo_url}
            />

            {/* username form */}
            <Modal
            centered
            show={ usernameForm }
            >
                <Modal.Header className="container d-flex flex-column align-items-center">
                    <Modal.Title className="lead">new username</Modal.Title>
                </Modal.Header>
                <Modal.Body className="container d-flex flex-column align-items-center">
                    <form onSubmit={event => update_username(event)}>
                        <input
                        className="form-control rounded-2 p-2"
                        type="text"
                        name="username"
                        placeholder="username"
                        maxLength={20}
                        ref={textFieldRef}
                        onChange={event => handleInputChange(event)}
                        />

                        <div className="row mt-3">
                            <div className="col">
                                <input
                                className="bg-silver rounded-2 text-white p-1"
                                style={{
                                    width: "100%",
                                    border: "none",
                                }}
                                type="button"
                                value="cancel"
                                onClick={() => setUsernameForm(false)}
                                />
                            </div>
                            <div className="col">
                                <input
                                className="rounded-2 text-white p-1"
                                style={{
                                    backgroundColor: (!enableTextField ? "rgba(13, 109, 253, 0.39)" : "#0d6dfdda"),
                                    width: "100%",
                                    border: "none",
                                }}
                                type="submit"
                                value="set"
                                disabled={!enableTextField}
                                />
                            </div>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* image cropper */}
            <Modal
            size="xl"
            centered
            show={photoCropper}
            onHide={() => setPhotoCropper(false)}
            >
                <Modal.Header className="container d-flex flex-column align-items-center">
                    <Modal.Title className="lead">Adjust Image</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {imageSrc && (
                        <div className="container-fluid d-flex flex-column align-items-center">
                            <ReactCrop
                            crop={crop}
                            onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                            >
                            <img
                            ref={imageRef}
                            src={imageSrc}
                            onLoad={event => onImageLoad(event)}
                            />
                            <canvas
                            ref={canvasRef}
                            style={{ display: "none" }}
                            />
                            </ReactCrop>

                            <button
                            className="bg-transparent fs-4 rounded-2 mt-3"
                            style={{ width: "150px" }}
                            onClick={() => cropImage()}>set</button>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
            <div className="row">
                <div className="col">
                    <button
                    style={{ width: "120px" }}
                    className="bg-transparent rounded-2 p-1 mt-3"
                    onClick={() => props.current_window(false)}
                    >back</button>
                </div>
                <div className="col">
                    <button
                    style={{ width: "120px" }}
                    className="bg-transparent rounded-2 p-1 mt-3"
                    onClick={sign_out}
                    >sign out</button>
                </div>
            </div>
        </div>
    );
}

export default Profile