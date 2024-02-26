function cropText(text: string, len: number): string {
    if (text.length > len) {
        var textCropped: string = "";
        for (var i = 0; i < len; ++i) {
            textCropped += text[i];
        }
        return (textCropped + "...");
    }
    return text;
}

export {
    cropText,
};