import { getFakePage, configs, backimg, subapi, mihomo_top, singbox_1_11, singbox_1_12, singbox_1_12_alpha, beiantext, beiandizi } from './utils.js';
import { getmihomo_config } from './mihomo.js';
import { getsingbox_config } from './singbox.js';

export default async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userAgent = req.headers['user-agent'];
    const rule = url.searchParams.get('template');
    const singbox = url.searchParams.get('singbox');
    const dns = url.searchParams.get('dns');
    const udp = url.searchParams.get('udp');
    const IMG = process.env.IMG || backimg;
    const sub = process.env.SUB || subapi;
    const Mihomo_default = process.env.MIHOMO || mihomo_top;
    const Singbox_default = {
        singbox_1_11: process.env.SINGBOX_1_11 || singbox_1_11,
        singbox_1_12: process.env.SINGBOX_1_12 || singbox_1_12,
        singbox_1_12_alpha: process.env.SINGBOX_1_12_ALPHA || singbox_1_12_alpha,
    };
    const beian = process.env.BEIAN || beiantext;
    const beianurl = process.env.BEIANURL || beiandizi;

    const variable = {
        userAgent,
        IMG,
        sub,
        Mihomo_default,
        Singbox_default,
        beian,
        beianurl,
    };

    let urls = url.searchParams.getAll('url');
    if (urls.length === 1 && urls[0].includes(',')) {
        urls = urls[0].split(',').map((u) => u.trim());
    }

    if (urls.length === 0 || urls[0] === '') {
        const html = await getFakePage(variable, configs());
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.statusCode = 200;
        res.end(html);
        return;
    }

    try {
        let result;
        if (singbox) {
            result = await getsingbox_config(urls, rule, Singbox_default, userAgent, sub);
        } else {
            result = await getmihomo_config(urls, rule, Mihomo_default, userAgent, sub, dns, udp);
        }

        const rawHeaders = result.headers || {};
        const headersToIgnore = ['transfer-encoding', 'content-length', 'content-encoding', 'connection'];

        for (const [key, value] of Object.entries(rawHeaders)) {
            if (!headersToIgnore.includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Profile-web-page-url', url.origin);
        res.statusCode = result.status || 200;
        res.end(result.data);
    } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: err.message }));
    }
}
