function Hash(data: string): string {
    const characters: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var inverted: string = "";
    var result: string = "";
    for (var i: number = 0; i < data.length; ++i) {
        inverted = data[i] + inverted;
    }
    for (var i: number = 0; i < data.length; ++i) {
        result += characters[Math.floor(Math.random() * characters.length)];
        result += characters[Math.floor(Math.random() * characters.length)];
        result += inverted[i];
    }
    return result;
}

function unHash(hash: string): string {
    var inverted: string = "";
    var result: string = "";
    for (var i: number = 2; i < hash.length; i += 3) {
        inverted += hash[i];
    }
    for (var i: number = 0; i < inverted.length; ++i) {
        result = inverted[i] + result;
    }
    return result;
}

export {
    Hash,
    unHash,
};