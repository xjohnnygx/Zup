import { Modal } from "react-bootstrap";

type ImgDisplayerProps = {
    setTrigger: React.Dispatch<React.SetStateAction<boolean>>;
    trigger: boolean;
    src: string|null;
};

function ImgDisplayer(props: ImgDisplayerProps): JSX.Element {
    return (
        <Modal
        size="lg"
        centered
        show={props.trigger}
        onHide={() => props.setTrigger(false)}
        >
            <img
            src={"http://127.0.0.1:8080/media" + (props.src || "/default_user_photo.jpg")}
            alt="photo"
            />
        </Modal>
    );
}

export {
    ImgDisplayer,
};