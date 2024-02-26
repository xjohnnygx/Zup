// Verify email function
function validEmail(email: string): boolean {
    // Regular expression pattern to check email format
    const pattern: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Check if the email matches the pattern
    return pattern.test(email);
}

export {
    validEmail
};