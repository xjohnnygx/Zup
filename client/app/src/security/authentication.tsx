async function authorized(): Promise<boolean> {
    try {
        const access_token = localStorage.getItem("access_token");
        const response: Response = await fetch("http://127.0.0.1:8080/verify_authentication", {
            method: "GET",
            headers: {"Authorization": access_token ? access_token : ""}
        });
        if (response.status !== 200) {
            return false;
        }
        const user = await response.json();
        sessionStorage.setItem("client", JSON.stringify(user));
        return true;
    }
    catch {
        return false;
    }
}

export {
    authorized
};