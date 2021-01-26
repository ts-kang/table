export function format(str, ...args) {
    var ret = str;
    args.forEach((arg, i) => ret = ret.replace('{' + i + '}', arg));
    return ret;
}

export async function readPage(url, data={}) {
    const response = await fetch('https://cors-header-proxy.nnyan.workers.dev/?' + url, data);
    if (!response.ok)
        return Promise.reject('error: ' + response.status + ' - ' + response.statusText);

    return await response.text();
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
