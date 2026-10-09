import type {NextConfig} from 'next';
const config:NextConfig={output:'standalone',poweredByHeader:false,experimental:{cpus:2},async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]},{source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]}]}};
export default config;
