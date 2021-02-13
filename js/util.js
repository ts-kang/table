export function format(str, ...args) {
    var ret = str;
    args.forEach((arg, i) => ret = ret.replace('{' + i + '}', arg));
    return ret;
}

export async function readPage(url, data={}) {
    console.log('fetching... ' + url);
    const response = await fetch('https://cors-header-proxy.nnyan.workers.dev/?' + url, data);
    if (!response.ok)
        throw new Error('failed to fetch. HTTP status ' + response.status);

    return response;
}

export async function loadLibrary(relpath) {
    return new Promise((resolve, _) => {
        if (document.querySelector(`script[data-lib="${relpath}"]`)) {
            resolve();
            return;
        }
        let script = document.createElement('script');
        script.onload = () => resolve();
        script.dataset.lib = relpath;
        script.src = './js/lib/' + relpath;
        document.head.appendChild(script);
    });
}

export function normalize(str) {
    return latinize(
        str.trim()
            .replace(/§/g, 'ss')
            .replace(/Χ/g, 'X') // 'Chi' to 'X'
            //.replace(/[””]/g, '"')
            .replace(/焱/g, '火')
            .replace(/[･]/g, '.')
            .replace(/♥/g, '')
            //.replace(/[･〜]/g, '')
    )
        .trim()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)) // full-width to half-width
        //.replace(/[\u0020-\u002f\u003a-\u0040\u007b-\u007e\u00a0-\u00bf\u2000-\u206f\u0020]/g, '') // remove special characters
        .replace(/ /g, '')
        .toLowerCase();
}

// Levenshtein Distance
// https://en.wikipedia.org/wiki/Levenshtein_distance
export function lev(a, b) {
    if (!b || b.length === 0)
        return a ? a.length : 0;
    if (!a || a.length === 0)
        return b ? b.length : 0;

    let v0 = [...new Array(b.length).keys()];
    let v1 = new Array(b.length).fill(0);

    for (let i = 0; i < a.length; ++i) {
        v1[0] = i + 1;

        for (let j = 0; j < b.length; ++j)
            v1[j + 1] = Math.min(
                v0[j + 1] + 1,
                v1[j] + 1,
                a.charAt(i) === b.charAt(j) ? v0[j] : (v0[j] + 1));

        [v0, v1] = [v1, v0];
    }

    return v0[b.length - 1];
}
