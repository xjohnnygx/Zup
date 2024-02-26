function UTC_to_Local(timestamp: string): string {
    // Create a Date object in UTC from the UTC timestamp string
    const utcDate = new Date(timestamp + " UTC");
    // Get the local date and time string
    const localDate = utcDate.toLocaleString();

    return localDate;
}

export {
    UTC_to_Local
};