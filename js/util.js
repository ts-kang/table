export function format(str, ...args) {
    var ret = str;
    args.forEach((arg, i) => ret = ret.replace('{' + i + '}', arg));
    return ret;
}

export async function readPage(url, data={}) {
    const response = await fetch('https://cors-header-proxy.nnyan.workers.dev/?' + url, data);
    if (!response.ok)
        return Promise.reject('error: ' + response.status + ' - ' + response.statusText);

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
            .replace(/[･〜]/g, '')
            .replace('焱', '火')
    )
        .trim()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)) // full-width to half-width
        .replace(/[\u0020-\u002f\u003a-\u0040\u007b-\u007e\u00a0-\u00bf\u2000-\u206f\u0020]/g, '') // remove special characters
        .replaceAll('Χ', 'X') // 'Chi' to 'X'
        .toLowerCase();
}
