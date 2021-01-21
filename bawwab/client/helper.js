/* turn HTTP response into a meaningful exception */
export async function getResponse (r) {
	const j = await r.json ();
	if (r.ok) {
		return j;
	} else if (r.status == 403 && (j.status == 'no_tos' || j.status == 'new_tos')) {
		throw Error ('need_tos');
	} else if (j.status) {
		throw Error (j.status);
	}
	throw Error ('bug');
}

export function postData(url = '', data = {}) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

