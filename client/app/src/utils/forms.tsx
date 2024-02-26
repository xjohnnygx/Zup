function formFilled(form: Record<string, any>): boolean {
    for (var field in form) {
        if (!form[field] || /^\s*$/.test(form[field])) {
            return false;
        }
    }
    return true;
}


export {
    formFilled
};