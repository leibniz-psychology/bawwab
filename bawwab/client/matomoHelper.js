export function getUserIdFromCookie() {
    let userId = "";
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        if (cookie.startsWith("_pk_id")) {
            userId = cookie.split("=")[1].split(".")[0];
        }
    }
    return userId;
}