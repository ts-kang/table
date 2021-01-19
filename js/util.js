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
